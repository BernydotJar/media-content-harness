import {createHash} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import {join} from 'node:path'
import {invariant,safeId,boundedText,fields} from './errors.mjs'
import {FIRMES_CABALLITO,isFirmesTenantRecord} from './brand-assets.mjs'
import {seedAvatarSystem,avatarCatalog,normalizeAvatarSelection,avatarPromptSections,avatarCriticPlan,assertAvatarHardConstraints,assertAvatarEnvironmentCompatibility} from './avatar-system.mjs'

export const SCENE_COMPILER_VERSION='mascot-scene-compiler.v2'
export const REFERENCE_ROLES=Object.freeze(['CHARACTER_IDENTITY_ONLY','ENVIRONMENT_ONLY','STYLE_ONLY'])
export const FIRMES_CABALLITO_ASSET_ID='brand_asset_firmes_caballito_v1'
export const FIRMES_CABALLITO_CHARACTER_ID='brand_character_firmes_caballito_v1'
const HASH=/^[a-f0-9]{64}$/
const FIRMES_REGISTERED_AT='2026-09-13T00:00:00.000Z'

function hash(value){return createHash('sha256').update(Buffer.isBuffer(value)?value:canonical(value)).digest('hex')}
function canonical(value){if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';return JSON.stringify(value)}
function list(value,label,{max=24,itemMax=180}={}){invariant(value===undefined||Array.isArray(value),'INVALID_SCENE',label+' must be a list');const items=(value||[]).map(v=>boundedText(v,label,itemMax));invariant(items.length<=max,'INVALID_SCENE',label+' has too many entries');return [...new Set(items)]}
function optionalText(value,label,max=500){if(value===undefined||value===null||value==='')return null;return boundedText(value,label,max)}
function now(){return new Date().toISOString()}

export function seedTenantBrandModels(state,tenantId){
 safeId(tenantId,'Workspace ID')
 const tenant=state.tenants?.[tenantId]||state.onboarding?.[tenantId]
 invariant(tenant,'NOT_FOUND','No se encontró el espacio.',404)
 state.brand_assets??={};state.brand_assets[tenantId]??={}
 state.brand_characters??={};state.brand_characters[tenantId]??={}
 state.tenant_brand_profiles??={}
 if(isFirmesTenantRecord(tenant)){
  state.brand_assets[tenantId][FIRMES_CABALLITO_ASSET_ID]??={
   asset_id:FIRMES_CABALLITO_ASSET_ID,tenant_id:tenantId,kind:'CHARACTER_REFERENCE',storage_ref:FIRMES_CABALLITO.relative_path,sha256:FIRMES_CABALLITO.sha256,mime_type:'image/png',
   provenance:{source:'FIRMES authorized brand manual asset',legacy_asset_id:FIRMES_CABALLITO.id},rights_state:'AUTHORIZED',synthetic:false,created_at:FIRMES_REGISTERED_AT,version:1
  }
  state.brand_characters[tenantId][FIRMES_CABALLITO_CHARACTER_ID]??={
   character_id:FIRMES_CABALLITO_CHARACTER_ID,tenant_id:tenantId,name:'Caballito FIRMES',slug:'caballito-firmes',role:'mascot',reference_asset_id:FIRMES_CABALLITO_ASSET_ID,default_enabled:true,
   wardrobe_defaults:{top:'burgundy FIRMES polo',bottom:'beige casual pants',shoes:'casual shoes'},
   identity_constraints:{
    preserve:['Caballito FIRMES identity','white horse head and fur','red mane','recognizable face','eyes','muzzle','mascot proportions','burgundy FIRMES polo identity'],
    exclude_from_source:['port','cargo yard','shipping containers','cranes','industrial workers','hard hats','helmets','safety vests','reflective vests','forklift','warehouse','docks','maritime infrastructure']
   },
   environment_rules:{allowed_contexts:['community','tourism','heritage','neighborhood','family','public street'],disallowed_contexts:['industrial port','cargo yard','warehouse','construction site']},
   created_at:FIRMES_REGISTERED_AT,version:1
  }
  const previous=state.tenant_brand_profiles[tenantId]
  state.tenant_brand_profiles[tenantId]??={
   tenant_id:tenantId,identity_key:'firmes',brand_name:'FIRMES',colors:{primary:'#6f1733',secondary:'#ffffff',accent:'#b78b55'},logo_asset_id:null,
   default_mascot_asset_id:FIRMES_CABALLITO_ASSET_ID,default_mascot_character_id:FIRMES_CABALLITO_CHARACTER_ID,require_default_mascot_for_campaign_content:false,
   voice:{language:'es',qualities:['cercana','comunitaria','clara']},version:1,created_at:FIRMES_REGISTERED_AT
  }
  if(previous&&(!previous.default_mascot_character_id||!previous.default_mascot_asset_id)){
   previous.default_mascot_character_id=FIRMES_CABALLITO_CHARACTER_ID;previous.default_mascot_asset_id=FIRMES_CABALLITO_ASSET_ID;previous.version=(previous.version||0)+1;previous.updated_at=now()
  }
 }
 const brand={
  profile:state.tenant_brand_profiles[tenantId]||{tenant_id:tenantId,identity_key:tenant.brand?.identity_key||null,brand_name:tenant.brand?.display_name||tenant.organization,colors:{primary:null,secondary:null,accent:null},logo_asset_id:null,default_mascot_asset_id:null,default_mascot_character_id:null,require_default_mascot_for_campaign_content:false,version:1},
  assets:state.brand_assets[tenantId],characters:state.brand_characters[tenantId]
 }
 seedAvatarSystem(state,tenantId,brand)
 return brand
}

export async function readAuthorizedBrandAsset(state,tenantId,assetId,root=process.cwd()){
 safeId(tenantId,'Workspace ID');safeId(assetId,'Brand asset ID')
 const {assets}=seedTenantBrandModels(state,tenantId)
 const asset=assets[assetId]
 invariant(asset&&asset.tenant_id===tenantId,'NOT_FOUND','No se encontró el activo de marca.',404)
 invariant(asset.rights_state==='AUTHORIZED','AUTHORIZATION_REQUIRED','El activo de marca no tiene autorización vigente.',409)
 invariant(HASH.test(asset.sha256),'BRAND_ASSET_CHANGED','La referencia autorizada no tiene una huella válida.',409)
 const path=join(root,asset.storage_ref)
 const bytes=await readFile(path)
 const actual=hash(bytes)
 invariant(actual===asset.sha256,'BRAND_ASSET_CHANGED','La referencia autorizada cambió; se detuvo la producción.',409)
 return {...asset,path,bytes}
}

function normalizeSubject(subject,brand){
 const value=subject&&typeof subject==='object'?subject:{}
 fields(value,['mode','character_id','identity_reference_asset_id','preserve','exclude_from_identity_source','wardrobe'])
 const mode=value.mode||'default_brand_character'
 invariant(['default_brand_character','explicit_character','none'].includes(mode),'INVALID_SCENE','Elige un personaje válido.')
 if(mode==='none')return {mode:'none',character_id:null,identity_reference_asset_id:null,preserve:[],exclude_from_identity_source:[],wardrobe:{top:null,bottom:null,shoes:null,forbidden:[]}}
 const characterId=mode==='default_brand_character'?brand.profile.default_mascot_character_id:value.character_id
 invariant(characterId,'MASCOT_REQUIRED','Este espacio no tiene un personaje predeterminado; elige uno o usa “Sin personaje”.',409)
 safeId(characterId,'Character ID')
 const character=brand.characters[characterId]
 invariant(character&&character.tenant_id===brand.profile.tenant_id,'CHARACTER_FORBIDDEN','El personaje no pertenece a este espacio.',403)
 const assetId=value.identity_reference_asset_id||character.reference_asset_id
 safeId(assetId,'Brand asset ID')
 const asset=brand.assets[assetId]
 invariant(asset&&asset.tenant_id===brand.profile.tenant_id&&asset.rights_state==='AUTHORIZED','CHARACTER_FORBIDDEN','La referencia del personaje no está autorizada para este espacio.',403)
 invariant(character.reference_asset_id===assetId,'CHARACTER_REFERENCE_MISMATCH','La referencia no corresponde al personaje autorizado.',409)
 const wardrobe=value.wardrobe&&typeof value.wardrobe==='object'?value.wardrobe:{}
 fields(wardrobe,['top','bottom','shoes','forbidden'])
 return {mode,character_id:characterId,identity_reference_asset_id:assetId,preserve:list(value.preserve??character.identity_constraints.preserve,'Preservar'),exclude_from_identity_source:list(value.exclude_from_identity_source??character.identity_constraints.exclude_from_source,'Excluir de la referencia'),wardrobe:{top:optionalText(wardrobe.top??character.wardrobe_defaults.top,'Prenda superior',160),bottom:optionalText(wardrobe.bottom??character.wardrobe_defaults.bottom,'Prenda inferior',160),shoes:optionalText(wardrobe.shoes??character.wardrobe_defaults.shoes,'Calzado',160),forbidden:list(wardrobe.forbidden,'Vestuario prohibido')}}
}
function normalizeEnvironment(environment,state,tenantId){
 const value=environment&&typeof environment==='object'?environment:{}
 fields(value,['reference_asset_id','location_name','required_elements','forbidden_elements','civilian_only'])
 let referenceAssetId=value.reference_asset_id||null
 if(referenceAssetId){safeId(referenceAssetId,'Environment reference ID');const asset=state.scene_reference_assets?.[tenantId]?.[referenceAssetId];invariant(asset&&asset.tenant_id===tenantId&&asset.role==='ENVIRONMENT_ONLY','REFERENCE_FORBIDDEN','La referencia de entorno no pertenece a este espacio.',403)}
 return {reference_asset_id:referenceAssetId,location_name:optionalText(value.location_name,'Lugar',300),required_elements:list(value.required_elements,'Elementos requeridos'),forbidden_elements:list(value.forbidden_elements,'Elementos prohibidos'),civilian_only:value.civilian_only===true}
}
function normalizeAction(action){const value=action&&typeof action==='object'?action:{};fields(value,['verb','prop','framing']);return {verb:boundedText(value.verb||'standing naturally','Acción',300),prop:optionalText(value.prop,'Objeto',180),framing:optionalText(value.framing,'Encuadre',180)}}
function normalizeStyle(style){const value=style&&typeof style==='object'?style:{};fields(value,['realism','look','lighting']);return {realism:optionalText(value.realism||'photorealistic','Realismo',100),look:list(value.look,'Estilo'),lighting:list(value.lighting,'Iluminación')}}
function normalizeOutput(output){const value=output&&typeof output==='object'?output:{};fields(value,['medium','aspect_ratio','duration_seconds','motion_intent','camera_intent']);const medium=value.medium||'image',aspect=value.aspect_ratio||'9:16';invariant(['image','video'].includes(medium),'INVALID_SCENE','Elige imagen o video.');invariant(['9:16','1:1','16:9'].includes(aspect),'INVALID_SCENE','Elige un formato compatible.');let duration=null;if(medium==='video'){duration=Number(value.duration_seconds??6);invariant(Number.isFinite(duration)&&duration>=1&&duration<=30,'INVALID_SCENE','La duración debe estar entre 1 y 30 segundos.')}return {medium,aspect_ratio:aspect,duration_seconds:duration,motion_intent:optionalText(value.motion_intent,'Movimiento',500),camera_intent:optionalText(value.camera_intent,'Cámara',500)}}
function normalizeHardConstraints(value){invariant(value===undefined||Array.isArray(value),'INVALID_SCENE','Las restricciones deben ser una lista.');return (value||[]).map((item,index)=>{invariant(item&&typeof item==='object'&&!Array.isArray(item),'INVALID_SCENE','Restricción inválida.');fields(item,['kind','value']);invariant(['must_include','must_exclude'].includes(item.kind),'INVALID_SCENE','Tipo de restricción inválido.');return {kind:item.kind,value:boundedText(item.value,'Restricción '+(index+1),220)}})}

export function normalizeSceneRequest(input,state,tenantId){
 fields(input,['subject','avatar','environment','action','visual_style','hard_constraints','output','operator_override','generation_mode','preset_id'])
 const brand=seedTenantBrandModels(state,tenantId)
 const subject=normalizeSubject(input.subject,brand)
 const avatar_contract=normalizeAvatarSelection(input.avatar,avatarCatalog(state,tenantId,brand),subject.character_id)
 const scenePack=avatar_contract?.scene_pack||null
 const environmentInput=scenePack?{
  ...scenePack.environment,
  ...(input.environment||{}),
  required_elements:[...new Set([...(scenePack.environment.required_elements||[]),...(input.environment?.required_elements||[])])],
  forbidden_elements:[...new Set([...(scenePack.environment.forbidden_elements||[]),...(input.environment?.forbidden_elements||[])])]
 }:input.environment
 const environment=normalizeEnvironment(environmentInput,state,tenantId)
 assertAvatarEnvironmentCompatibility(environment,avatar_contract)
 const action=normalizeAction(input.action)
 const visual_style=normalizeStyle(input.visual_style)
 const output=normalizeOutput(input.output)
 if(avatar_contract&&output.medium==='video'){
  const [min,max]=avatar_contract.motion.duration_range_seconds
  invariant(output.duration_seconds>=min&&output.duration_seconds<=max,'AVATAR_MOTION_DURATION','La duración del video no es compatible con el movimiento seleccionado.',409)
 }
 const hard_constraints=normalizeHardConstraints(input.hard_constraints)
 assertAvatarHardConstraints(hard_constraints,avatar_contract)
 const operator_override=optionalText(input.operator_override,'Ajuste manual',4000)
 const generation_mode=input.generation_mode||'manual_external'
 invariant(generation_mode==='manual_external'||/^provider:[a-z0-9_-]+$/.test(generation_mode),'INVALID_SCENE','Elige una ruta de generación válida.')
 if(generation_mode==='provider:gemini'){
  invariant(subject.mode!=='none'&&subject.identity_reference_asset_id,'PROVIDER_REFERENCE_REQUIRED','Gemini/Veo necesita el personaje aprobado para generar este video.',409)
  invariant(output.medium==='video','PROVIDER_CAPABILITY','Gemini/Veo con personaje genera video, no una imagen fija.',409)
  invariant(output.duration_seconds===8,'PROVIDER_DURATION_UNSUPPORTED','Gemini/Veo con referencia de personaje requiere un video de 8 segundos.',409)
  invariant(['9:16','16:9'].includes(output.aspect_ratio),'PROVIDER_CAPABILITY','Gemini/Veo con personaje admite 9:16 o 16:9.',409)
 }
 return {tenant_id:tenantId,subject,avatar_contract,environment,action,visual_style,hard_constraints,output,operator_override,generation_mode,preset_id:input.preset_id||null}
}

function section(title,lines){const clean=lines.filter(Boolean);return clean.length?title+'\n\n'+clean.join('\n'):' '}
export function compileMascotScenePrompt(input,state,tenantId){
 const request=normalizeSceneRequest(input,state,tenantId)
 const brand=seedTenantBrandModels(state,tenantId)
 const character=request.subject.mode==='none'?null:brand.characters[request.subject.character_id]
 const refs=[]
 if(character)refs.push({reference_id:'REFERENCE_A',asset_id:request.subject.identity_reference_asset_id,role:'CHARACTER_IDENTITY_ONLY',sha256:brand.assets[request.subject.identity_reference_asset_id].sha256,authorization:'AUTHORIZED',tenant_id:tenantId})
 if(request.environment.reference_asset_id){const asset=state.scene_reference_assets?.[tenantId]?.[request.environment.reference_asset_id];refs.push({reference_id:character?'REFERENCE_B':'REFERENCE_A',asset_id:asset.asset_id,role:'ENVIRONMENT_ONLY',sha256:asset.sha256,authorization:asset.authorization,tenant_id:tenantId})}
 const priority=refs.map((r,i)=>`IMAGE ${i+1} = ${r.role.replaceAll('_',' ')}.`)
 const preserve=character?request.subject.preserve.map(v=>'- '+v):[]
 const sourceExclusions=character?request.subject.exclude_from_identity_source.map(v=>'- '+v):[]
 const required=[...request.environment.required_elements,...request.hard_constraints.filter(c=>c.kind==='must_include').map(c=>c.value)]
 const excluded=[...request.environment.forbidden_elements,...request.subject.wardrobe.forbidden,...request.hard_constraints.filter(c=>c.kind==='must_exclude').map(c=>c.value)]
 if(request.environment.civilian_only)excluded.push('industrial workers','construction workers','safety uniforms')
 const style=[request.visual_style.realism,...request.visual_style.look,...request.visual_style.lighting].filter(Boolean)
 const wardrobe=character?[request.subject.wardrobe.top&&'- '+request.subject.wardrobe.top,request.subject.wardrobe.bottom&&'- '+request.subject.wardrobe.bottom,request.subject.wardrobe.shoes&&'- '+request.subject.wardrobe.shoes].filter(Boolean):[]
 const action=[`- ${request.action.verb}`,request.action.prop&&`- prop: ${request.action.prop}`,request.action.framing&&`- framing: ${request.action.framing}`].filter(Boolean)
 const output=[`- medium: ${request.output.medium}`,`- aspect ratio: ${request.output.aspect_ratio}`,request.output.duration_seconds&&`- duration: ${request.output.duration_seconds} seconds`,request.output.motion_intent&&`- motion intent: ${request.output.motion_intent}`,request.output.camera_intent&&`- camera intent: ${request.output.camera_intent}`].filter(Boolean)
 const parts=[]
 if(priority.length)parts.push(section('REFERENCE PRIORITY RULES',priority.concat(character?['Do not transfer environmental elements from the character identity reference.','Replace the original character-reference environment with the requested target environment.']:[])))
 if(character)parts.push(section('CHARACTER IDENTITY PRESERVATION',[`Preserve only the approved ${character.name} identity from its identity reference:`,...preserve]))
 if(sourceExclusions.length)parts.push(section('CHARACTER SOURCE EXCLUSIONS',['Ignore these as accidental elements from the character identity source. Do not copy them merely because they appear in that image. If the structured AVATAR OUTFIT or AVATAR ADD-ONS contract explicitly reintroduces the same semantic item, the structured avatar contract takes precedence for that requested item:',...sourceExclusions]))
 for(const avatarSection of avatarPromptSections(request.avatar_contract))parts.push(section(avatarSection.title,avatarSection.lines))
 parts.push(section('TARGET ENVIRONMENT',[request.environment.location_name?`- ${request.environment.location_name}`:'- Use only the described scene environment.']))
 if(required.length)parts.push(section('REQUIRED ENVIRONMENT ELEMENTS',required.map(v=>'- '+v)))
 if(wardrobe.length)parts.push(section('WARDROBE',wardrobe))
 parts.push(section('ACTION',action))
 if(excluded.length)parts.push(section('ABSOLUTE EXCLUSIONS',[...new Set(excluded)].map(v=>'- '+v)))
 if(style.length)parts.push(section('STYLE',style.map(v=>'- '+v)))
 parts.push(section('OUTPUT / CAMERA / MOTION REQUIREMENTS',output))
 const base_compiled_prompt=parts.join('\n\n').trim()
 const base_compiled_prompt_sha256=hash(base_compiled_prompt)
 const override_guard='REFERENCE AND CONSTRAINT AUTHORITY\n\nThe semantic reference roles, AVATAR IDENTITY LOCK, AVATAR OUTFIT, AVATAR ADD-ONS, FIRMES BRAND MARKER POLICY, AVATAR MOTION PROFILE, identity-preservation rules, required elements, and absolute exclusions above remain authoritative. Any operator override is additive only and must not weaken, negate, remove, or reassign them.'
 const final_prompt=request.operator_override?base_compiled_prompt+'\n\nOPERATOR OVERRIDE (LOWER PRIORITY)\n\n'+request.operator_override+'\n\n'+override_guard:base_compiled_prompt
 const structured_request_sha256=hash({...request,operator_override:null})
 return {
  compiler_version:SCENE_COMPILER_VERSION,structured_request_sha256,structured_request:{...request,operator_override:undefined},
  base_compiled_prompt,base_compiled_prompt_sha256,operator_override:request.operator_override,final_prompt,final_prompt_sha256:hash(final_prompt),compiled_prompt:final_prompt,compiled_prompt_sha256:hash(final_prompt),
  resolved_character_id:character?.character_id||null,resolved_character_asset_id:request.subject.identity_reference_asset_id||null,resolved_character_asset_sha256:request.subject.identity_reference_asset_id?brand.assets[request.subject.identity_reference_asset_id].sha256:null,
  avatar_contract:request.avatar_contract,avatar_contract_sha256:request.avatar_contract?.contract_sha256||null,
  reference_roles:refs,hard_constraints:request.hard_constraints,tenant_brand_profile_version:brand.profile.version,timestamp:now()
 }
}

export function scenePresets(state,tenantId){
 const brand=seedTenantBrandModels(state,tenantId)
 const withDefault=Boolean(brand.profile.default_mascot_character_id)
 const subject=()=>withDefault?{mode:'default_brand_character'}:{mode:'none'}
 const antigua={location_name:'Calle del Arco, Antigua Guatemala, Guatemala',required_elements:['Santa Catalina Arch','colonial buildings','cobblestone street','civilian pedestrians and tourists'],forbidden_elements:['industrial environment','port','shipping containers','warehouses','construction site','cranes','forklifts','hard hats','helmets','safety vests','reflective clothing'],civilian_only:true}
 const style={realism:'photorealistic',look:['premium campaign photography','authentic community atmosphere'],lighting:['natural sunlight','realistic shadows']}
 return [
  {id:'caballito-antigua',name:withDefault?'Caballito en Antigua':'Escena en Antigua',scene:{subject:subject(),environment:antigua,action:{verb:'walking casually through Antigua Guatemala'},visual_style:style,hard_constraints:[],output:{medium:'image',aspect_ratio:'9:16'}}},
  {id:'caballito-selfie-turistico',name:withDefault?'Caballito selfie turístico':'Selfie turístico',scene:{subject:subject(),environment:antigua,action:{verb:'walking casually while taking a selfie',prop:'smartphone',framing:'vertical social portrait with landmark visible'},visual_style:style,hard_constraints:[],output:{medium:'image',aspect_ratio:'9:16'}}},
  {id:'caballito-comunidades',name:withDefault?'Caballito visitando comunidades':'Visita a comunidades',scene:{subject:subject(),environment:{location_name:'Una comunidad local de Guatemala',required_elements:['community street','civilian residents'],forbidden_elements:['industrial uniforms','safety vests'],civilian_only:true},action:{verb:'walking through the community and greeting residents'},visual_style:style,hard_constraints:[],output:{medium:'image',aspect_ratio:'9:16'}}},
  {id:'caballito-familias',name:withDefault?'Caballito con familias':'Escena con familias',scene:{subject:subject(),environment:{location_name:'A welcoming public community space',required_elements:['civilian families','safe public setting'],forbidden_elements:['industrial site','hard hats','safety vests'],civilian_only:true},action:{verb:'spending time naturally with families'},visual_style:style,hard_constraints:[],output:{medium:'image',aspect_ratio:'9:16'}}},
  {id:'caballito-pueblo',name:withDefault?'Caballito caminando por el pueblo':'Caminando por el pueblo',scene:{subject:subject(),environment:{location_name:'A traditional Guatemalan town street',required_elements:['local architecture','pedestrians'],forbidden_elements:['industrial equipment','cargo','safety uniforms'],civilian_only:true},action:{verb:'walking casually through town'},visual_style:style,hard_constraints:[],output:{medium:'image',aspect_ratio:'9:16'}}}
 ]
}

export function criticRubricForScene(job){
 const request=job.scene_request,character=job.prompt_compilation?.resolved_character_id
 const avatarPlan=avatarCriticPlan(job.prompt_compilation?.avatar_contract||request?.avatar_contract||null)
 const identity=avatarPlan?.identity_checks||(character?['Caballito identity preserved','White horse characteristics preserved','Red mane preserved','Face, eyes and muzzle remain consistent','FIRMES burgundy identity preserved']:[])
 const negative=[...new Set([...(request?.environment?.forbidden_elements||[]),...(request?.subject?.wardrobe?.forbidden||[]),...(request?.hard_constraints||[]).filter(c=>c.kind==='must_exclude').map(c=>c.value)])]
 return {
  schema_version:'scene-critic-rubric.v2',avatar_contract_sha256:avatarPlan?.avatar_contract_sha256||null,
  identity_checks:identity,
  brand_marker_checks:avatarPlan?.brand_marker_checks||[],
  wardrobe_checks:avatarPlan?.outfit_checks||(character?['Requested clothing is present']:[]),
  accessory_checks:avatarPlan?.accessory_checks||[],
  motion_checks:avatarPlan?.motion_checks||[],
  forbidden_drift_checks:avatarPlan?.forbidden_drift_checks||[],
  environment_checks:['Target environment is present',...(request?.environment?.required_elements||[]).map(v=>'Required element present: '+v),'Environment reference role is respected',...(avatarPlan?.scene_checks||[]),...(character?['Character-reference environment did not leak into the result']:[])],
  negative_checks:negative.map(v=>'Must be absent: '+v),
  composition_checks:['Requested action is visible','Character placement is coherent','Scene is believable','Lighting and shadows are coherent','Requested style is respected'],
  technical_checks:[...(request?.output?.medium==='video'?['Artifact decodes','Duration matches request','Dimensions/aspect ratio match request','Frame continuity is acceptable','Audio expectations are satisfied','Exact artifact hash is bound to review']:['Artifact decodes','Dimensions/aspect ratio match request','Exact artifact hash is bound to review']),...(avatarPlan?.exact_review_checks||[])]
 }
}

export function externalGenerationPackage(job){
 invariant(job.creation_mode==='GUIDED_SCENE'&&job.prompt_compilation,'EXTERNAL_GENERATION_UNAVAILABLE','Este trabajo no usa generación externa.',409)
 const refs=job.prompt_compilation.reference_roles.map(r=>({reference_id:r.reference_id,asset_id:r.asset_id,role:r.role,sha256:r.sha256,authorization:r.authorization,download_url:r.role==='CHARACTER_IDENTITY_ONLY'?`/api/v1/tenants/${encodeURIComponent(job.tenant_id)}/brand-assets/${encodeURIComponent(r.asset_id)}`:`/api/v1/tenants/${encodeURIComponent(job.tenant_id)}/scene-references/${encodeURIComponent(r.asset_id)}`}))
 const phase=job.generation_phase||(job.scene_request.output.medium==='video'?'HERO_IMAGE':'FINAL_MEDIA')
 if(phase==='VIDEO_FROM_APPROVED_HERO'&&job.hero_image?.artifact_id)refs.push({reference_id:'APPROVED_HERO',asset_id:job.hero_image.artifact_id,role:'APPROVED_HERO_IMAGE',sha256:job.hero_image.sha256,authorization:'APPROVED_INTERMEDIATE',download_url:'/api/v1/jobs/'+encodeURIComponent(job.id)+'/artifacts/'+encodeURIComponent(job.hero_image.artifact_id)})
 const expectedOutput=phase==='HERO_IMAGE'?{medium:'image',aspect_ratio:job.scene_request.output.aspect_ratio,purpose:'approved hero image before animation'}:job.scene_request.output
 return {
  package_version:'external-generation-package.v2',job_id:job.id,job_revision:job.job_revision||1,adapter_id:'manual-external',status:job.status,generation_phase:phase,
  prompt:job.prompt_compilation.final_prompt,prompt_sha256:job.prompt_compilation.final_prompt_sha256,base_prompt_sha256:job.prompt_compilation.base_compiled_prompt_sha256,
  references:refs,reference_role_explanation:{CHARACTER_IDENTITY_ONLY:'Usa esta imagen solo para conservar la identidad del personaje; no copies su entorno, vestuario prohibido ni utilería accidental.',ENVIRONMENT_ONLY:'Usa esta imagen solo para el lugar y su composición ambiental; no la uses para cambiar la identidad del personaje.',STYLE_ONLY:'Usa esta referencia únicamente para lenguaje visual.',APPROVED_HERO_IMAGE:'Anima exactamente esta imagen ya aprobada. No regeneres al personaje ni cambies la composición desde cero.'},
  avatar_contract:job.prompt_compilation.avatar_contract||null,
  avatar_contract_sha256:job.prompt_compilation.avatar_contract_sha256||null,
  avatar_critic_plan:avatarCriticPlan(job.prompt_compilation.avatar_contract||null),
  constraints:{hard:job.prompt_compilation.hard_constraints,character_preserve:job.scene_request.subject.preserve,character_source_exclusions:job.scene_request.subject.exclude_from_identity_source,environment_required:job.scene_request.environment.required_elements,environment_forbidden:job.scene_request.environment.forbidden_elements},
  expected_output:expectedOutput,
  checklist:['Respeta el rol de cada referencia','No copies el entorno de la referencia del personaje','Cumple todos los elementos obligatorios','No introduzcas ningún elemento prohibido',...(job.prompt_compilation.avatar_contract?['Conserva identidad, outfit, add-ons, movimiento y al menos un distintivo FIRMES visible según el avatar contract']:[]),...(phase==='VIDEO_FROM_APPROVED_HERO'?['Usa la imagen hero aprobada como entrada exacta del video; no regeneres la identidad']:[]),'Entrega exactamente el medio y formato solicitados'],
  generated_at:now()
 }
}

export function inspectImage(bytes,mime){
 invariant(Buffer.isBuffer(bytes)&&bytes.length>=24,'INVALID_MEDIA','La imagen está vacía o dañada.',415)
 if(mime==='image/png'){
  invariant(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.subarray(12,16).toString()==='IHDR','INVALID_MEDIA','El archivo no es un PNG válido.',415)
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);invariant(width>0&&height>0&&width<=16384&&height<=16384,'INVALID_MEDIA','Las dimensiones de la imagen no son válidas.',415);return {width,height}
 }
 if(mime==='image/jpeg'){
  invariant(bytes[0]===0xff&&bytes[1]===0xd8,'INVALID_MEDIA','El archivo no es un JPEG válido.',415)
  let i=2
  while(i+9<bytes.length){if(bytes[i]!==0xff){i++;continue}const marker=bytes[i+1];if(marker===0xd8||marker===0xd9){i+=2;continue}const len=bytes.readUInt16BE(i+2);if(len<2||i+2+len>bytes.length)break;if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){const height=bytes.readUInt16BE(i+5),width=bytes.readUInt16BE(i+7);invariant(width>0&&height>0,'INVALID_MEDIA','Las dimensiones del JPEG no son válidas.',415);return {width,height}}i+=2+len}
  invariant(false,'INVALID_MEDIA','No se pudieron leer las dimensiones del JPEG.',415)
 }
 invariant(false,'INVALID_MEDIA','Sube una imagen PNG o JPEG.',415)
}

