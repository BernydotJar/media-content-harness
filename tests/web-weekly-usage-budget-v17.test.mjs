import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {AtomicRepository,newState} from '../server/repository.mjs'
import {DEFAULT_WEEKLY_USAGE_POLICY,providerBudgetQuote,reserveUsageBudget,commitUsageBudget,settleUsageBudget,releaseUsageBudget,usageBudgetProjection,USAGE_CATEGORY} from '../server/usage-budget.mjs'

const at=(iso)=>Date.parse(iso)
const newJob=id=>({id,tenant_id:'firmes',generation_attempts:[]})
const repairJob=id=>({id,tenant_id:'firmes',repair_revision:1,generation_attempts:[{attempt_id:'prior',spend_approval_id:'spend-prior',estimate:{cost:1,currency:'USD'},status:'COMPLETED'}]})
const estimateGtq=cost=>({cost,currency:'GTQ',kind:'TEST_UPPER_BOUND'})

test('Q200 weekly policy exposes one daily new-video slot and protected repair reserve',()=>{
 const state=newState(),policy=DEFAULT_WEEKLY_USAGE_POLICY,tuesday=at('2026-09-22T16:00:00Z')
 const quote=providerBudgetQuote(newJob('one'),{cost:1.9416,currency:'USD'},policy,tuesday)
 assert.equal(quote.category,USAGE_CATEGORY.NEW_GENERATION);assert.equal(quote.estimated_gtq,14.81);assert.equal(quote.item_cap_gtq,22);assert.equal(quote.within_item_cap,true)
 const first=reserveUsageBudget(state,{tenantId:'firmes',job:newJob('one'),estimate:{cost:1.9416,currency:'USD'},scopeSha:'a'.repeat(64),approvalId:'approval-one',actorId:'owner',policy,epochMs:tuesday})
 assert.equal(first.amount_gtq,14.81)
 let summary=usageBudgetProjection(state,'firmes',{policy,epochMs:tuesday});assert.equal(summary.included_gtq,200);assert.equal(summary.used_gtq,14.81);assert.equal(summary.remaining_gtq,185.19);assert.equal(summary.new_generation.available_today,false);assert.equal(summary.repairs.remaining_gtq,46)
 assert.throws(()=>reserveUsageBudget(state,{tenantId:'firmes',job:newJob('two'),estimate:estimateGtq(10),scopeSha:'b'.repeat(64),approvalId:'approval-two',actorId:'owner',policy,epochMs:tuesday}),e=>e.code==='USAGE_DAILY_SLOT_USED')
})

test('an in-flight first paid attempt remains NEW_GENERATION during polling and recovery',()=>{
 const policy=DEFAULT_WEEKLY_USAGE_POLICY,now=at('2026-09-22T16:00:00Z'),job=newJob('in-flight');job.generation_attempts.push({attempt_id:'first',spend_approval_id:'approval-first',estimate:{cost:1.9416,currency:'USD'},status:'IN_PROGRESS'});assert.equal(providerBudgetQuote(job,{cost:1.9416,currency:'USD'},policy,now).category,USAGE_CATEGORY.NEW_GENERATION);job.repair_revision=1;assert.equal(providerBudgetQuote(job,{cost:1.9416,currency:'USD'},policy,now).category,USAGE_CATEGORY.PAID_REPAIR)
})

