import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,writeFile,readFile,mkdir} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {randomBytes,scryptSync} from 'node:crypto'
import {execFile as callback} from 'node:child_process'
import {promisify} from 'node:util'
import {seedTenantBrandModels,compileMascotScenePrompt,externalGenerationPackage,scenePresets,FIRMES_CABALLITO_ASSET_ID,FIRMES_CABALLITO_CHARACTER_ID,readAuthorizedBrandAsset} from '../server/scene-generation.mjs'
import {ProviderRegistry} from '../server/providers.mjs'
import {createService} from '../server/services.mjs'
import {ExecutionService} from '../server/execution.mjs'
import {assertCurrent} from '../server/worker-policy.mjs'

const execFile=promisify(callback)
const runtime=process.env.GRAPH_HARNESS_RUNTIME_ROOT||'/home/agent/.cache/media-content-harness/graph-harness-sdlc'
const firmesTenant=()=>({tenant_id:'firmes',organization:'FIRMES',brand:{display_name:'FIRMES',identity_key:'firmes'},sources:[]})
const baseScene={subject:{mode:'default_brand_character'},environment:{location_name:'Calle del Arco, Antigua Guatemala, Guatemala',required_elements:['Santa Catalina Arch','colonial buildings','cobblestone street','civilian pedestrians and tourists'],forbidden_elements:['industrial environment','port','shipping containers','cranes','forklifts','hard hats','helmets','safety vests','reflective clothing'],civilian_only:true},action:{verb:'walking casually while taking a selfie',prop:'smartphone',framing:'vertical portrait with Santa Catalina Arch visible'},visual_style:{realism:'photorealistic',look:['premium campaign photography','authentic Antigua Guatemala atmosphere'],lighting:['natural sunlight','realistic shadows']},hard_constraints:[{kind:'must_exclude',value:'cargo'}],output:{medium:'image',aspect_ratio:'9:16'},generation_mode:'manual_external'}

function stateFixture(){return {tenants:{firmes:firmesTenant()},onboarding:{},brand_assets:{},brand_characters:{},tenant_brand_profiles:{},scene_reference_assets:{},sessions:{},memberships:{},jobs:{},plans:{},releases:{},dna:{},observations:{},events:[]}}

test('FIRMES resolves immutable default mascot across asset, character and tenant profile layers',async()=>{
 const state=stateFixture(),brand=seedTenantBrandModels(state,'firmes')
 assert.equal(brand.profile.default_mascot_asset_id,FIRMES_CABALLITO_ASSET_ID)
 assert.equal(brand.profile.default_mascot_character_id,FIRMES_CABALLITO_CHARACTER_ID)
 assert.equal(brand.characters[FIRMES_CABALLITO_CHARACTER_ID].reference_asset_id,FIRMES_CABALLITO_ASSET_ID)
 assert.equal(brand.assets[FIRMES_CABALLITO_ASSET_ID].rights_state,'AUTHORIZED')
 assert.match(brand.assets[FIRMES_CABALLITO_ASSET_ID].sha256,/^[a-f0-9]{64}$/)
 const verified=await readAuthorizedBrandAsset(state,'firmes',FIRMES_CABALLITO_ASSET_ID)
 assert.equal(verified.sha256,brand.assets[FIRMES_CABALLITO_ASSET_ID].sha256)
 assert.ok(verified.bytes.length>0)
})

