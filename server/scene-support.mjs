import {randomUUID,createHash} from 'node:crypto'
import {mkdir,realpath,writeFile,readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {invariant,safeId} from './errors.mjs'
import {assertAudienceSafe,rejectSecretMaterial,contentHash} from './contracts.mjs'
import {seedTenantBrandModels,readAuthorizedBrandAsset,compileMascotScenePrompt,scenePresets,externalGenerationPackage,inspectImage} from './scene-generation.mjs'
import {avatarCatalog,avatarMcpCatalogDefinition} from './avatar-system.mjs'

const EDIT=['owner','admin','editor']
const now=()=>new Date().toISOString()
const copy=value=>structuredClone(value)

export function sceneSupport({repository,providers,auth,context,getExecution,publicJob,append}){
 async function actor(token){return auth.resolve(token)}
 async function activeState(id){return repository.transact(state=>{invariant(state.tenants[id],'SOURCE_REQUIRED','El espacio debe estar activo antes de producir.',409);seedTenantBrandModels(state,id);return state})}
 return {
  async brandProfile(token,id){await context(token,id);return repository.transact(state=>copy(seedTenantBrandModels(state,id).profile))},
  async brandCharacters(token,id){await context(token,id);return repository.transact(state=>Object.values(seedTenantBrandModels(state,id).characters).map(copy))},
  async avatarCatalog(token,id){await context(token,id);return repository.transact(state=>{const brand=seedTenantBrandModels(state,id);return copy(avatarCatalog(state,id,brand))})},
  async avatarMcpTools(token,id){await context(token,id);await activeState(id);return avatarMcpCatalogDefinition()},
  async brandAsset(token,id,assetId){await context(token,id);safeId(assetId,'Brand asset ID');const state=await repository.transact(s=>{seedTenantBrandModels(s,id);return s});return readAuthorizedBrandAsset(state,id,assetId)},
  async scenePresets(token,id){await context(token,id);return repository.transact(state=>scenePresets(state,id))},
  async uploadSceneReference(token,id,role,{bytes,mime_type}){
   const {user}=await context(token,id,EDIT)
   invariant(['ENVIRONMENT_ONLY','STYLE_ONLY'].includes(role),'INVALID_REFERENCE_ROLE','Esta referencia solo puede ser de entorno o estilo.')
   invariant(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=8*1024*1024,'INVALID_MEDIA','La referencia debe pesar menos de 8 MB.',413)
   invariant(['image/png','image/jpeg'].includes(mime_type),'INVALID_MEDIA','Sube una imagen PNG o JPEG.',415)
   const media=inspectImage(bytes,mime_type),sha=createHash('sha256').update(bytes).digest('hex'),assetId='scene_ref_'+createHash('sha256').update(role+'\0').update(bytes).digest('hex').slice(0,32)
   const directory=join(repository.root,'scene-references',id);await mkdir(directory,{recursive:true,mode:0o700});invariant(await realpath(directory)===directory,'UNSAFE_STORAGE','No se pudo preparar el almacenamiento de referencias.',503);await writeFile(join(directory,assetId),bytes,{mode:0o600})
   return repository.transact(state=>{invariant(state.tenants[id],'SOURCE_REQUIRED','El espacio debe estar activo antes de producir.',409);state.scene_reference_assets??={};state.scene_reference_assets[id]??={};const asset={asset_id:assetId,tenant_id:id,role,sha256:sha,mime_type,size_bytes:bytes.length,...media,authorization:'OPERATOR_AUTHORIZED',uploaded_by:user.id,created_at:now(),version:1};state.scene_reference_assets[id][assetId]=asset;append(state,id,'SCENE_REFERENCE_UPLOADED',{actor_id:user.id,asset_id:assetId,role});return asset})
  },
  async sceneReference(token,id,assetId){await context(token,id);safeId(assetId,'Scene reference ID');const state=await repository.read();const asset=state.scene_reference_assets?.[id]?.[assetId];invariant(asset&&asset.tenant_id===id,'NOT_FOUND','No se encontró la referencia.',404);const path=join(repository.root,'scene-references',id,assetId);invariant(await realpath(path)===path,'UNSAFE_STORAGE','La referencia no está disponible.',503);const bytes=await readFile(path);invariant(createHash('sha256').update(bytes).digest('hex')===asset.sha256,'REFERENCE_CHANGED','La referencia cambió; vuelve a cargarla.',409);return {...asset,bytes}},
  async previewScene(token,id,input){await context(token,id,EDIT);rejectSecretMaterial(input);return compileMascotScenePrompt(input,await activeState(id),id)},
  async createScene(token,id,input){
   const {user}=await context(token,id,EDIT);rejectSecretMaterial(input)
   const job=await repository.transact(state=>{
    invariant(state.tenants[id],'SOURCE_REQUIRED','El espacio debe estar activo antes de producir.',409);seedTenantBrandModels(state,id)
    const compilation=compileMascotScenePrompt(input,state,id);assertAudienceSafe(compilation.final_prompt);const request=compilation.structured_request
    const requestedProvider=request.generation_mode.startsWith('provider:')?request.generation_mode.slice('provider:'.length):'manual-external';const provider=providers.list().find(p=>p.id===requestedProvider)
    invariant(provider,'INVALID_PROVIDER','El generador seleccionado no existe.')
    if(requestedProvider!=='manual-external')invariant(provider.available===true,'PROVIDER_UNAVAILABLE','Este generador no está configurado. Usa generación externa o elige otro generador.',409)
    const jobId='mf_scene_'+contentHash({tenant_id:id,request_sha:compilation.structured_request_sha256,prompt_sha:compilation.final_prompt_sha256,nonce:randomUUID()}).slice(0,28)
    const brand=seedTenantBrandModels(state,id),character=compilation.resolved_character_id?brand.characters[compilation.resolved_character_id]:null
    const job={id:jobId,story_id:'scene_'+jobId.slice(-12),tenant_id:id,title:character?character.name+' · '+(request.environment.location_name||request.action.verb):'Escena · '+(request.environment.location_name||request.action.verb),objective:request.action.verb,source_ids:[],story_devices:[],strategy:'GENERATIVE',preferred_provider:requestedProvider,generation_mode:request.generation_mode,creation_mode:'GUIDED_SCENE',mascot:request.subject.mode!=='none',avatar_contract:compilation.avatar_contract||null,creative_context:{character:character?copy(character):null,place:request.environment.location_name?{name:request.environment.location_name}:null},scene_request:request,prompt_compilation:compilation,target:{aspect_ratio:request.output.aspect_ratio,medium:request.output.medium,...(request.output.duration_seconds?{duration_seconds:[request.output.duration_seconds,request.output.duration_seconds]}:{})},status:'BRIEF',stage:'BRIEF',graph:{nodes:[]},artifacts:[],generation_attempts:[],evidence:[],approvals:[],blockers:[],source_authorization_snapshot:[],source_asset_snapshot:[],content_dna_revision:null,tenant_brand_profile_version:brand.profile.version,job_revision:1,started:true,created_at:now(),created_by:user.id}
    state.jobs[jobId]=job;append(state,id,'SCENE_JOB_CREATED',{job_id:jobId,actor_id:user.id,prompt_sha256:compilation.final_prompt_sha256});return job
   })
   const execution=getExecution();invariant(execution?.onJobsQueued,'EXECUTION_UNAVAILABLE','La ejecución de producción no está disponible.',503);execution.onJobsQueued([job.id]);return publicJob(job)
  },
  async externalPackage(token,id){safeId(id,'Job ID');const user=await actor(token);const job=(await repository.read()).jobs[id];invariant(job,'NOT_FOUND','Production job was not found',404);const member=user.memberships.find(m=>m.tenant_id===job.tenant_id);invariant(member,'FORBIDDEN','You do not have access to this workspace or action',403);return externalGenerationPackage(job)},
  async uploadExternalResult(token,id,input){safeId(id,'Job ID');const user=await actor(token);const job=(await repository.read()).jobs[id];invariant(job,'NOT_FOUND','Production job was not found',404);const member=user.memberships.find(m=>m.tenant_id===job.tenant_id);invariant(member&&EDIT.includes(member.role),'FORBIDDEN','You do not have permission for this production',403);const execution=getExecution();invariant(execution?.uploadExternalResult,'EXECUTION_UNAVAILABLE','La ejecución de producción no está disponible.',503);return publicJob(await execution.uploadExternalResult(user,id,input))}
 }
}
