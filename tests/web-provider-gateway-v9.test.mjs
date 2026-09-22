import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,writeFile,readFile,mkdir} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {randomBytes,scryptSync} from 'node:crypto'
import {execFile as callback} from 'node:child_process'
import {promisify} from 'node:util'
import {HiggsfieldSeedanceAdapter,HIGGSFIELD_SEEDANCE_MODEL,HIGGSFIELD_CATALOG_RATE} from '../server/higgsfield-adapter.mjs'
import {ProviderRegistry} from '../server/providers.mjs'
import {createService} from '../server/services.mjs'
import {ExecutionService} from '../server/execution.mjs'
import {ProductError} from '../server/errors.mjs'

const execFile=promisify(callback)
const runtime=process.env.GRAPH_HARNESS_RUNTIME_ROOT||'/home/agent/.cache/media-content-harness/graph-harness-sdlc'
const response=(body,{status=200,url='https://api.higgsfield.ai/request'}={})=>({ok:status>=200&&status<300,status,url,headers:{get:key=>key.toLowerCase()==='content-type'?'application/json':null},text:async()=>JSON.stringify(body)})
const videoResponse=bytes=>({ok:true,status:200,url:'https://cdn.example.com/result.mp4',headers:{get:key=>key.toLowerCase()==='content-type'?'video/mp4':key.toLowerCase()==='content-length'?String(bytes.length):null},arrayBuffer:async()=>bytes})
const baseJob={id:'job-v9',creation_mode:'GUIDED_SCENE',mascot:false,scene_request:{output:{medium:'video',duration_seconds:6,aspect_ratio:'9:16'}},target:{duration_seconds:[6,6],aspect_ratio:'9:16'},prompt_compilation:{final_prompt:'A cinematic Antigua scene with no branded character.',final_prompt_sha256:'a'.repeat(64),structured_request_sha256:'b'.repeat(64),reference_roles:[]}}

test('Seedance 2.5 adapter maps exact request, exposes only lifecycle telemetry, and uses conservative catalog estimate',async()=>{
 const calls=[]
 const adapter=new HiggsfieldSeedanceAdapter({credentialResolver:async()=> 'key-id:key-secret',lookupImpl:async()=>[{address:'8.8.8.8',family:4}],clock:()=>Date.parse('2026-09-18T12:00:00Z'),fetchImpl:async(url,init)=>{calls.push({url,init});if(init.method==='POST')return response({status:'queued',request_id:'12345678-abcd-4000-8000-123456789abc',status_url:'https://api.higgsfield.ai/requests/12345678-abcd-4000-8000-123456789abc/status'});return response({status:'in_progress',request_id:'12345678-abcd-4000-8000-123456789abc'})}})
 const capabilities=adapter.capabilities(),estimate=adapter.estimate({job:baseJob}),prepared=await adapter.prepare({job:baseJob,assets:[]})
 assert.equal(capabilities.model,HIGGSFIELD_SEEDANCE_MODEL);assert.equal(capabilities.authoritative_numeric_progress,false)
 assert.equal(estimate.kind,'CATALOG_UPPER_BOUND');assert.equal(estimate.rate_usd_per_second,HIGGSFIELD_CATALOG_RATE.max_usd_per_second);assert.equal(estimate.cost,1.9416)
 assert.deepEqual(prepared.provider_request,{prompt:baseJob.prompt_compilation.final_prompt,duration:6,resolution:'720p',aspect_ratio:'9:16',output_format:'mp4',generate_audio:true})
 const generated=await adapter.generate(prepared);assert.equal(generated.status,'queued');assert.equal(generated.telemetry.percent,null)
 const polled=await adapter.poll(generated);assert.equal(polled.status,'in_progress');assert.equal(polled.telemetry.percent,null);assert.equal(calls.filter(v=>v.init.method==='POST').length,1)
 assert.match(calls[0].init.headers.Authorization,/^Key /);assert.doesNotMatch(JSON.stringify(generated),/key-secret/)
})