test('unused days never accumulate extra daily slots and a new week resets availability',()=>{
 const state=newState(),policy=DEFAULT_WEEKLY_USAGE_POLICY
 reserveUsageBudget(state,{tenantId:'firmes',job:newJob('mon'),estimate:estimateGtq(20),scopeSha:'1'.repeat(64),approvalId:'a1',actorId:'owner',policy,epochMs:at('2026-09-21T15:00:00Z')})
 assert.throws(()=>reserveUsageBudget(state,{tenantId:'firmes',job:newJob('mon-2'),estimate:estimateGtq(1),scopeSha:'2'.repeat(64),approvalId:'a2',actorId:'owner',policy,epochMs:at('2026-09-21T23:00:00Z')}),e=>e.code==='USAGE_DAILY_SLOT_USED')
 reserveUsageBudget(state,{tenantId:'firmes',job:newJob('wed'),estimate:estimateGtq(20),scopeSha:'3'.repeat(64),approvalId:'a3',actorId:'owner',policy,epochMs:at('2026-09-23T16:00:00Z')})
 const wed=usageBudgetProjection(state,'firmes',{policy,epochMs:at('2026-09-23T18:00:00Z')});assert.equal(wed.new_generation.used_today,1);assert.equal(wed.new_generation.used_gtq,40)
 const nextWeek=usageBudgetProjection(state,'firmes',{policy,epochMs:at('2026-09-28T16:00:00Z')});assert.equal(nextWeek.used_gtq,0);assert.equal(nextWeek.new_generation.available_today,true);assert.equal(nextWeek.new_generation.used_today,0)
})

test('seven Q22 new generations plus two Q23 repairs consume exactly Q200 without overage',()=>{
 const state=newState(),policy=DEFAULT_WEEKLY_USAGE_POLICY
 for(let day=21;day<=27;day++)reserveUsageBudget(state,{tenantId:'firmes',job:newJob('new-'+day),estimate:estimateGtq(22),scopeSha:String(day).padStart(64,'0'),approvalId:'new-'+day,actorId:'owner',policy,epochMs:at(`2026-09-${day}T16:00:00Z`)})
 reserveUsageBudget(state,{tenantId:'firmes',job:repairJob('repair-1'),estimate:estimateGtq(23),scopeSha:'c'.repeat(64),approvalId:'repair-1',actorId:'owner',policy,epochMs:at('2026-09-26T18:00:00Z')})
 reserveUsageBudget(state,{tenantId:'firmes',job:repairJob('repair-2'),estimate:estimateGtq(23),scopeSha:'d'.repeat(64),approvalId:'repair-2',actorId:'owner',policy,epochMs:at('2026-09-27T18:00:00Z')})
 const summary=usageBudgetProjection(state,'firmes',{policy,epochMs:at('2026-09-27T20:00:00Z')});assert.equal(summary.used_gtq,200);assert.equal(summary.remaining_gtq,0);assert.equal(summary.new_generation.used_gtq,154);assert.equal(summary.repairs.used_gtq,46);assert.equal(summary.repairs.used_count,2)
 assert.throws(()=>reserveUsageBudget(state,{tenantId:'firmes',job:repairJob('repair-3'),estimate:estimateGtq(1),scopeSha:'e'.repeat(64),approvalId:'repair-3',actorId:'owner',policy,epochMs:at('2026-09-27T21:00:00Z')}),e=>['USAGE_WEEKLY_CAP_EXCEEDED','USAGE_REPAIR_LIMIT_EXCEEDED'].includes(e.code))
})

test('per-item caps prevent one render or repair from consuming future days',()=>{
 const state=newState(),policy=DEFAULT_WEEKLY_USAGE_POLICY,now=at('2026-09-22T16:00:00Z')
 const quote=providerBudgetQuote(newJob('long'),estimateGtq(22.01),policy,now);assert.equal(quote.within_item_cap,false)
 assert.throws(()=>reserveUsageBudget(state,{tenantId:'firmes',job:newJob('long'),estimate:estimateGtq(22.01),scopeSha:'f'.repeat(64),approvalId:'long',actorId:'owner',policy,epochMs:now}),e=>e.code==='USAGE_ITEM_CAP_EXCEEDED')
 assert.throws(()=>reserveUsageBudget(state,{tenantId:'firmes',job:repairJob('big-repair'),estimate:estimateGtq(23.01),scopeSha:'9'.repeat(64),approvalId:'big-repair',actorId:'owner',policy,epochMs:now}),e=>e.code==='USAGE_ITEM_CAP_EXCEEDED')
})

