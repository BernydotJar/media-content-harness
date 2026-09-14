import {event,assertCurrent} from './worker-policy.mjs'
import {invariant} from './errors.mjs'

export async function maybeAdvanceSceneAfterApproval(service,actor,reviewedJob){
 if(reviewedJob.creation_mode!=='GUIDED_SCENE'||reviewedJob.stage!=='CRITIC'||reviewedJob.scene_request?.output?.medium!=='video'||reviewedJob.generation_phase!=='HERO_IMAGE_REVIEW')return false
 const current=(await service.repository.read()).jobs[reviewedJob.id]
 assertCurrent(await service.repository.read(),current)
 const hero=current.artifacts.find(a=>a.sha256===reviewedJob.artifact_sha256)
 invariant(hero,'ARTIFACT_REQUIRED','Approved hero artifact is missing',409)
 const reason='Approved hero image is now the immutable input for image-to-video generation'
 await service.service().failAndRepair({...service.paths(current),node:'PROVIDER_PRODUCTION',actor:actor.id,gate:'provider_production',reason})
 await service.repository.transact(state=>{
  const job=state.jobs[reviewedJob.id];assertCurrent(state,job)
  job.hero_image={artifact_id:hero.id,sha256:hero.sha256,mime_type:hero.mime_type,prompt_sha256:job.prompt_compilation.final_prompt_sha256,approved_candidate_sha:reviewedJob.candidate_sha,approved_by:actor.id,approved_at:new Date(service.clock()).toISOString()}
  job.generation_phase='VIDEO_FROM_APPROVED_HERO';job.job_revision=(job.job_revision||1)+1;job.stage='PROVIDER_PRODUCTION';job.status='QUEUED';job.review_state='CHANGES_REQUESTED';job.candidate_sha=null;job.review_candidate=null;job.artifact_sha256=null;job.artifact_url=null;job.provider_execution=null;job.production_provider=null;job.production_note='La imagen hero aprobada quedó fijada por SHA y será la única entrada visual de la animación.';job.external_generation_package=null;job.critic_actor=null;job.blockers=[]
  event(state,job,'hero_image_approved','Imagen hero aprobada; el mismo trabajo continúa a video usando su SHA exacto',service.clock())
  return null
 })
 service.onJobsQueued([reviewedJob.id])
 return true
}