test('Higgsfield adapter fails closed for reference scenes, missing credentials and ambiguous paid submission',async()=>{
 const missing=new HiggsfieldSeedanceAdapter({credentialResolver:async()=>null,lookupImpl:async()=>[{address:'8.8.8.8',family:4}],fetchImpl:async()=>{throw Error('should not call')}})
 await assert.rejects(missing.ready(),e=>e.code==='PROVIDER_CREDENTIAL_MISSING')
 const referenceJob=structuredClone(baseJob);referenceJob.mascot=true;referenceJob.prompt_compilation.reference_roles=[{asset_id:'avatar',role:'CHARACTER_IDENTITY_ONLY',sha256:'c'.repeat(64)}]
 await assert.rejects(missing.prepare({job:referenceJob,assets:[],mascotAsset:{id:'avatar'}}),e=>e.code==='PROVIDER_REFERENCE_UPLOAD_REQUIRED')
 const ambiguous=new HiggsfieldSeedanceAdapter({credentialResolver:async()=> 'key-id:key-secret',lookupImpl:async()=>[{address:'8.8.8.8',family:4}],fetchImpl:async()=>{throw new Error('socket reset')}})
 const prepared=await ambiguous.prepare({job:baseJob,assets:[]})
 await assert.rejects(ambiguous.generate(prepared),e=>e.code==='PROVIDER_SUBMISSION_UNKNOWN')
})

test('Higgsfield adapter rejects unsafe output URLs and moderation/failed states remain explicit',async()=>{
 const adapter=new HiggsfieldSeedanceAdapter({credentialResolver:async()=> 'key-id:key-secret',lookupImpl:async(host)=>[{address:host==='127.0.0.1'?'127.0.0.1':'8.8.8.8',family:4}],mediaRequestImpl:async()=>videoResponse(Buffer.from('x')),fetchImpl:async()=>response({status:'completed',request_id:'12345678-abcd-4000-8000-123456789abc'})})
 await assert.rejects(adapter.collect({status:'completed',video:{url:'http://example.com/out.mp4'}}),e=>e.code==='PROVIDER_OUTPUT_INVALID')
 await assert.rejects(adapter.collect({status:'completed',video:{url:'https://127.0.0.1/out.mp4'}}),e=>e.code==='PROVIDER_OUTPUT_INVALID')
 const rebinding=new HiggsfieldSeedanceAdapter({credentialResolver:async()=> 'key-id:key-secret',lookupImpl:async()=>[{address:'10.0.0.7',family:4}],mediaRequestImpl:async()=>videoResponse(Buffer.from('x'))});await assert.rejects(rebinding.collect({status:'completed',video:{url:'https://cdn.example.com/out.mp4'}}),e=>e.code==='PROVIDER_OUTPUT_INVALID')
 let pinned=null;const pinnedDownload=new HiggsfieldSeedanceAdapter({credentialResolver:async()=> 'key-id:key-secret',lookupImpl:async()=>[{address:'8.8.4.4',family:4}],mediaRequestImpl:async(url,resolved)=>{pinned={url,resolved};return videoResponse(Buffer.from('x'))}});await pinnedDownload.collect({status:'completed',video:{url:'https://cdn.example.com/out.mp4'}});assert.equal(pinned.resolved.address,'8.8.4.4');assert.equal(pinned.resolved.family,4)
 const statuses=[];const polling=new HiggsfieldSeedanceAdapter({credentialResolver:async()=> 'key-id:key-secret',lookupImpl:async()=>[{address:'8.8.8.8',family:4}],fetchImpl:async()=>response({status:statuses.shift(),request_id:'12345678-abcd-4000-8000-123456789abc'})})
 statuses.push('nsfw','failed')
 assert.equal((await polling.poll({request_id:'12345678-abcd-4000-8000-123456789abc'})).status,'nsfw')
 assert.equal((await polling.poll({request_id:'12345678-abcd-4000-8000-123456789abc'})).status,'failed')
})