export function assertAspectRatio(width,height,ratio){const expected=ratio==='9:16'?9/16:ratio==='16:9'?16/9:1;const actual=width/height;invariant(Math.abs(actual-expected)/expected<=0.04,'OUTPUT_MISMATCH',`El resultado no coincide con el formato ${ratio}.`,422)}
export function contentDigest(value){return hash(value)}

export function sceneReleaseProvenance(job){
 if(job?.creation_mode!=='GUIDED_SCENE'||!job.prompt_compilation)return null
 const attempt=(job.generation_attempts||[]).slice().reverse().find(value=>value.output_sha256===job.artifact_sha256)||null
 return {
  tenant_id:job.tenant_id,
  job_id:job.id,
  job_revision:job.job_revision||1,
  character_id:job.prompt_compilation.resolved_character_id||null,
  character_asset_id:job.prompt_compilation.resolved_character_asset_id||null,
  character_asset_sha256:job.prompt_compilation.resolved_character_asset_sha256||null,
  avatar_contract_sha256:job.prompt_compilation.avatar_contract_sha256||null,
  avatar_contract:job.prompt_compilation.avatar_contract?structuredClone(job.prompt_compilation.avatar_contract):null,
  reference_roles:structuredClone(job.prompt_compilation.reference_roles||[]),
  structured_request_sha256:job.prompt_compilation.structured_request_sha256,
  prompt_compiler_version:job.prompt_compilation.compiler_version,
  base_compiled_prompt_sha256:job.prompt_compilation.base_compiled_prompt_sha256,
  final_prompt_sha256:job.prompt_compilation.final_prompt_sha256,
  operator_override_sha256:job.prompt_compilation.operator_override?hash(job.prompt_compilation.operator_override):null,
  tenant_brand_profile_version:job.prompt_compilation.tenant_brand_profile_version,
  generation_attempt_id:attempt?.attempt_id||null,
  generation_adapter_id:attempt?.adapter_id||job.production_provider||null,
  provider_model:attempt?.provider_model||null,
  generation_request_sha256:attempt?.request_sha256||null,
  generation_prompt_sha256:attempt?.prompt_sha256||null,
  generation_input_assets:structuredClone(attempt?.input_assets||[]),
  approved_hero:job.hero_image?structuredClone({artifact_id:job.hero_image.artifact_id,sha256:job.hero_image.sha256,prompt_sha256:job.hero_image.prompt_sha256,approved_candidate_sha:job.hero_image.approved_candidate_sha,approved_by:job.hero_image.approved_by,approved_at:job.hero_image.approved_at}):null,
  result_sha256:job.artifact_sha256||null,
  critic_decision:(job.approvals||[]).filter(value=>value.stage==='CRITIC').at(-1)||null,
  verifier_decision:(job.approvals||[]).filter(value=>value.stage==='INDEPENDENT_VERIFIER').at(-1)||null
 }
}
