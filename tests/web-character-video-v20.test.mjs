import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {randomBytes,scryptSync} from 'node:crypto'
import {execFile as callback} from 'node:child_process'
import {promisify} from 'node:util'
import {GeminiVeoAdapter,GEMINI_VEO_MODEL,GEMINI_VEO_PRICING} from '../server/gemini-veo-adapter.mjs'
import {captureProviderExecution} from '../server/media-projection.mjs'
import {ProviderRegistry} from '../server/providers.mjs'
import {createService} from '../server/services.mjs'
import {ExecutionService} from '../server/execution.mjs'
import {FIRMES_CABALLITO} from '../server/brand-assets.mjs'
import {seedTenantBrandModels,compileMascotScenePrompt,FIRMES_CABALLITO_ASSET_ID} from '../server/scene-generation.mjs'

const execFile=promisify(callback)
const runtime=process.env.GRAPH_HARNESS_RUNTIME_ROOT||'/home/agent/.cache/media-content-harness/graph-harness-sdlc'
const sha='a'.repeat(64)
const promptSha='b'.repeat(64)
const response=(body,{status=200,headers={}}={})=>({
  ok:status>=200&&status<300,status,
  headers:{get:key=>headers[String(key).toLowerCase()]??(String(key).toLowerCase()==='content-type'?'application/json':null)},
  text:async()=>JSON.stringify(body),
})
const mediaResponse=(bytes,{status=200,location=null,contentType='video/mp4'}={})=>({
  ok:status>=200&&status<300,status,
  headers:{get:key=>String(key).toLowerCase()==='location'?location:String(key).toLowerCase()==='content-type'?contentType:String(key).toLowerCase()==='content-length'?String(bytes.length):null},
  arrayBuffer:async()=>bytes,
})
const baseJob={
  id:'job-veo',
  tenant_id:'firmes',
  creation_mode:'GUIDED_SCENE',
  mascot:true,
  scene_request:{output:{medium:'video',duration_seconds:8,aspect_ratio:'9:16'}},
  target:{duration_seconds:[8,8],aspect_ratio:'9:16'},
  prompt_compilation:{
    final_prompt:'Generate the approved Caballito as a full character walking naturally in Antigua. Preserve identity and body proportions.',
    final_prompt_sha256:promptSha,
    structured_request_sha256:'c'.repeat(64),
    reference_roles:[{asset_id:FIRMES_CABALLITO_ASSET_ID,role:'CHARACTER_IDENTITY_ONLY',sha256:sha}],
  },
}

test('Gemini Veo reference adapter sends the exact approved character bytes and uses the 8-second fast-model budget',async t=>{
  const root=await mkdtemp(join(tmpdir(),'veo-v20-'));t.after(()=>rm(root,{recursive:true,force:true}))
  const path=join(root,'character.png'),bytes=Buffer.from('approved-character-bytes');await writeFile(path,bytes)
  const calls=[]
  const adapter=new GeminiVeoAdapter({credentialResolver:async()=>'AIza-test-key-v20',clock:()=>Date.parse('2026-09-24T18:00:00Z'),fetchImpl:async(url,init={})=>{
    calls.push({url,init})
    if(String(url).includes(':predictLongRunning'))return response({name:'operations/veo-v20-12345678'})
    if(String(url).includes('/operations/'))return response({done:true,response:{generateVideoResponse:{generatedSamples:[{video:{uri:'https://generativelanguage.googleapis.com/v1beta/files/generated-v20:download'}}]}}})
    return mediaResponse(Buffer.from('video-result'))
  }})
  const caps=adapter.capabilities(),estimate=adapter.estimate({job:baseJob})
  assert.equal(caps.model,GEMINI_VEO_MODEL);assert.equal(caps.reference_to_video,true);assert.equal(caps.character_reference,true);assert.equal(caps.text_to_video,false)
  assert.equal(estimate.cost,0.8);assert.equal(estimate.rate_usd_per_second,GEMINI_VEO_PRICING.usd_per_second)
  const prepared=await adapter.prepare({job:baseJob,referenceAssets:[{asset_id:FIRMES_CABALLITO_ASSET_ID,role:'CHARACTER_IDENTITY_ONLY',sha256:sha,mime_type:'image/png',path}]})
  assert.equal(prepared.provider_request.parameters.durationSeconds,8);assert.equal(prepared.provider_request.parameters.aspectRatio,'9:16')
  const reference=prepared.provider_request.instances[0].referenceImages[0]
  assert.equal(reference.referenceType,'asset');assert.equal(reference.image.inlineData.mimeType,'image/png');assert.equal(reference.image.inlineData.data,bytes.toString('base64'))
  const generated=await adapter.generate(prepared);assert.equal(generated.request_id,'operations/veo-v20-12345678')
  const polled=await adapter.poll(generated);assert.equal(polled.status,'completed');assert.match(polled.video_uri,/generativelanguage\.googleapis\.com/)
  const collected=await adapter.collect(polled);assert.equal(collected.bytes.toString(),'video-result')
  assert.equal(calls.filter(c=>String(c.url).includes(':predictLongRunning')).length,1)
  const post=JSON.parse(calls.find(c=>String(c.url).includes(':predictLongRunning')).init.body)
  assert.equal(post.instances[0].referenceImages[0].image.inlineData.data,bytes.toString('base64'))
  assert.doesNotMatch(JSON.stringify(generated),/AIza-test-key-v20/)
  const provenance=adapter.provenance(prepared)
  assert.equal(provenance.generation_kind,'REFERENCE_VIDEO');assert.equal(provenance.prompt_sha256,promptSha)
  assert.deepEqual(provenance.brand_assets,[{asset_id:FIRMES_CABALLITO_ASSET_ID,sha256:sha,synthetic:false}])
  assert.deepEqual(provenance.reference_assets,[{asset_id:FIRMES_CABALLITO_ASSET_ID,role:'CHARACTER_IDENTITY_ONLY',sha256:sha}])
})

