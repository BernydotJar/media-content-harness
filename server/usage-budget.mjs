import { randomUUID } from 'node:crypto'
import { invariant } from './errors.mjs'

const round2=value=>Math.round((Number(value)+Number.EPSILON)*100)/100
const active=entry=>entry.status!=='RELEASED'
const CATEGORY_NEW='NEW_GENERATION'
const CATEGORY_REPAIR='PAID_REPAIR'

export const DEFAULT_WEEKLY_USAGE_POLICY=Object.freeze({
  schema_version:'weekly-usage-budget.v1',
  currency:'GTQ',
  timezone:'America/Guatemala',
  weekly_cap_gtq:200,
  new_generation_weekly_cap_gtq:154,
  repair_reserve_gtq:46,
  new_generation_daily_limit:1,
  new_generation_max_gtq:22,
  repair_weekly_limit:2,
  repair_max_gtq:23,
  usd_to_gtq_rate:7.63,
  fx_rate_source:'REFERENCE_RATE',
  fx_rate_checked_at:'2026-09-22',
  rollover_between_days:false,
  rollover_between_weeks:false,
  allow_overage:false,
})

function localDateKey(epochMs,timeZone){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(epochMs))
  const by=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,p.value]))
  return `${by.year}-${by.month}-${by.day}`
}
function shiftDate(dateKey,days){const d=new Date(dateKey+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function usagePeriod(epochMs=Date.now(),policy=DEFAULT_WEEKLY_USAGE_POLICY){
  const day_key=localDateKey(epochMs,policy.timezone),d=new Date(day_key+'T12:00:00Z'),offset=(d.getUTCDay()+6)%7,week_start=shiftDate(day_key,-offset)
  return {day_key,week_start,week_end:shiftDate(week_start,6)}
}

export function paidUsageCategory(job){
  const priorPaid=(job.generation_attempts||[]).some(a=>Boolean(a.spend_approval_id)||Number(a.estimate?.cost||0)>0)
  const reviewedRepair=Number(job.repair_revision||0)>0
  return priorPaid&&reviewedRepair?CATEGORY_REPAIR:CATEGORY_NEW
}

export function providerBudgetQuote(job,estimate,policy=DEFAULT_WEEKLY_USAGE_POLICY,epochMs=Date.now()){
  invariant(estimate&&Number.isFinite(Number(estimate.cost))&&Number(estimate.cost)>0,'BUDGET_ESTIMATE_REQUIRED','Esta generación pagada necesita un estimado monetario antes de autorizarse.',409)
  const sourceCurrency=String(estimate.currency||'').toUpperCase(),sourceCost=Number(estimate.cost)
  let amountGtq,fxRate=1
  if(sourceCurrency==='GTQ')amountGtq=round2(sourceCost)
  else if(sourceCurrency==='USD'){fxRate=policy.usd_to_gtq_rate;amountGtq=round2(sourceCost*fxRate)}
  else invariant(false,'BUDGET_CURRENCY_UNSUPPORTED','El presupuesto semanal todavía no puede convertir la moneda estimada por este proveedor.',409)
  const category=paidUsageCategory(job),period=usagePeriod(epochMs,policy),itemCap=category===CATEGORY_NEW?policy.new_generation_max_gtq:policy.repair_max_gtq
  return {schema_version:'usage-budget-quote.v1',policy_version:policy.schema_version,currency:policy.currency,category,estimated_gtq:amountGtq,item_cap_gtq:itemCap,within_item_cap:amountGtq<=itemCap,source_cost:sourceCost,source_currency:sourceCurrency,fx_rate:fxRate,fx_rate_source:sourceCurrency==='USD'?policy.fx_rate_source:'IDENTITY',fx_rate_checked_at:sourceCurrency==='USD'?policy.fx_rate_checked_at:null,week_start:period.week_start,week_end:period.week_end,day_key:period.day_key}
}

function ledgerFor(state,tenantId,weekStart,policy,create=false){
  if(create){state.usage_budget_ledgers??={};state.usage_budget_ledgers[tenantId]??={};state.usage_budget_ledgers[tenantId][weekStart]??={schema_version:'usage-budget-ledger.v1',tenant_id:tenantId,week_start:weekStart,currency:policy.currency,policy:{...policy},entries:[]}}
  return state.usage_budget_ledgers?.[tenantId]?.[weekStart]||null
}
function sum(entries){return round2(entries.reduce((n,e)=>n+Number(e.amount_gtq||0),0))}
export function usageBudgetProjection(state,tenantId,{policy=DEFAULT_WEEKLY_USAGE_POLICY,epochMs=Date.now()}={}){
  const period=usagePeriod(epochMs,policy),ledger=ledgerFor(state,tenantId,period.week_start,policy,false),entries=(ledger?.entries||[]).filter(active),newEntries=entries.filter(e=>e.category===CATEGORY_NEW),repairEntries=entries.filter(e=>e.category===CATEGORY_REPAIR),used=sum(entries),newUsed=sum(newEntries),repairUsed=sum(repairEntries),todayNew=newEntries.filter(e=>e.day_key===period.day_key).length
  return {schema_version:'weekly-usage-summary.v1',policy:{...policy},period,currency:policy.currency,included_gtq:policy.weekly_cap_gtq,used_gtq:used,remaining_gtq:round2(Math.max(0,policy.weekly_cap_gtq-used)),new_generation:{weekly_cap_gtq:policy.new_generation_weekly_cap_gtq,used_gtq:newUsed,remaining_gtq:round2(Math.max(0,policy.new_generation_weekly_cap_gtq-newUsed)),daily_limit:policy.new_generation_daily_limit,used_today:todayNew,available_today:todayNew<policy.new_generation_daily_limit,max_estimated_gtq:policy.new_generation_max_gtq},repairs:{reserved_gtq:policy.repair_reserve_gtq,used_gtq:repairUsed,remaining_gtq:round2(Math.max(0,policy.repair_reserve_gtq-repairUsed)),weekly_limit:policy.repair_weekly_limit,used_count:repairEntries.length,remaining_count:Math.max(0,policy.repair_weekly_limit-repairEntries.length),max_estimated_gtq:policy.repair_max_gtq},entries:entries.slice(-20).reverse().map(e=>({id:e.id,job_id:e.job_id,category:e.category,amount_gtq:e.amount_gtq,status:e.status,day_key:e.day_key,created_at:e.created_at,updated_at:e.updated_at}))}
}

export function reserveUsageBudget(state,{tenantId,job,estimate,scopeSha,approvalId,actorId,policy=DEFAULT_WEEKLY_USAGE_POLICY,epochMs=Date.now()}){
  const quote=providerBudgetQuote(job,estimate,policy,epochMs),ledger=ledgerFor(state,tenantId,quote.week_start,policy,true),existing=ledger.entries.find(e=>e.scope_sha===scopeSha&&active(e))
  if(existing)return existing
  const summary=usageBudgetProjection(state,tenantId,{policy,epochMs}),amount=quote.estimated_gtq
  invariant(quote.within_item_cap,'USAGE_ITEM_CAP_EXCEEDED',quote.category===CATEGORY_NEW?`Este render estima Q${amount.toFixed(2)} y el máximo diario por video nuevo es Q${policy.new_generation_max_gtq.toFixed(2)}.`:`Este ajuste estima Q${amount.toFixed(2)} y el máximo por repair es Q${policy.repair_max_gtq.toFixed(2)}.`,409)
  invariant(round2(summary.used_gtq+amount)<=policy.weekly_cap_gtq,'USAGE_WEEKLY_CAP_EXCEEDED','El presupuesto semanal de Q200 ya no tiene suficiente disponibilidad para esta generación.',409)
  if(quote.category===CATEGORY_NEW){
    invariant(summary.new_generation.available_today,'USAGE_DAILY_SLOT_USED','El video IA incluido de hoy ya fue utilizado. El siguiente slot se habilita mañana.',409)
    invariant(round2(summary.new_generation.used_gtq+amount)<=policy.new_generation_weekly_cap_gtq,'USAGE_NEW_WEEKLY_CAP_EXCEEDED','La parte semanal reservada para videos nuevos ya fue utilizada. La reserva restante está protegida para ajustes.',409)
  }else{
    invariant(summary.repairs.used_count<policy.repair_weekly_limit,'USAGE_REPAIR_LIMIT_EXCEEDED','Ya se utilizaron los repairs pagados incluidos para esta semana.',409)
    invariant(round2(summary.repairs.used_gtq+amount)<=policy.repair_reserve_gtq,'USAGE_REPAIR_RESERVE_EXCEEDED','La reserva semanal de repairs no tiene suficiente disponibilidad para este ajuste.',409)
  }
  const at=new Date(epochMs).toISOString(),entry={id:'usage_'+randomUUID(),tenant_id:tenantId,job_id:job.id,scope_sha:scopeSha,approval_id:approvalId,category:quote.category,amount_gtq:amount,source_cost:quote.source_cost,source_currency:quote.source_currency,fx_rate:quote.fx_rate,day_key:quote.day_key,week_start:quote.week_start,status:'RESERVED',created_at:at,updated_at:at,history:[{type:'RESERVED',at,actor_id:actorId}]}
  ledger.entries.push(entry);return entry
}
function findEntry(state,id){for(const ledgers of Object.values(state.usage_budget_ledgers||{}))for(const ledger of Object.values(ledgers||{})){const entry=(ledger.entries||[]).find(e=>e.id===id);if(entry)return entry}return null}
export function commitUsageBudget(state,id,{epochMs=Date.now(),reason='PROVIDER_SUBMISSION_STARTED'}={}){const entry=findEntry(state,id);invariant(entry,'USAGE_RESERVATION_MISSING','La reserva de uso asociada a esta generación no está disponible.',409);if(entry.status==='RESERVED'){const at=new Date(epochMs).toISOString();entry.status='COMMITTED';entry.updated_at=at;entry.history.push({type:'COMMITTED',at,reason})}return entry}
export function settleUsageBudget(state,id,{epochMs=Date.now()}={}){const entry=findEntry(state,id);invariant(entry,'USAGE_RESERVATION_MISSING','La reserva de uso asociada a esta generación no está disponible.',409);if(entry.status!=='SETTLED_ESTIMATE'&&entry.status!=='RELEASED'){const at=new Date(epochMs).toISOString();entry.status='SETTLED_ESTIMATE';entry.updated_at=at;entry.history.push({type:'SETTLED_ESTIMATE',at,reason:'NO_AUTHORITATIVE_FINAL_COST'})}return entry}
export function releaseUsageBudget(state,id,{epochMs=Date.now(),reason='SCOPE_CHANGED'}={}){const entry=findEntry(state,id);if(!entry||entry.status==='RELEASED')return entry;invariant(entry.status==='RESERVED','USAGE_RESERVATION_COMMITTED','Una reserva ya enviada al proveedor no se libera sin costo final autoritativo.',409);const at=new Date(epochMs).toISOString();entry.status='RELEASED';entry.updated_at=at;entry.history.push({type:'RELEASED',at,reason});return entry}
export const USAGE_CATEGORY={NEW_GENERATION:CATEGORY_NEW,PAID_REPAIR:CATEGORY_REPAIR}