test('structured compiler is deterministic, separates reference roles and keeps operator override provenance',()=>{
 const state=stateFixture();seedTenantBrandModels(state,'firmes')
 state.scene_reference_assets.firmes={antigua_env:{asset_id:'antigua_env',tenant_id:'firmes',role:'ENVIRONMENT_ONLY',sha256:'e'.repeat(64),authorization:'OPERATOR_AUTHORIZED'}}
 const input={...structuredClone(baseScene),environment:{...baseScene.environment,reference_asset_id:'antigua_env'}}
 const first=compileMascotScenePrompt(input,state,'firmes'),second=compileMascotScenePrompt(input,state,'firmes')
 assert.equal(first.structured_request_sha256,second.structured_request_sha256)
 assert.equal(first.final_prompt_sha256,second.final_prompt_sha256)
 assert.deepEqual(first.reference_roles.map(r=>r.role),['CHARACTER_IDENTITY_ONLY','ENVIRONMENT_ONLY'])
 assert.match(first.final_prompt,/IMAGE 1 = CHARACTER IDENTITY ONLY/)
 assert.match(first.final_prompt,/IMAGE 2 = ENVIRONMENT ONLY/)
 assert.match(first.final_prompt,/white horse head and fur/)
 assert.match(first.final_prompt,/shipping containers/)
 assert.match(first.final_prompt,/Santa Catalina Arch/)
 const overridden=compileMascotScenePrompt({...input,operator_override:'Keep the selfie arm natural.'},state,'firmes')
 assert.equal(overridden.base_compiled_prompt_sha256,first.base_compiled_prompt_sha256)
 assert.notEqual(overridden.final_prompt_sha256,first.final_prompt_sha256)
 assert.equal(overridden.operator_override,'Keep the selfie arm natural.')
 assert.match(overridden.final_prompt,/OPERATOR OVERRIDE \(LOWER PRIORITY\)/)
 assert.ok(overridden.final_prompt.indexOf('REFERENCE AND CONSTRAINT AUTHORITY')>overridden.final_prompt.indexOf('Keep the selfie arm natural.'))
 assert.match(overridden.final_prompt,/must not weaken, negate, remove, or reassign/)
})

test('reference role and authorization drift invalidate a compiled scene even when bytes are unchanged',()=>{
 const state=stateFixture();seedTenantBrandModels(state,'firmes')
 state.scene_reference_assets.firmes={antigua_env:{asset_id:'antigua_env',tenant_id:'firmes',role:'ENVIRONMENT_ONLY',sha256:'e'.repeat(64),authorization:'OPERATOR_AUTHORIZED'}}
 const compilation=compileMascotScenePrompt({...structuredClone(baseScene),environment:{...baseScene.environment,reference_asset_id:'antigua_env'}},state,'firmes')
 const job={tenant_id:'firmes',creation_mode:'GUIDED_SCENE',tenant_brand_profile_version:1,prompt_compilation:compilation}
 assert.deepEqual(assertCurrent(state,job),[])
 state.scene_reference_assets.firmes.antigua_env.role='STYLE_ONLY'
 assert.throws(()=>assertCurrent(state,job),e=>e.code==='REFERENCE_CHANGED')
 state.scene_reference_assets.firmes.antigua_env.role='ENVIRONMENT_ONLY';state.scene_reference_assets.firmes.antigua_env.authorization='REVOKED'
 assert.throws(()=>assertCurrent(state,job),e=>e.code==='REFERENCE_CHANGED')
})

test('default is optional, cross-tenant character IDs and wrong reference roles fail closed',()=>{
 const state=stateFixture();seedTenantBrandModels(state,'firmes')
 const noCharacter=compileMascotScenePrompt({...structuredClone(baseScene),subject:{mode:'none'}},state,'firmes')
 assert.equal(noCharacter.resolved_character_id,null)
 assert.equal(noCharacter.reference_roles.length,0)
 state.tenants.other={tenant_id:'other',organization:'Other',brand:{display_name:'Other'},sources:[]}
 seedTenantBrandModels(state,'other')
 assert.throws(()=>compileMascotScenePrompt({...structuredClone(baseScene),subject:{mode:'explicit_character',character_id:FIRMES_CABALLITO_CHARACTER_ID}},state,'other'),e=>e.code==='CHARACTER_FORBIDDEN')
 state.scene_reference_assets.firmes={style_ref:{asset_id:'style_ref',tenant_id:'firmes',role:'STYLE_ONLY',sha256:'f'.repeat(64),authorization:'OPERATOR_AUTHORIZED'}}
 assert.throws(()=>compileMascotScenePrompt({...structuredClone(baseScene),environment:{...baseScene.environment,reference_asset_id:'style_ref'}},state,'firmes'),e=>e.code==='REFERENCE_FORBIDDEN')
})