async function gatewayFixture(t,options={}){
 const root=await mkdtemp(join(tmpdir(),'media-provider-v9-'));t.after(()=>rm(root,{recursive:true,force:true}))
 const password='provider v9 password',salt=randomBytes(24).toString('hex'),hash=scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex')
 const identityFile=join(root,'identities.json');await writeFile(identityFile,JSON.stringify({users:[{id:'owner',email:'owner@example.com',password:{salt,hash},can_create_tenants:true,system_admin:true,memberships:[]}]}))
 const dataRoot=join(root,'data'),videoPath=join(root,'provider.mp4');await execFile('/usr/bin/ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i','color=c=purple:s=180x320:d=1','-c:v','libx264','-threads','1','-pix_fmt','yuv420p',videoPath]);const media=await readFile(videoPath)
 const stats={generate:0,poll:0},pollStatuses=[...(options.pollStatuses||['in_progress','completed'])],adapter={
  capabilities(){return {strategies:['GENERATIVE'],paid:true,automatic_social_publish:false,async:true,provider:'higgsfield',model:HIGGSFIELD_SEEDANCE_MODEL}},
  estimate(input){return {credits:null,cost:1.9416,currency:'USD',kind:'CATALOG_UPPER_BOUND',pricing_checked_at:'2026-09-18'}},
  async prepare(input){assert.equal(input.job.mascot,false);return input},async ready(){return true},
  async generate(){stats.generate++;if(options.generateError)throw options.generateError;return {request_id:'12345678-abcd-4000-8000-123456789abc',status:'queued',telemetry:{source:'provider',provider:'higgsfield',request_id:'12345678-abcd-4000-8000-123456789abc',status:'queued',kind:'status',percent:null,observed_at:new Date().toISOString()}}},
  async poll(value){stats.poll++;const status=pollStatuses.shift()||'completed';return {...value,status,video:status==='completed'?{url:'https://cdn.example.com/result.mp4'}:undefined,telemetry:{source:'provider',provider:'higgsfield',request_id:value.request_id,status,kind:'status',percent:null,observed_at:new Date().toISOString()}}},
  async collect(value){return {...value,bytes:media,mime_type:'video/mp4',production_note:'fake paid provider fixture'}},
  provenance(){return {adapter:'higgsfield',provider:'higgsfield',provider_model:HIGGSFIELD_SEEDANCE_MODEL,synthetic:true,used_sources:[],brand_assets:[],paid:true,external_review:false,automatic_social_publish:false}}
 }
 const providers=new ProviderRegistry({adapters:{higgsfield:adapter}}),service=createService({dataRoot,identityFile,publicOrigin:'http://localhost:3000',deploymentClass:'controlled_single_operator_preview',providers}),owner=(await service.auth.login({email:'owner@example.com',password})).token
 await service.createTenant(owner,{organization:'FIRMES',tenant_id:'firmes',content_context:'commercial',visual_language:'clean'})
 await service.addSource(owner,'firmes',{source:{id:'activation-source',locator:'https://example.org/authorized',purpose:'source',authorization:'explicit',match:'exact'}})
 const execution=new ExecutionService({repository:service.repository,dataRoot,graphRuntimeRoot:runtime,testMode:false,deploymentClass:'controlled_single_operator_preview',releaseSha:'a'.repeat(40),providers});execution.providerPollDelayMs=1_000_000;service.setExecution(execution)
 const scene={subject:{mode:'none'},environment:{location_name:'Antigua Guatemala',required_elements:['colonial street'],forbidden_elements:[],civilian_only:true},action:{verb:'slow cinematic camera move'},visual_style:{realism:'photorealistic',look:['cinematic'],lighting:['golden hour']},hard_constraints:[],output:{medium:'video',aspect_ratio:'9:16',duration_seconds:6,motion_intent:'slow motion',camera_intent:'stable'},generation_mode:'provider:higgsfield'}
 return {root,dataRoot,service,execution,owner,stats,providers,scene}
}


test('provider discovery is credential-aware and never returns the stored Higgsfield secret',async t=>{
 const f=await gatewayFixture(t)
 let providers=await f.service.providerList(f.owner),higgsfield=providers.find(p=>p.id==='higgsfield')
 assert.equal(higgsfield.available,false);assert.equal(higgsfield.availability,'CREDENTIAL_REQUIRED')
 await f.service.updateIntegration(f.owner,'higgsfield',{api_key:'key-id:key-secret',budget_reference:25})
 providers=await f.service.providerList(f.owner);higgsfield=providers.find(p=>p.id==='higgsfield')
 assert.equal(higgsfield.available,true);assert.equal(higgsfield.availability,'CONFIGURED');assert.doesNotMatch(JSON.stringify(providers),/key-secret/)
 const integrations=await f.service.integrations(f.owner),stored=integrations.providers.find(p=>p.id==='higgsfield')
 assert.equal(stored.key_configured,true);assert.doesNotMatch(JSON.stringify(integrations),/key-secret/)
})