test('reserved usage can be released before submission but committed provider spend cannot be fabricated back',()=>{
 const state=newState(),policy=DEFAULT_WEEKLY_USAGE_POLICY,now=at('2026-09-22T16:00:00Z')
 const entry=reserveUsageBudget(state,{tenantId:'firmes',job:newJob('one'),estimate:estimateGtq(18),scopeSha:'a'.repeat(64),approvalId:'approval',actorId:'owner',policy,epochMs:now})
 releaseUsageBudget(state,entry.id,{epochMs:now+1000,reason:'SCOPE_CHANGED'});assert.equal(usageBudgetProjection(state,'firmes',{policy,epochMs:now}).used_gtq,0)
 const second=reserveUsageBudget(state,{tenantId:'firmes',job:newJob('two'),estimate:estimateGtq(18),scopeSha:'b'.repeat(64),approvalId:'approval-2',actorId:'owner',policy,epochMs:now});commitUsageBudget(state,second.id,{epochMs:now+2000});assert.throws(()=>releaseUsageBudget(state,second.id,{epochMs:now+3000}),e=>e.code==='USAGE_RESERVATION_COMMITTED');settleUsageBudget(state,second.id,{epochMs:now+4000});const summary=usageBudgetProjection(state,'firmes',{policy,epochMs:now});assert.equal(summary.used_gtq,18);assert.equal(summary.entries[0].status,'SETTLED_ESTIMATE')
})

test('AtomicRepository serializes two same-day approvals so only one daily slot can reserve',async t=>{
 const root=await mkdtemp(join(tmpdir(),'weekly-budget-v17-'));t.after(()=>rm(root,{recursive:true,force:true}));const repository=new AtomicRepository(root),policy=DEFAULT_WEEKLY_USAGE_POLICY,now=at('2026-09-22T16:00:00Z')
 const reserve=(id,scope)=>repository.transact(state=>reserveUsageBudget(state,{tenantId:'firmes',job:newJob(id),estimate:estimateGtq(10),scopeSha:scope.repeat(64),approvalId:'approval-'+id,actorId:'owner',policy,epochMs:now}))
 const results=await Promise.allSettled([reserve('one','1'),reserve('two','2')]);assert.equal(results.filter(v=>v.status==='fulfilled').length,1);assert.equal(results.filter(v=>v.status==='rejected'&&v.reason?.code==='USAGE_DAILY_SLOT_USED').length,1)
 const state=await repository.read(),summary=usageBudgetProjection(state,'firmes',{policy,epochMs:now});assert.equal(summary.new_generation.used_today,1);assert.equal(summary.used_gtq,10)
})


test('V17 UX presents weekly usage as a protected creation week rather than an open credit wallet',async()=>{
 const [card,jobs,planner,workspace,http]=await Promise.all(['components/UsageBudgetCard.tsx','components/jobs.tsx','components/planner.tsx','components/workspace.tsx','server/http.mjs'].map(path=>readFile(path,'utf8')))
 for(const text of ['TU SEMANA DE CREACIÓN','Q{included.toFixed(0)} incluidos','video IA hoy','Protegido para la semana','Ajustes protegidos','1 video'])assert.ok(card.includes(text),text)
 assert.match(card,/Los días no usados no se acumulan como videos extra/);assert.match(card,/Audio Finishing no consumen este presupuesto/)
 assert.match(jobs,/¿Usamos el video IA incluido de hoy\?/);assert.match(jobs,/¿Usamos parte de la reserva para ajustar esta versión\?/);assert.match(jobs,/Usar video de hoy/);assert.match(jobs,/Autorizar ajuste/);assert.match(jobs,/Referencia del proveedor/)
 assert.match(planner,/UsageBudgetCard/);assert.match(workspace,/UsageBudgetCard/);assert.match(http,/usage-budget/)
})