test('Gemini video download never forwards the API key across a Google media redirect',async()=>{
  const seen=[]
  const adapter=new GeminiVeoAdapter({credentialResolver:async()=>'AIza-test-key-v20',fetchImpl:async(url,init={})=>{
    seen.push({url:String(url),headers:init.headers||{}})
    if(String(url).includes('generativelanguage.googleapis.com'))return mediaResponse(Buffer.alloc(0),{status:302,location:'https://cdn.googleusercontent.com/generated/video.mp4'})
    return mediaResponse(Buffer.from('redirected-video'))
  }})
  const collected=await adapter.collect({status:'completed',video_uri:'https://generativelanguage.googleapis.com/v1beta/files/generated:download'})
  assert.equal(collected.bytes.toString(),'redirected-video')
  assert.equal(seen[0].headers['x-goog-api-key'],'AIza-test-key-v20')
  assert.deepEqual(seen[1].headers,{})
})

test('Gemini character generation fails closed for missing reference, wrong duration and unsupported square output',async t=>{
  const root=await mkdtemp(join(tmpdir(),'veo-v20-invalid-'));t.after(()=>rm(root,{recursive:true,force:true}))
  const path=join(root,'character.png');await writeFile(path,Buffer.from('character'))
  const adapter=new GeminiVeoAdapter({credentialResolver:async()=>'AIza-test-key-v20'})
  await assert.rejects(adapter.prepare({job:baseJob,referenceAssets:[]}),e=>e.code==='PROVIDER_REFERENCE_REQUIRED')
  const short=structuredClone(baseJob);short.scene_request.output.duration_seconds=6
  assert.throws(()=>adapter.estimate({job:short}),e=>e.code==='PROVIDER_DURATION_UNSUPPORTED')
  await assert.rejects(adapter.prepare({job:short,referenceAssets:[{asset_id:FIRMES_CABALLITO_ASSET_ID,role:'CHARACTER_IDENTITY_ONLY',sha256:sha,mime_type:'image/png',path}]}),e=>e.code==='PROVIDER_DURATION_UNSUPPORTED')
  const square=structuredClone(baseJob);square.scene_request.output.aspect_ratio='1:1'
  await assert.rejects(adapter.prepare({job:square,referenceAssets:[{asset_id:FIRMES_CABALLITO_ASSET_ID,role:'CHARACTER_IDENTITY_ONLY',sha256:sha,mime_type:'image/png',path}]}),e=>e.code==='PROVIDER_CAPABILITY')
})