test('V9 Creation Room keeps Graph percentage separate from provider status and gates paid generation behind explicit consent',async()=>{
 const jobs=await readFile('components/jobs.tsx','utf8'),css=await readFile('app/globals.css','utf8'),http=await readFile('server/http.mjs','utf8')
 assert.match(jobs,/provider_telemetry/)
 assert.match(jobs,/Higgsfield · \{providerStatus\}/)
 assert.match(jobs,/El proveedor informa el estado, no un porcentaje de render/)
 assert.match(jobs,/provider-spend-card/)
 assert.match(jobs,/¿Usamos el video IA incluido de hoy\?/)
 assert.match(jobs,/Uso estimado del video de hoy/)
 assert.match(jobs,/Usar video de hoy/)
 assert.match(jobs,/approve-provider-spend/)
 assert.match(http,/approve-provider-spend/)
 assert.match(css,/provider-live-status/)
 assert.match(css,/provider-spend-card/)
})
test('paid provider waits for exact human spend approval, then recovery reuses one request id without duplicate submission',async t=>{
 const f=await gatewayFixture(t),created=await f.service.createScene(f.owner,'firmes',f.scene),id=created.id
 await f.execution.drain();let job=await f.service.job(f.owner,id)
 assert.equal(job.status,'AWAITING_SPEND_APPROVAL',JSON.stringify(job.blockers));assert.equal(f.stats.generate,0);assert.equal(job.provider_spend_request.provider,'higgsfield');assert.equal(job.provider_spend_request.estimate.kind,'CATALOG_UPPER_BOUND');assert.equal(job.provider_spend_request.budget_quote.category,'NEW_GENERATION');assert.equal(job.provider_spend_request.budget_quote.estimated_gtq,14.81);assert.equal(job.provider_spend_request.budget_quote.item_cap_gtq,22);assert.equal(job.provider_spend_request.budget_quote.within_item_cap,true)
 await assert.rejects(f.service.approveProviderSpend(f.owner,id,{scope_sha:'0'.repeat(64),confirm:true}),e=>e.code==='SPEND_APPROVAL_STALE')
 await f.service.approveProviderSpend(f.owner,id,{scope_sha:job.provider_spend_request.scope_sha,confirm:true});await f.execution.drain();job=await f.service.job(f.owner,id);let usage=await f.service.usageBudget(f.owner,'firmes')
 assert.equal(f.stats.generate,1);assert.equal(f.stats.poll,1);assert.equal(job.generation_attempts.length,1);assert.equal(job.generation_attempts[0].provider_request_id,'12345678-abcd-4000-8000-123456789abc');assert.equal(job.generation_attempts[0].status,'IN_PROGRESS');assert.equal(job.provider_telemetry.at(-1).percent,null);assert.equal(job.provider_spend_approval.budget.amount_gtq,14.81);assert.equal(job.provider_spend_approval.budget.category,'NEW_GENERATION');assert.equal(usage.used_gtq,14.81);assert.equal(usage.new_generation.available_today,false);assert.equal(usage.entries[0].status,'COMMITTED')
 const recovered=new ExecutionService({repository:f.service.repository,dataRoot:f.dataRoot,graphRuntimeRoot:runtime,testMode:false,deploymentClass:'controlled_single_operator_preview',releaseSha:'a'.repeat(40),providers:f.providers});recovered.providerPollDelayMs=1_000_000;f.service.setExecution(recovered);await recovered.recover();await recovered.drain();job=await f.service.job(f.owner,id)
 usage=await f.service.usageBudget(f.owner,'firmes');assert.equal(f.stats.generate,1,'recovery must not submit a second paid request');assert.equal(f.stats.poll,2);assert.equal(job.generation_attempts.length,1);assert.equal(job.generation_attempts[0].status,'COMPLETED');assert.equal(job.stage,'CRITIC');assert.equal(job.status,'AWAITING_REVIEW');assert.equal(job.provider_execution.provenance.paid,true);assert.equal(job.provider_execution.spend_approval.scope_sha,job.provider_spend_approval.scope_sha);assert.equal(job.provider_execution.spend_approval.budget.amount_gtq,14.81);assert.equal(usage.used_gtq,14.81);assert.equal(usage.entries[0].status,'SETTLED_ESTIMATE')
})


test('provider moderation failure blocks the exact attempt and a blind restart cannot spend again',async t=>{
 const f=await gatewayFixture(t,{pollStatuses:['nsfw']}),created=await f.service.createScene(f.owner,'firmes',f.scene),id=created.id
 await f.execution.drain();let job=await f.service.job(f.owner,id);await f.service.approveProviderSpend(f.owner,id,{scope_sha:job.provider_spend_request.scope_sha,confirm:true});await f.execution.drain();job=await f.service.job(f.owner,id)
 assert.equal(job.status,'BLOCKED');assert.equal(job.blockers[0].code,'PROVIDER_MODERATION_REJECTED');assert.equal(job.generation_attempts[0].status,'NSFW');assert.equal(f.stats.generate,1)
 await f.execution.start({id:'owner',memberships:[{tenant_id:'firmes',role:'owner'}]},id);await f.execution.drain();job=await f.service.job(f.owner,id)
 assert.equal(job.status,'BLOCKED');assert.equal(job.blockers[0].code,'PROVIDER_RETRY_REQUIRES_REVIEW');assert.equal(f.stats.generate,1,'blind restart must not create a second paid request')
})