test('generic tenant does not require a FIRMES character and receives neutral preset labels',()=>{
 const state=stateFixture();state.tenants.other={tenant_id:'other',organization:'Other',brand:{display_name:'Other'},sources:[]}
 const brand=seedTenantBrandModels(state,'other'),presets=scenePresets(state,'other')
 assert.equal(brand.profile.default_mascot_character_id,null)
 assert.equal(presets[0].scene.subject.mode,'none')
 assert.doesNotMatch(presets.map(p=>p.name).join(' '),/Caballito/)
})

test('provider registry exposes manual external as operational and unconfigured generators truthfully',()=>{
 const providers=new ProviderRegistry().list()
 const manual=providers.find(p=>p.id==='manual-external'),seedance=providers.find(p=>p.id==='seedance')
 assert.equal(manual.available,true)
 assert.equal(manual.availability,'AVAILABLE')
 assert.equal(manual.capabilities.multi_reference,true)
 assert.equal(seedance.available,false)
 assert.equal(seedance.availability,'INTEGRATION_REQUIRED')
 assert.equal(seedance.capabilities.multi_reference,false)
})

test('external package changes from hero-image creation to exact approved hero animation',()=>{
 const state=stateFixture();const compilation=compileMascotScenePrompt({...structuredClone(baseScene),output:{medium:'video',aspect_ratio:'9:16',duration_seconds:6,motion_intent:'subtle walking motion',camera_intent:'stable vertical camera'}},state,'firmes')
 const job={id:'scene-job',tenant_id:'firmes',creation_mode:'GUIDED_SCENE',prompt_compilation:compilation,scene_request:compilation.structured_request,status:'WAITING_EXTERNAL_GENERATION',job_revision:1,generation_phase:'HERO_IMAGE'}
 const hero=externalGenerationPackage(job)
 assert.equal(hero.expected_output.medium,'image')
 assert.equal(hero.generation_phase,'HERO_IMAGE')
 const animation=externalGenerationPackage({...job,job_revision:2,generation_phase:'VIDEO_FROM_APPROVED_HERO',hero_image:{artifact_id:'artifact_hero',sha256:'a'.repeat(64)}})
 assert.equal(animation.expected_output.medium,'video')
 const ref=animation.references.find(r=>r.role==='APPROVED_HERO_IMAGE')
 assert.equal(ref.sha256,'a'.repeat(64))
 assert.match(animation.reference_role_explanation.APPROVED_HERO_IMAGE,/Anima exactamente/)
})

async function integrationFixture(t){
 const root=await mkdtemp(join(tmpdir(),'media-scene-generation-'));t.after(()=>rm(root,{recursive:true,force:true}))
 const password='scene test password';const salt=randomBytes(24).toString('hex');const hash=scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex')
 const users=[
  {id:'owner',email:'owner@example.com',name:'Owner',password:{salt,hash},can_create_tenants:true,memberships:[]},
  {id:'critic',email:'critic@example.com',name:'Critic',password:{salt,hash},memberships:[{tenant_id:'firmes',role:'reviewer'}]},
  {id:'verifier',email:'verifier@example.com',name:'Verifier',password:{salt,hash},memberships:[{tenant_id:'firmes',role:'admin'}]},
 ]
 const identityFile=join(root,'identities.json');await writeFile(identityFile,JSON.stringify({users}))
 const dataRoot=join(root,'data'),service=createService({dataRoot,identityFile,publicOrigin:'http://localhost:3000',deploymentClass:'controlled_single_operator_preview'})
 const owner=(await service.auth.login({email:'owner@example.com',password})).token,critic=(await service.auth.login({email:'critic@example.com',password})).token,verifier=(await service.auth.login({email:'verifier@example.com',password})).token
 await service.createTenant(owner,{organization:'FIRMES',tenant_id:'firmes',content_context:'community',visual_language:'Burgundy, warm, community-first'})
 await service.addSource(owner,'firmes',{source:{id:'activation-source',locator:'https://example.org/authorized-video',purpose:'source',authorization:'explicit',match:'exact'}})
 const execution=new ExecutionService({repository:service.repository,dataRoot,graphRuntimeRoot:runtime,testMode:false,deploymentClass:'controlled_single_operator_preview',releaseSha:'a'.repeat(40)})
 service.setExecution(execution)
 const fixtureDir=join(root,'fixtures');await mkdir(fixtureDir)
 async function image(name,color='white'){const path=join(fixtureDir,name+'.png');await execFile('/usr/bin/ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i',`color=c=${color}:s=90x160:d=0.1`,'-frames:v','1',path]);return readFile(path)}
 async function video(name,color='white'){const path=join(fixtureDir,name+'.mp4');await execFile('/usr/bin/ffmpeg',['-nostdin','-v','error','-y','-f','lavfi','-i',`color=c=${color}:s=90x160:d=6`,'-c:v','libx264','-threads','1','-pix_fmt','yuv420p',path]);return readFile(path)}
 return {root,service,execution,owner,critic,verifier,image,video}
}