test('reference-video provenance is one-to-one bound to approved character references and cannot be relabeled as sticker',()=>{
  const reference={asset_id:FIRMES_CABALLITO_ASSET_ID,role:'CHARACTER_IDENTITY_ONLY',sha256:sha}
  const brand={asset_id:FIRMES_CABALLITO_ASSET_ID,sha256:sha,synthetic:false}
  const provenance={adapter:'gemini',provider_model:GEMINI_VEO_MODEL,generation_kind:'REFERENCE_VIDEO',prompt_sha256:promptSha,synthetic:true,paid:true,used_sources:[],brand_assets:[brand],reference_assets:[reference],external_review:false,automatic_social_publish:false}
  const spend={id:'spend-approved',scope_sha:'d'.repeat(64),approved_by:'owner',created_at:'2026-09-24T18:00:00Z'}
  const execution=captureProviderExecution({provider:'gemini',provenance,estimate:{credits:null,cost:.8,currency:'USD',kind:'CATALOG_REFERENCE'},assets:[],brandAssets:[brand],referenceAssets:[reference],promptSha,artifactSha:'e'.repeat(64),test:false,spendApproval:spend})
  assert.equal(execution.provenance.generation_kind,'REFERENCE_VIDEO');assert.deepEqual(execution.provenance.reference_assets,[reference])
  assert.throws(()=>captureProviderExecution({provider:'gemini',provenance:{...provenance,generation_kind:'STICKER_OVERLAY'},estimate:{cost:.8,currency:'USD'},assets:[],brandAssets:[brand],referenceAssets:[reference],promptSha,artifactSha:'e'.repeat(64),test:false,spendApproval:spend}),{code:'INVALID_PROVENANCE'})
  assert.throws(()=>captureProviderExecution({provider:'gemini',provenance:{...provenance,reference_assets:[]},estimate:{cost:.8,currency:'USD'},assets:[],brandAssets:[brand],referenceAssets:[reference],promptSha,artifactSha:'e'.repeat(64),test:false,spendApproval:spend}),{code:'INVALID_PROVENANCE'})
  assert.throws(()=>captureProviderExecution({provider:'gemini',provenance:{...provenance,prompt_sha256:'f'.repeat(64)},estimate:{cost:.8,currency:'USD'},assets:[],brandAssets:[brand],referenceAssets:[reference],promptSha,artifactSha:'e'.repeat(64),test:false,spendApproval:spend}),{code:'INVALID_PROVENANCE'})
})

test('provider registry distinguishes executable Gemini reference video from text-only Higgsfield',()=>{
  const fake={capabilities(){return {strategies:['GENERATIVE'],paid:true}},estimate(){},prepare(){},generate(){},poll(){},collect(){},provenance(){}}
  const registry=new ProviderRegistry({adapters:{gemini:fake}}),gemini=registry.list().find(p=>p.id==='gemini'),higgsfield=registry.list().find(p=>p.id==='higgsfield')
  assert.equal(gemini.available,true);assert.equal(gemini.capabilities.reference_to_video,true);assert.equal(gemini.capabilities.character_reference,true)
  assert.equal(higgsfield.capabilities.reference_to_video,false);assert.equal(higgsfield.capabilities.character_reference,false)
})

test('scene compiler accepts only provider-compatible 8-second character-video contract for Gemini',()=>{
  const state={tenants:{firmes:{tenant_id:'firmes',organization:'FIRMES',brand:{display_name:'FIRMES',identity_key:'firmes'},sources:[]}},onboarding:{},brand_assets:{},brand_characters:{},tenant_brand_profiles:{},scene_reference_assets:{},avatar_identity_packs:{},avatar_outfits:{},avatar_accessories:{},avatar_motion_presets:{},avatar_scene_packs:{}}
  seedTenantBrandModels(state,'firmes')
  const request={subject:{mode:'default_brand_character'},environment:{location_name:'Antigua Guatemala',required_elements:['colonial street'],forbidden_elements:[],civilian_only:true},action:{verb:'walking naturally'},visual_style:{realism:'photorealistic',look:['cinematic'],lighting:['daylight']},hard_constraints:[],output:{medium:'video',aspect_ratio:'9:16',duration_seconds:8,motion_intent:'walking naturally',camera_intent:'stable'},generation_mode:'provider:gemini'}
  const compiled=compileMascotScenePrompt(request,state,'firmes')
  assert.equal(compiled.structured_request.generation_mode,'provider:gemini');assert.equal(compiled.structured_request.output.duration_seconds,8)
  assert.deepEqual(compiled.reference_roles.map(r=>r.role),['CHARACTER_IDENTITY_ONLY'])
  for(const change of [
    {output:{...request.output,duration_seconds:6}},
    {output:{...request.output,aspect_ratio:'1:1'}},
    {subject:{mode:'none'}},
  ])assert.throws(()=>compileMascotScenePrompt({...structuredClone(request),...change},state,'firmes'),e=>['PROVIDER_DURATION_UNSUPPORTED','PROVIDER_CAPABILITY','PROVIDER_REFERENCE_REQUIRED'].includes(e.code))
})