test('ambiguous paid submission persists fail-closed state and is never automatically resubmitted',async t=>{
 const ambiguous=new ProductError('PROVIDER_SUBMISSION_UNKNOWN','simulated ambiguous provider submission',503),f=await gatewayFixture(t,{generateError:ambiguous}),created=await f.service.createScene(f.owner,'firmes',f.scene),id=created.id
 await f.execution.drain();let job=await f.service.job(f.owner,id);await f.service.approveProviderSpend(f.owner,id,{scope_sha:job.provider_spend_request.scope_sha,confirm:true});await f.execution.drain();job=await f.service.job(f.owner,id)
 assert.equal(job.status,'BLOCKED');assert.equal(job.blockers[0].code,'PROVIDER_SUBMISSION_UNKNOWN');assert.equal(job.generation_attempts[0].status,'SUBMISSION_PENDING');assert.equal(job.generation_attempts[0].provider_request_id,null);assert.equal(f.stats.generate,1)
 await f.execution.start({id:'owner',memberships:[{tenant_id:'firmes',role:'owner'}]},id);await f.execution.drain();job=await f.service.job(f.owner,id)
 assert.equal(job.blockers[0].code,'PROVIDER_SUBMISSION_UNKNOWN');assert.equal(f.stats.generate,1,'unknown submission outcome must never be retried automatically')
})

test('crash after paid output collection resumes from the durable artifact without a second provider request',async t=>{
 const f=await gatewayFixture(t,{pollStatuses:['completed']}),created=await f.service.createScene(f.owner,'firmes',f.scene),id=created.id
 await f.execution.drain();let job=await f.service.job(f.owner,id);f.execution.onJobsQueued=()=>{};await f.execution.approveProviderSpend({id:'owner',memberships:[{tenant_id:'firmes',role:'owner'}]},id,{scope_sha:job.provider_spend_request.scope_sha,confirm:true})
 const complete=f.execution.complete.bind(f.execution);f.execution.complete=async(jobArg,node,...rest)=>{if(node==='PROVIDER_PRODUCTION')throw new Error('simulated process loss after durable provider collection');return complete(jobArg,node,...rest)}
 await assert.rejects(f.execution.run(id),/simulated process loss/);job=await f.service.job(f.owner,id);assert.equal(job.generation_attempts[0].status,'COMPLETED');assert.ok(job.artifact_sha256);assert.equal(f.stats.generate,1)
 const recovered=new ExecutionService({repository:f.service.repository,dataRoot:f.dataRoot,graphRuntimeRoot:runtime,testMode:false,deploymentClass:'controlled_single_operator_preview',releaseSha:'a'.repeat(40),providers:f.providers});recovered.providerPollDelayMs=1_000_000;f.service.setExecution(recovered);await recovered.recover();await recovered.drain();job=await f.service.job(f.owner,id)
 assert.equal(f.stats.generate,1,'recovery after collection must complete Graph evidence from the durable artifact');assert.equal(job.stage,'CRITIC');assert.equal(job.status,'AWAITING_REVIEW')
})

test('changing a spend-bound job revision invalidates approval before provider submission',async t=>{
 const f=await gatewayFixture(t),created=await f.service.createScene(f.owner,'firmes',f.scene),id=created.id
 await f.execution.drain();let job=await f.service.job(f.owner,id);f.execution.onJobsQueued=()=>{};await f.execution.approveProviderSpend({id:'owner',memberships:[{tenant_id:'firmes',role:'owner'}]},id,{scope_sha:job.provider_spend_request.scope_sha,confirm:true})
 await f.service.repository.transact(state=>{state.jobs[id].job_revision+=1;return null})
 await f.execution.run(id);job=await f.service.job(f.owner,id)
 const usage=await f.service.usageBudget(f.owner,'firmes');assert.equal(job.status,'AWAITING_SPEND_APPROVAL');assert.equal(job.provider_spend_approval,null);assert.notEqual(job.provider_spend_request.scope_sha,'');assert.equal(f.stats.generate,0,'changed bound inputs must require a fresh approval before any paid request');assert.equal(usage.used_gtq,0,'an unsubmitted reservation must be released when spend-bound inputs change');assert.equal(usage.new_generation.available_today,true)
})