test('scene-reference identity is role-bound and non-editors cannot upload references',async t=>{
 const f=await integrationFixture(t),bytes=await f.image('role-bound','purple')
 const env=await f.service.uploadSceneReference(f.owner,'firmes','ENVIRONMENT_ONLY',{bytes,mime_type:'image/png'})
 const style=await f.service.uploadSceneReference(f.owner,'firmes','STYLE_ONLY',{bytes,mime_type:'image/png'})
 assert.notEqual(env.asset_id,style.asset_id)
 assert.equal(env.sha256,style.sha256)
 assert.equal(env.role,'ENVIRONMENT_ONLY');assert.equal(style.role,'STYLE_ONLY')
 await assert.rejects(f.service.uploadSceneReference(f.critic,'firmes','ENVIRONMENT_ONLY',{bytes,mime_type:'image/png'}),e=>e.code==='FORBIDDEN')
})

test('manual external generation resumes the same job, critic repair regenerates, verifier and release bind the exact accepted SHA',async t=>{
 const f=await integrationFixture(t)
 const created=await f.service.createScene(f.owner,'firmes',structuredClone(baseScene));const id=created.id
 await f.execution.drain();let j=await f.service.job(f.owner,id)
 assert.equal(j.id,id);assert.equal(j.status,'WAITING_EXTERNAL_GENERATION',JSON.stringify(j.blockers));assert.equal(j.stage,'PROVIDER_PRODUCTION');assert.equal(j.generation_attempts.length,1);assert.equal(j.generation_attempts[0].status,'WAITING_EXTERNAL_RESULT')
 assert.deepEqual(j.external_generation_package.references.map(r=>r.role),['CHARACTER_IDENTITY_ONLY'])
 const first=await f.image('first','red');await f.service.uploadExternalResult(f.owner,id,{bytes:first,mime_type:'image/png'});await f.execution.drain();j=await f.service.job(f.owner,id)
 assert.equal(j.id,id);assert.equal(j.stage,'CRITIC');assert.equal(j.status,'AWAITING_REVIEW');assert.ok(j.critic_rubric.negative_checks.some(v=>/shipping containers/.test(v)));assert.equal(j.generation_attempts[0].status,'COMPLETED')
 const firstSha=j.artifact_sha256
 await f.service.jobAction(f.critic,id,'requestChanges',{candidate_sha:j.candidate_sha,review_stage:'CRITIC',reason:'Apareció vestuario o equipo industrial prohibido.'});await f.execution.drain();j=await f.service.job(f.owner,id)
 assert.equal(j.id,id);assert.equal(j.status,'WAITING_EXTERNAL_GENERATION');assert.equal(j.stage,'PROVIDER_PRODUCTION');assert.equal(j.generation_attempts.length,2);assert.equal(j.generation_attempt_count,2);assert.equal(j.generation_attempts[1].retry_of,j.generation_attempts[0].attempt_id);assert.equal(j.blockers.length,0);assert.equal(j.critic_findings.at(-1).finding,'Apareció vestuario o equipo industrial prohibido.')
 const accepted=await f.image('accepted','green');await f.service.uploadExternalResult(f.owner,id,{bytes:accepted,mime_type:'image/png'});await f.execution.drain();j=await f.service.job(f.owner,id)
 assert.equal(j.stage,'CRITIC');assert.notEqual(j.artifact_sha256,firstSha);const acceptedSha=j.artifact_sha256
 await f.service.jobAction(f.critic,id,'approve',{candidate_sha:j.candidate_sha,review_stage:j.stage});await f.execution.drain();j=await f.service.job(f.owner,id);assert.equal(j.stage,'INDEPENDENT_VERIFIER')
 await f.service.jobAction(f.verifier,id,'approve',{candidate_sha:j.candidate_sha,review_stage:j.stage});await f.execution.drain();j=await f.service.job(f.owner,id);assert.equal(j.stage,'RELEASE')
 await f.service.jobAction(f.owner,id,'approve',{candidate_sha:j.candidate_sha,review_stage:j.stage});j=await f.service.job(f.owner,id)
 assert.equal(j.status,'RELEASED');assert.equal(j.artifact_sha256,acceptedSha)
 const release=await f.service.release(f.owner,j.release_id);assert.equal(release.artifact_sha256,acceptedSha);assert.equal(release.artifacts.length,1);assert.equal(release.artifacts[0].sha256,acceptedSha);assert.equal(release.scene_provenance.character_id,FIRMES_CABALLITO_CHARACTER_ID);assert.equal(release.scene_provenance.result_sha256,acceptedSha);assert.equal(release.scene_provenance.final_prompt_sha256,j.prompt_compilation.final_prompt_sha256);const events=await f.service.events(f.owner,id);assert.ok(events.some(e=>e.event==='generation_started'));assert.ok(events.some(e=>e.event==='generation_completed'));assert.ok(events.some(e=>e.event==='critic_failed'));assert.ok(events.some(e=>e.event==='regeneration_requested'));assert.ok(events.some(e=>e.event==='job_completed'))
})

