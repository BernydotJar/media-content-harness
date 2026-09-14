import {writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {invariant} from './errors.mjs'
import {inspectVideo} from './worker-adapters.mjs'
import {inspectImage,assertAspectRatio,criticRubricForScene} from './scene-generation.mjs'
import {digest,requireActor,assertCurrent,event} from './worker-policy.mjs'

const MAX_BYTES=40*1024*1024

export async function uploadExternalResult(service,actor,id,{bytes,mime_type}){
 const job=await service.job(actor,id)
 return service.lock(job,async directory=>{
  const j=(await service.repository.read()).jobs[id]
  requireActor(actor,j.tenant_id)
  assertCurrent(await service.repository.read(),j)
  invariant(j.creation_mode==='GUIDED_SCENE'&&j.preferred_provider==='manual-external','EXTERNAL_GENERATION_UNAVAILABLE','Este trabajo no usa generación externa.',409)
  invariant(j.status==='WAITING_EXTERNAL_GENERATION'&&j.stage==='PROVIDER_PRODUCTION','EXTERNAL_GENERATION_NOT_WAITING','Este trabajo no está esperando un resultado externo.',409)
  invariant(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=MAX_BYTES,'INVALID_MEDIA','El resultado debe ser un archivo menor de 40 MB.',413)
  const output=j.scene_request.output
  const phase=j.generation_phase||(output.medium==='video'?'HERO_IMAGE':'FINAL_MEDIA')
  const heroPhase=output.medium==='video'&&phase==='HERO_IMAGE'
  const videoPhase=output.medium==='video'&&phase==='VIDEO_FROM_APPROVED_HERO'
  if(heroPhase)invariant(['image/png','image/jpeg'].includes(mime_type),'IMAGE_FIRST_REQUIRED','Primero sube la imagen hero 9:16. El video se anima solo después de aprobar esa imagen.',415)
  else if(videoPhase)invariant(mime_type==='video/mp4','INVALID_MEDIA','Sube el video MP4 generado desde la imagen hero aprobada.',415)
  else invariant(['image/png','image/jpeg'].includes(mime_type),'INVALID_MEDIA','Sube una imagen PNG o JPEG para esta escena.',415)
  const hash=digest(bytes),artifactId='artifact_'+hash,extension=mime_type==='video/mp4'?'.mp4':mime_type==='image/jpeg'?'.jpg':'.png',filename=artifactId+extension,path=join(directory,'artifacts',filename)
  await writeFile(path,bytes,{mode:0o600})
  const media=mime_type==='video/mp4'?await inspectVideo(path):inspectImage(bytes,mime_type)
  assertAspectRatio(media.width,media.height,output.aspect_ratio)
  if(mime_type==='video/mp4'&&output.duration_seconds){const tolerance=Math.max(0.75,output.duration_seconds*0.2);invariant(Math.abs(media.duration_seconds-output.duration_seconds)<=tolerance,'OUTPUT_MISMATCH','La duración del video no coincide con la escena solicitada.',422)}
  let attemptId=null
  await service.repository.transact(st=>{
   const x=st.jobs[id];assertCurrent(st,x)
   const attempt=(x.generation_attempts||[]).slice().reverse().find(a=>a.adapter_id==='manual-external'&&a.status==='WAITING_EXTERNAL_RESULT')
   invariant(attempt,'GENERATION_ATTEMPT_REQUIRED','No existe un intento externo activo para este resultado.',409)
   attemptId=attempt.attempt_id;attempt.completed_at=new Date(service.clock()).toISOString();attempt.status='COMPLETED';attempt.output_asset_id=artifactId;attempt.output_sha256=hash;attempt.provider_latency_ms=Math.max(0,Date.parse(attempt.completed_at)-Date.parse(attempt.started_at))
   const characterRef=(x.prompt_compilation.reference_roles||[]).find(r=>r.role==='CHARACTER_IDENTITY_ONLY')
   const environmentRef=(x.prompt_compilation.reference_roles||[]).find(r=>r.role==='ENVIRONMENT_ONLY')
   x.artifacts=x.artifacts.filter(a=>a.id!==artifactId);x.artifacts.push({id:artifactId,asset_id:artifactId,job_id:id,tenant_id:x.tenant_id,sha256:hash,mime_type,filename,size_bytes:bytes.length,...media,generation_attempt_id:attempt.attempt_id,synthetic:true,provider:'manual-external',provider_model:null,prompt_sha256:x.prompt_compilation.final_prompt_sha256,character_asset_sha256:characterRef?.sha256||null,environment_reference_sha256:environmentRef?.sha256||null,created_at:attempt.completed_at})
   x.artifact_url='/api/v1/jobs/'+id+'/artifacts/'+artifactId;x.artifact_sha256=hash;x.production_provider='manual-external';x.provider_execution={provider:'manual-external',status:'COMPLETED',artifact_sha256:hash,test:false,estimate:{credits:null,cost:null},provenance:{adapter:'manual-external',used_sources:[],brand_assets:characterRef?[{asset_id:characterRef.asset_id,sha256:characterRef.sha256,synthetic:false}]:[],synthetic:true,paid:false,test:false,external_review:true}}
   x.production_note=heroPhase?'Imagen hero externa recibida. Debe aprobarse antes de generar el video.':'Resultado externo recibido y vinculado al intento '+attempt.attempt_id+'.'
   x.critic_rubric=criticRubricForScene(x);x.external_generation_package=null;x.status='QUEUED';x.review_state='CHANGES_REQUESTED';x.blockers=[];x.job_revision=(x.job_revision||1)+1
   x.generation_phase=heroPhase?'HERO_IMAGE_REVIEW':'FINAL_MEDIA_REVIEW'
   event(st,x,'external_result_uploaded','Resultado externo incorporado al mismo trabajo con SHA '+hash,service.clock());event(st,x,'generation_completed','Generación completada con SHA '+hash+' en '+String(attempt.provider_latency_ms)+' ms',service.clock())
   return null
  })
  await service.complete(j,'PROVIDER_PRODUCTION',{artifact_sha256:hash,generation_attempt_id:attemptId,adapter_id:'manual-external',phase:heroPhase?'HERO_IMAGE':'FINAL_MEDIA',prompt_sha256:j.prompt_compilation.final_prompt_sha256,reference_roles:j.prompt_compilation.reference_roles},'media-worker')
  service.onJobsQueued([id])
  return (await service.repository.read()).jobs[id]
 })
}