test('V20 UI names generated character and sticker as different operations',async()=>{
  const [scene,jobs,worker]=await Promise.all([readFile('components/SceneBuilder.tsx','utf8'),readFile('components/jobs.tsx','utf8'),readFile('server/worker-adapters.mjs','utf8')])
  assert.match(scene,/Crear video con personaje/)
  assert.match(scene,/Agregar como sticker/)
  assert.match(scene,/No se usará un sticker|No sustituiremos el resultado por un sticker/)
  assert.match(scene,/Generar video con personaje/)
  assert.match(jobs,/Agregar sticker del Caballito/)
  assert.match(worker,/STICKER_OVERLAY/)
  assert.match(worker,/not a model-generated character scene/)
})


test('execution gateway keeps Gemini character bytes inside the spend-bound request and produces reference-video provenance after approval',async t=>{
  const root=await mkdtemp(join(tmpdir(),'veo-v20-gateway-'));t.after(()=>rm(root,{recursive:true,force:true}))
  const password='veo v20 owner password',salt=randomBytes(24).toString('hex'),hash=scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex')
  const identityFile=join(root,'identities.json');await writeFile(identityFile,JSON.stringify({users:[{id:'owner',email:'owner@example.com',password:{salt,hash},can_create_tenants:true,system_admin:true,memberships:[]}]}))
  const videoPath=join(root,'result.mp4');await execFile('/usr/bin/ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i','color=c=white:s=180x320:d=8','-c:v','libx264','-threads','1','-pix_fmt','yuv420p',videoPath]);const resultBytes=await readFile(videoPath)
  const stats={prepare:0,generate:0,poll:0,characterBytes:null}
  const adapter={
    capabilities(){return {strategies:['GENERATIVE'],paid:true,automatic_social_publish:false,async:true,provider:'gemini',model:GEMINI_VEO_MODEL,reference_to_video:true,character_reference:true}},
    estimate(){return {credits:null,cost:.8,currency:'USD',kind:'CATALOG_REFERENCE',pricing_checked_at:'2026-09-24'}},
    async ready(){return true},
    async prepare(input){stats.prepare++;assert.equal(input.referenceAssets.length,1);const ref=input.referenceAssets[0];assert.equal(ref.role,'CHARACTER_IDENTITY_ONLY');assert.equal(ref.sha256,FIRMES_CABALLITO.sha256);stats.characterBytes=await readFile(ref.path);return {...input,provider_references:[{asset_id:ref.asset_id,role:ref.role,sha256:ref.sha256}] }},
    async generate(){stats.generate++;return {request_id:'operations/veo-v20-gateway',status:'queued',telemetry:{source:'provider',provider:'gemini',request_id:'operations/veo-v20-gateway',status:'queued',kind:'status',percent:null,observed_at:new Date().toISOString()}}},
    async poll(value){stats.poll++;return {...value,status:'completed',terminal:true,telemetry:{source:'provider',provider:'gemini',request_id:value.request_id,status:'completed',kind:'status',percent:null,observed_at:new Date().toISOString()}}},
    async collect(value){return {...value,bytes:resultBytes,mime_type:'video/mp4',production_note:'fixture reference video'}},
    provenance(input){const refs=input.provider_references||[];return {adapter:'gemini',provider_model:GEMINI_VEO_MODEL,generation_kind:'REFERENCE_VIDEO',prompt_sha256:input.job.prompt_compilation.final_prompt_sha256,synthetic:true,paid:true,used_sources:[],brand_assets:refs.filter(r=>r.role==='CHARACTER_IDENTITY_ONLY').map(r=>({asset_id:r.asset_id,sha256:r.sha256,synthetic:false})),reference_assets:refs,external_review:false,automatic_social_publish:false}}
  }
  const providers=new ProviderRegistry({adapters:{gemini:adapter}}),dataRoot=join(root,'data'),service=createService({dataRoot,identityFile,publicOrigin:'http://localhost:3000',deploymentClass:'controlled_single_operator_preview',providers}),owner=(await service.auth.login({email:'owner@example.com',password})).token
  await service.createTenant(owner,{organization:'FIRMES',tenant_id:'firmes',content_context:'commercial',visual_language:'clean'})
  await service.addSource(owner,'firmes',{source:{id:'activation-source',locator:'https://example.org/authorized',purpose:'source',authorization:'explicit',match:'exact'}})
  const execution=new ExecutionService({repository:service.repository,dataRoot,graphRuntimeRoot:runtime,testMode:false,deploymentClass:'controlled_single_operator_preview',releaseSha:'a'.repeat(40),providers});execution.providerPollDelayMs=1_000_000;service.setExecution(execution)
  const scene={subject:{mode:'default_brand_character'},environment:{location_name:'Antigua Guatemala',required_elements:['colonial street'],forbidden_elements:[],civilian_only:true},action:{verb:'walking naturally with a kite',prop:'kite',framing:'vertical full-body shot'},visual_style:{realism:'photorealistic',look:['cinematic'],lighting:['daylight']},hard_constraints:[],output:{medium:'video',aspect_ratio:'9:16',duration_seconds:8,motion_intent:'natural walking and kite movement',camera_intent:'stable tracking shot'},generation_mode:'provider:gemini'}
  let catalog=await service.providerList(owner),gemini=catalog.find(p=>p.id==='gemini');assert.equal(gemini.available,false);assert.equal(gemini.availability,'CREDENTIAL_REQUIRED');await assert.rejects(service.createScene(owner,'firmes',scene),{code:'PROVIDER_UNAVAILABLE'});assert.equal(stats.generate,0)
  await service.updateIntegration(owner,'gemini',{api_key:'gemini-fixture-key-v20',budget_reference:22});catalog=await service.providerList(owner);gemini=catalog.find(p=>p.id==='gemini');assert.equal(gemini.available,true);assert.equal(gemini.availability,'CONFIGURED')
  const created=await service.createScene(owner,'firmes',scene),id=created.id;await execution.drain();let job=await service.job(owner,id)
  assert.equal(job.status,'AWAITING_SPEND_APPROVAL',JSON.stringify(job.blockers));assert.equal(job.provider_spend_request.provider,'gemini');assert.equal(job.provider_spend_request.estimate.cost,.8);assert.equal(job.provider_spend_request.budget_quote.within_item_cap,true);assert.equal(stats.generate,0)
  const internalBefore=(await service.repository.read()).jobs[id];assert.ok(internalBefore.provider_spend_request.input_hashes.some(v=>v.asset_id===FIRMES_CABALLITO_ASSET_ID&&v.sha256===FIRMES_CABALLITO.sha256))
  await service.approveProviderSpend(owner,id,{scope_sha:job.provider_spend_request.scope_sha,confirm:true});await execution.drain();job=await service.job(owner,id)
  assert.equal(stats.generate,1);assert.equal(stats.poll,1);assert.deepEqual(stats.characterBytes,await readFile('config/brand-assets/firmes-caballito.png'))
  assert.equal(job.stage,'CRITIC');assert.equal(job.status,'AWAITING_REVIEW');assert.equal(job.provider_execution.provider,'gemini');assert.equal(job.provider_execution.provenance.generation_kind,'REFERENCE_VIDEO');assert.equal(job.provider_execution.provenance.reference_assets[0].sha256,FIRMES_CABALLITO.sha256)
  const artifact=job.artifacts.find(a=>a.sha256===job.artifact_sha256);assert.equal(artifact.character_asset_sha256,FIRMES_CABALLITO.sha256);assert.equal(job.provider_execution.spend_approval.scope_sha,job.provider_spend_approval.scope_sha)
})