test('video scene is image-first and the approved hero SHA becomes an explicit animation input in the same job',async t=>{
 const f=await integrationFixture(t)
 const request={...structuredClone(baseScene),output:{medium:'video',aspect_ratio:'9:16',duration_seconds:6,motion_intent:'subtle walking motion, selfie arm movement, natural background movement',camera_intent:'stable realistic vertical camera'}}
 const created=await f.service.createScene(f.owner,'firmes',request);const id=created.id;await f.execution.drain();let j=await f.service.job(f.owner,id)
 assert.equal(j.status,'WAITING_EXTERNAL_GENERATION',JSON.stringify(j.blockers));assert.equal(j.external_generation_package.generation_phase,'HERO_IMAGE');assert.equal(j.external_generation_package.expected_output.medium,'image')
 const hero=await f.image('hero','blue');await f.service.uploadExternalResult(f.owner,id,{bytes:hero,mime_type:'image/png'});await f.execution.drain();j=await f.service.job(f.owner,id)
 assert.equal(j.stage,'CRITIC');assert.equal(j.generation_phase,'HERO_IMAGE_REVIEW');const heroSha=j.artifact_sha256
 await f.service.jobAction(f.critic,id,'approve',{candidate_sha:j.candidate_sha,review_stage:j.stage});await f.execution.drain();j=await f.service.job(f.owner,id)
 assert.equal(j.id,id);assert.equal(j.status,'WAITING_EXTERNAL_GENERATION');assert.equal(j.generation_phase,'VIDEO_FROM_APPROVED_HERO');assert.equal(j.hero_image.sha256,heroSha);assert.equal(j.external_generation_package.expected_output.medium,'video')
 const approvedHero=j.external_generation_package.references.find(r=>r.role==='APPROVED_HERO_IMAGE');assert.equal(approvedHero.sha256,heroSha)
 const secondAttempt=j.generation_attempts.at(-1);assert.ok(secondAttempt.input_assets.some(a=>a.role==='APPROVED_HERO_IMAGE'&&a.sha256===heroSha))
 const video=await f.video('final-video','yellow');await f.service.uploadExternalResult(f.owner,id,{bytes:video,mime_type:'video/mp4'});await f.execution.drain();j=await f.service.job(f.owner,id)
 assert.equal(j.stage,'CRITIC');assert.equal(j.generation_phase,'FINAL_MEDIA_REVIEW');assert.notEqual(j.artifact_sha256,heroSha)
})
