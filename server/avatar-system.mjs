import {createHash} from 'node:crypto'
import {invariant,safeId,fields} from './errors.mjs'

export const AVATAR_SYSTEM_VERSION='mascot-avatar-system.v1'
export const AVATAR_MCP_CONTRACT_VERSION='avatar-mcp-tools.v1'
export const FIRMES_AVATAR_IDENTITY_PACK_ID='avatar_identity_firmes_caballito_v1'
export const FIRMES_AVATAR_MOTION_PROFILE_ID='avatar_motion_firmes_caballito_v1'
export const FIRMES_AVATAR_DEFAULT_OUTFIT_ID='avatar_outfit_firmes_base_v1'

const CHARACTER_ID='brand_character_firmes_caballito_v1'
const ASSET_ID='brand_asset_firmes_caballito_v1'
const MARKER='firmes_mark_visible'
const HASH=/^[a-f0-9]{64}$/

function canonical(value){
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']'
  if(value&&typeof value==='object')return '{'+Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}'
  return JSON.stringify(value)
}
export function avatarHash(value){return createHash('sha256').update(canonical(value)).digest('hex')}
const copy=value=>structuredClone(value)

function firmesCatalog(){
  const identityPack={
    identity_pack_id:FIRMES_AVATAR_IDENTITY_PACK_ID,
    character_id:CHARACTER_ID,
    name:'Caballito FIRMES · Identity Pack',
    version:1,
    canonical_views:{
      primary:{asset_id:ASSET_ID,role:'CHARACTER_IDENTITY_ONLY'},
      front:null,left_profile:null,right_profile:null,three_quarter:null,back:null
    },
    completeness:{status:'PARTIAL',available_views:['primary'],missing_views:['front','left_profile','right_profile','three_quarter','back']},
    invariants:[
      'exact approved Caballito FIRMES identity',
      'white horse head and fur',
      'red mane',
      'recognizable face, eyes and muzzle',
      'approved mascot body proportions',
      'friendly, confident and approachable expression',
      'recognizable FIRMES brand identity'
    ],
    forbidden_drift:[
      'different animal species',
      'different mane color',
      'different facial anatomy',
      'unapproved body proportions',
      'brand-free costume when FIRMES marker is required',
      'identity changes caused by the environment reference'
    ],
    brand_marker_policy:{
      mode:'ALWAYS_VISIBLE',
      required_markers:[MARKER],
      preferred_locations:['chest','sleeve','waist accessory','helmet decal','suit patch'],
      minimum_visible_markers:1
    },
    material_style:'semi-3d-mascot',
    rig_profile:null,
    motion_profile_id:FIRMES_AVATAR_MOTION_PROFILE_ID
  }

  const outfits=[
    {
      outfit_id:FIRMES_AVATAR_DEFAULT_OUTFIT_ID,name:'FIRMES clásico',category:'base',version:1,
      description:'Polo borgoña FIRMES, pantalón beige y calzado casual.',
      items:['burgundy FIRMES polo','beige casual pants','casual shoes'],
      marker_locations:['chest','sleeve'],required_markers:[MARKER],tags:['base','community','brand']
    },
    {
      outfit_id:'avatar_outfit_firmes_construction_v1',name:'Construcción',category:'construction',version:1,
      description:'Equipo de visita a obra con identidad FIRMES visible.',
      items:['burgundy FIRMES polo','high-visibility safety vest','beige work pants','work boots'],
      marker_locations:['chest','sleeve','helmet decal'],required_markers:[MARKER],tags:['construction','worksite','safety']
    },
    {
      outfit_id:'avatar_outfit_firmes_beach_v1',name:'Playa',category:'beach',version:1,
      description:'Look fresco para playa sin perder la identidad FIRMES.',
      items:['lightweight burgundy FIRMES beach shirt','beige tailored shorts','beach footwear'],
      marker_locations:['chest','sleeve'],required_markers:[MARKER],tags:['beach','summer','casual']
    },
    {
      outfit_id:'avatar_outfit_firmes_formal_v1',name:'Formal',category:'formal',version:1,
      description:'Traje formal con distintivo FIRMES discreto y visible.',
      items:['tailored neutral suit','burgundy tie or pocket square','formal shoes','FIRMES lapel pin or chest badge'],
      marker_locations:['chest','lapel'],required_markers:[MARKER],tags:['formal','event','presentation']
    },
    {
      outfit_id:'avatar_outfit_firmes_space_v1',name:'Espacial',category:'space',version:1,
      description:'Traje espacial blanco con acentos borgoña e insignia FIRMES.',
      items:['white astronaut suit','burgundy suit accents','space boots','visible FIRMES mission patch'],
      marker_locations:['chest','sleeve','helmet decal'],required_markers:[MARKER],tags:['space','sci-fi','mission']
    }
  ]

  const accessories=[
    {accessory_id:'avatar_accessory_sunglasses_v1',name:'Lentes de sol',slot:'eyes',description:'Sunglasses fitted to the approved muzzle/head proportions.',tags:['beach','casual','summer']},
    {accessory_id:'avatar_accessory_flip_flops_v1',name:'Chanclas',slot:'feet',description:'Beach flip-flops adapted to the mascot feet.',tags:['beach','summer'],compatible_outfit_ids:['avatar_outfit_firmes_beach_v1']},
    {accessory_id:'avatar_accessory_hard_hat_v1',name:'Casco de seguridad',slot:'head',description:'Safety hard hat with optional FIRMES decal.',tags:['construction','safety'],compatible_outfit_ids:['avatar_outfit_firmes_construction_v1']},
    {accessory_id:'avatar_accessory_clipboard_v1',name:'Portapapeles',slot:'hands',description:'FIRMES clipboard held naturally.',tags:['construction','presentation','work']},
    {accessory_id:'avatar_accessory_microphone_v1',name:'Micrófono',slot:'hands',description:'Handheld microphone for presenting or reporting.',tags:['presentation','event']},
    {accessory_id:'avatar_accessory_backpack_v1',name:'Mochila',slot:'back',description:'Compact backpack proportioned to the mascot.',tags:['travel','community']},
    {accessory_id:'avatar_accessory_cap_v1',name:'Gorra',slot:'head',description:'Casual cap with burgundy FIRMES accent.',tags:['casual','community']},
    {accessory_id:'avatar_accessory_firmes_badge_v1',name:'Badge FIRMES',slot:'torso',description:'Visible FIRMES chest badge.',tags:['brand'],brand_marker:MARKER},
    {accessory_id:'avatar_accessory_firmes_sleeve_patch_v1',name:'Parche FIRMES',slot:'torso',description:'Visible FIRMES sleeve patch.',tags:['brand'],brand_marker:MARKER},
    {accessory_id:'avatar_accessory_space_helmet_v1',name:'Casco espacial',slot:'head',description:'Astronaut helmet with a visible FIRMES mission decal.',tags:['space'],compatible_outfit_ids:['avatar_outfit_firmes_space_v1'],brand_marker:MARKER}
  ]

  const motions=[
    {motion_preset_id:'avatar_motion_idle_v1',name:'Natural',verb:'standing naturally with subtle breathing and weight shift',duration_range_seconds:[2,12],intensity:'low',tags:['universal']},
    {motion_preset_id:'avatar_motion_walk_v1',name:'Caminar',verb:'walking naturally with consistent mascot gait and stable identity',duration_range_seconds:[3,12],intensity:'medium',tags:['universal']},
    {motion_preset_id:'avatar_motion_wave_v1',name:'Saludar',verb:'waving naturally toward camera while keeping body proportions stable',duration_range_seconds:[2,8],intensity:'medium',tags:['community','presentation']},
    {motion_preset_id:'avatar_motion_point_v1',name:'Señalar',verb:'pointing clearly toward the requested subject or direction',duration_range_seconds:[2,8],intensity:'medium',tags:['presentation']},
    {motion_preset_id:'avatar_motion_present_v1',name:'Presentar',verb:'presenting confidently to camera with controlled hand gestures',duration_range_seconds:[4,20],intensity:'medium',tags:['presentation','formal']},
    {motion_preset_id:'avatar_motion_nod_v1',name:'Asentir',verb:'subtle natural nod with minimal body movement',duration_range_seconds:[1,6],intensity:'low',tags:['universal']},
    {motion_preset_id:'avatar_motion_turn_v1',name:'Girar',verb:'turning naturally while preserving facial and body identity across the motion',duration_range_seconds:[2,8],intensity:'medium',tags:['universal']},
    {motion_preset_id:'avatar_motion_talk_camera_v1',name:'Hablar a cámara',verb:'speaking to camera with restrained expressive gestures and stable facial identity',duration_range_seconds:[4,30],intensity:'medium',tags:['presentation','community']}
  ]

  const scenePacks=[
    {
      scene_pack_id:'avatar_scene_beach_v1',name:'Playa',category:'beach',
      environment:{location_name:'A bright tropical beach',required_elements:['clean shoreline','natural ocean','warm daylight'],forbidden_elements:['industrial port','shipping containers','warehouse'],civilian_only:true},
      suggested_outfit_id:'avatar_outfit_firmes_beach_v1',
      suggested_accessory_ids:['avatar_accessory_sunglasses_v1','avatar_accessory_flip_flops_v1'],
      suggested_motion_preset_id:'avatar_motion_walk_v1'
    },
    {
      scene_pack_id:'avatar_scene_space_v1',name:'Espacio',category:'space',
      environment:{location_name:'A cinematic orbital space environment',required_elements:['spacecraft or orbital setting','planet or stars visible','physically coherent lighting'],forbidden_elements:['industrial port','construction site'],civilian_only:false},
      suggested_outfit_id:'avatar_outfit_firmes_space_v1',
      suggested_accessory_ids:['avatar_accessory_space_helmet_v1'],
      suggested_motion_preset_id:'avatar_motion_present_v1'
    },
    {
      scene_pack_id:'avatar_scene_antigua_v1',name:'Antigua',category:'heritage',
      environment:{location_name:'Calle del Arco, Antigua Guatemala, Guatemala',required_elements:['Santa Catalina Arch','colonial buildings','cobblestone street','civilian pedestrians and tourists'],forbidden_elements:['industrial port','shipping containers','warehouse','cranes','forklifts'],civilian_only:true},
      suggested_outfit_id:FIRMES_AVATAR_DEFAULT_OUTFIT_ID,
      suggested_accessory_ids:[],
      suggested_motion_preset_id:'avatar_motion_walk_v1'
    },
    {
      scene_pack_id:'avatar_scene_office_v1',name:'Oficina',category:'office',
      environment:{location_name:'A modern warm professional office',required_elements:['clean workspace','professional but approachable atmosphere'],forbidden_elements:['industrial port','construction machinery'],civilian_only:true},
      suggested_outfit_id:'avatar_outfit_firmes_formal_v1',
      suggested_accessory_ids:[],
      suggested_motion_preset_id:'avatar_motion_present_v1'
    },
    {
      scene_pack_id:'avatar_scene_community_v1',name:'Comunidad',category:'community',
      environment:{location_name:'A welcoming Guatemalan community public space',required_elements:['civilian residents','safe public setting','local visual context'],forbidden_elements:['industrial uniforms','cargo yard'],civilian_only:true},
      suggested_outfit_id:FIRMES_AVATAR_DEFAULT_OUTFIT_ID,
      suggested_accessory_ids:[],
      suggested_motion_preset_id:'avatar_motion_wave_v1'
    }
  ]

  return {identityPack,outfits,accessories,motions,scenePacks}
}

export function seedAvatarSystem(state,tenantId,brand){
  safeId(tenantId,'Workspace ID')
  state.avatar_identity_packs??={}
  state.avatar_identity_packs[tenantId]??={}
  state.avatar_outfits??={}
  state.avatar_outfits[tenantId]??={}
  state.avatar_accessories??={}
  state.avatar_accessories[tenantId]??={}
  state.avatar_motion_presets??={}
  state.avatar_motion_presets[tenantId]??={}
  state.avatar_scene_packs??={}
  state.avatar_scene_packs[tenantId]??={}

  if(brand?.profile?.identity_key==='firmes'&&brand.characters?.[CHARACTER_ID]){
    const catalog=firmesCatalog()
    state.avatar_identity_packs[tenantId][catalog.identityPack.identity_pack_id]??=copy(catalog.identityPack)
    for(const value of catalog.outfits)state.avatar_outfits[tenantId][value.outfit_id]??=copy(value)
    for(const value of catalog.accessories)state.avatar_accessories[tenantId][value.accessory_id]??=copy(value)
    for(const value of catalog.motions)state.avatar_motion_presets[tenantId][value.motion_preset_id]??=copy(value)
    for(const value of catalog.scenePacks)state.avatar_scene_packs[tenantId][value.scene_pack_id]??=copy(value)
    const character=brand.characters[CHARACTER_ID]
    character.avatar_identity_pack_id??=catalog.identityPack.identity_pack_id
    character.motion_profile_id??=FIRMES_AVATAR_MOTION_PROFILE_ID
    character.default_outfit_id??=FIRMES_AVATAR_DEFAULT_OUTFIT_ID
    character.required_brand_markers??=[MARKER]
    brand.profile.default_avatar_identity_pack_id??=catalog.identityPack.identity_pack_id
    brand.profile.default_avatar_outfit_id??=FIRMES_AVATAR_DEFAULT_OUTFIT_ID
    brand.profile.required_brand_markers??=[MARKER]
    brand.profile.avatar_system_version=AVATAR_SYSTEM_VERSION
  }
  return avatarCatalog(state,tenantId,brand)
}

export function avatarCatalog(state,tenantId,brand){
  safeId(tenantId,'Workspace ID')
  const identityPacks=Object.values(state.avatar_identity_packs?.[tenantId]||{}).map(copy)
  const outfits=Object.values(state.avatar_outfits?.[tenantId]||{}).map(copy)
  const accessories=Object.values(state.avatar_accessories?.[tenantId]||{}).map(copy)
  const motions=Object.values(state.avatar_motion_presets?.[tenantId]||{}).map(copy)
  const scenePacks=Object.values(state.avatar_scene_packs?.[tenantId]||{}).map(copy)
  return {
    system_version:AVATAR_SYSTEM_VERSION,
    tenant_id:tenantId,
    enabled:identityPacks.length>0,
    default_character_id:brand?.profile?.default_mascot_character_id||null,
    default_identity_pack_id:brand?.profile?.default_avatar_identity_pack_id||null,
    default_outfit_id:brand?.profile?.default_avatar_outfit_id||null,
    required_brand_markers:copy(brand?.profile?.required_brand_markers||[]),
    identity_packs:identityPacks,
    outfits,accessories,
    motion_profile:{motion_profile_id:FIRMES_AVATAR_MOTION_PROFILE_ID,presets:motions,rig_profile:null,mode:'GENERATIVE_MOTION'},
    scene_packs:scenePacks
  }
}

function lookup(list,key,value,code,label){
  const found=list.find(item=>item[key]===value)
  invariant(found,code,label+' no pertenece a este espacio o no existe.',403)
  return found
}

export function normalizeAvatarSelection(input,catalog,characterId){
  if(!characterId){
    invariant(input===undefined||input===null,'AVATAR_WITHOUT_CHARACTER','Elige un personaje antes de configurar el avatar.',409)
    return null
  }
  const value=input===undefined||input===null?{}:input
  fields(value,['identity_pack_id','outfit_id','accessory_ids','motion_preset_id','scene_pack_id','brand_marker_policy'])
  invariant(catalog?.enabled===true,'AVATAR_UNAVAILABLE','Este personaje no tiene un avatar reutilizable configurado.',409)
  const identityPackId=value.identity_pack_id||catalog.default_identity_pack_id
  safeId(identityPackId,'Avatar identity pack ID')
  const pack=lookup(catalog.identity_packs,'identity_pack_id',identityPackId,'AVATAR_IDENTITY_FORBIDDEN','El Identity Pack')
  invariant(pack.character_id===characterId,'AVATAR_IDENTITY_MISMATCH','El Identity Pack no corresponde al personaje seleccionado.',409)
  const outfitId=value.outfit_id||catalog.default_outfit_id
  safeId(outfitId,'Avatar outfit ID')
  const outfit=lookup(catalog.outfits,'outfit_id',outfitId,'AVATAR_OUTFIT_FORBIDDEN','El outfit')
  const accessoryIds=value.accessory_ids===undefined?[]:value.accessory_ids
  invariant(Array.isArray(accessoryIds)&&accessoryIds.length<=12&&new Set(accessoryIds).size===accessoryIds.length,'INVALID_AVATAR','Elige accesorios válidos sin duplicados.')
  const accessories=accessoryIds.map(id=>{
    safeId(id,'Avatar accessory ID')
    const accessory=lookup(catalog.accessories,'accessory_id',id,'AVATAR_ACCESSORY_FORBIDDEN','El accesorio')
    if(accessory.compatible_outfit_ids)invariant(accessory.compatible_outfit_ids.includes(outfitId),'AVATAR_ACCESSORY_CONFLICT',accessory.name+' no es compatible con '+outfit.name+'.',409)
    return accessory
  })
  const occupied=new Map()
  for(const accessory of accessories){
    if(!['head','hands'].includes(accessory.slot))continue
    const prior=occupied.get(accessory.slot)
    invariant(!prior,'AVATAR_ACCESSORY_CONFLICT',prior+' y '+accessory.name+' usan el mismo espacio del avatar.',409)
    occupied.set(accessory.slot,accessory.name)
  }
  const motionId=value.motion_preset_id||'avatar_motion_idle_v1'
  safeId(motionId,'Avatar motion ID')
  const motion=lookup(catalog.motion_profile.presets,'motion_preset_id',motionId,'AVATAR_MOTION_FORBIDDEN','El movimiento')
  let scenePack=null
  if(value.scene_pack_id){
    safeId(value.scene_pack_id,'Avatar scene pack ID')
    scenePack=lookup(catalog.scene_packs,'scene_pack_id',value.scene_pack_id,'AVATAR_SCENE_FORBIDDEN','La escena')
  }
  invariant(value.brand_marker_policy===undefined||value.brand_marker_policy==='ALWAYS_VISIBLE','INVALID_AVATAR','La marca FIRMES debe permanecer visible.')
  const requiredMarkers=[...new Set([...(catalog.required_brand_markers||[]),...(pack.brand_marker_policy?.required_markers||[]),...(outfit.required_markers||[])])]
  invariant(requiredMarkers.includes(MARKER),'AVATAR_BRAND_MARKER_REQUIRED','El avatar debe conservar un distintivo FIRMES visible.',409)
  const authority={identity_pack:pack,outfit,accessories,motion,scene_pack:scenePack}
  const contract={
    system_version:catalog.system_version,
    avatar_authority_sha256:avatarHash(authority),
    character_id:characterId,
    identity_pack_id:identityPackId,
    identity_pack_version:pack.version,
    identity_pack_completeness:copy(pack.completeness),
    identity_invariants:copy(pack.invariants),
    forbidden_drift:copy(pack.forbidden_drift),
    outfit_id:outfitId,
    outfit_name:outfit.name,
    outfit_items:copy(outfit.items),
    accessory_ids:accessories.map(a=>a.accessory_id),
    accessories:accessories.map(a=>({accessory_id:a.accessory_id,name:a.name,slot:a.slot,description:a.description,brand_marker:a.brand_marker||null})),
    motion_preset_id:motionId,
    motion:{name:motion.name,verb:motion.verb,duration_range_seconds:copy(motion.duration_range_seconds),intensity:motion.intensity},
    scene_pack_id:scenePack?.scene_pack_id||null,
    scene_pack:scenePack?copy(scenePack):null,
    brand_marker_policy:{mode:'ALWAYS_VISIBLE',required_markers:requiredMarkers,preferred_locations:copy(pack.brand_marker_policy.preferred_locations),minimum_visible_markers:1}
  }
  return {...contract,contract_sha256:avatarHash(contract)}
}

export function avatarPromptSections(contract){
  if(!contract)return []
  const sections=[]
  sections.push({
    title:'AVATAR IDENTITY LOCK',
    lines:[
      'Treat the approved identity reference as the canonical character identity.',
      ...contract.identity_invariants.map(v=>'- preserve: '+v),
      ...contract.forbidden_drift.map(v=>'- forbidden drift: '+v)
    ]
  })
  sections.push({
    title:'AVATAR OUTFIT',
    lines:['- '+contract.outfit_name,...contract.outfit_items.map(v=>'- '+v)]
  })
  if(contract.accessories.length)sections.push({
    title:'AVATAR ADD-ONS',
    lines:contract.accessories.map(v=>'- '+v.name+' ['+v.slot+']: '+v.description)
  })
  sections.push({
    title:'FIRMES BRAND MARKER POLICY',
    lines:[
      '- at least one clear FIRMES identifier must remain visible in every render',
      '- preferred locations: '+contract.brand_marker_policy.preferred_locations.join(', '),
      '- never remove all FIRMES identifiers when changing outfit, scene or accessories'
    ]
  })
  sections.push({
    title:'AVATAR MOTION PROFILE',
    lines:[
      '- '+contract.motion.name+': '+contract.motion.verb,
      '- intensity: '+contract.motion.intensity,
      '- preserve face, mane, body proportions, outfit and brand marker across every frame'
    ]
  })
  return sections
}

export function avatarCriticPlan(contract){
  if(!contract)return null
  return {
    schema_version:'avatar-critic-plan.v1',
    avatar_contract_sha256:contract.contract_sha256,
    identity_checks:contract.identity_invariants.map(v=>'Identity preserved: '+v),
    forbidden_drift_checks:contract.forbidden_drift.map(v=>'Must not drift: '+v),
    brand_marker_checks:[
      'At least one FIRMES identifier is clearly visible',
      'FIRMES identifier remains attached to the selected outfit/accessory, not floating or duplicated',
      'Brand marker remains readable enough to recognize the brand'
    ],
    outfit_checks:['Selected outfit is present: '+contract.outfit_name,...contract.outfit_items.map(v=>'Outfit item present: '+v)],
    accessory_checks:contract.accessories.map(v=>'Requested add-on present in '+v.slot+': '+v.name),
    motion_checks:[
      'Requested motion is visible: '+contract.motion.name,
      'Identity remains stable throughout the requested movement',
      'Accessories and brand marker remain spatially coherent during motion'
    ],
    scene_checks:contract.scene_pack?['Scene pack respected: '+contract.scene_pack.name]:[],
    exact_review_checks:['Candidate artifact hash is exact','Review refers to the same avatar contract hash']
  }
}

export function avatarMcpCatalogDefinition(){
  return {
    contract_version:AVATAR_MCP_CONTRACT_VERSION,
    tools:[
      {name:'avatar.catalog',description:'List tenant-scoped reusable avatar identity, outfits, accessories, motion presets and scene packs.',input_schema:{type:'object',properties:{},additionalProperties:false}},
      {name:'avatar.compile',description:'Compile a deterministic avatar selection contract with identity lock and brand-marker rules.',input_schema:{type:'object',properties:{character_id:{type:'string'},avatar:{type:'object'}},required:['character_id','avatar'],additionalProperties:false}},
      {name:'avatar.critic_plan',description:'Return the deterministic critic checklist for an already compiled avatar contract.',input_schema:{type:'object',properties:{avatar_contract:{type:'object'}},required:['avatar_contract'],additionalProperties:false}}
    ]
  }
}

export function executeAvatarMcpTool(name,input,{state,tenantId,brand}){
  const catalog=seedAvatarSystem(state,tenantId,brand)
  if(name==='avatar.catalog')return catalog
  if(name==='avatar.compile'){
    fields(input,['character_id','avatar'])
    safeId(input.character_id,'Character ID')
    return normalizeAvatarSelection(input.avatar,catalog,input.character_id)
  }
  if(name==='avatar.critic_plan'){
    fields(input,['avatar_contract'])
    const contract=input.avatar_contract
    invariant(contract&&contract.contract_sha256&&HASH.test(contract.contract_sha256),'INVALID_AVATAR_CONTRACT','El contrato de avatar no es válido.')
    invariant(avatarHash(Object.fromEntries(Object.entries(contract).filter(([k])=>k!=='contract_sha256')))===contract.contract_sha256,'AVATAR_CONTRACT_CHANGED','El contrato de avatar cambió.',409)
    return avatarCriticPlan(contract)
  }
  invariant(false,'MCP_TOOL_NOT_FOUND','La herramienta de avatar no existe.',404)
}

export function assertAvatarContractCurrent(state,tenantId,contract){
  if(!contract)return true
  invariant(contract.tenant_id===undefined||contract.tenant_id===tenantId,'AVATAR_CONTRACT_CHANGED','El contrato de avatar pertenece a otro espacio.',409)
  const clean=Object.fromEntries(Object.entries(contract).filter(([key])=>key!=='contract_sha256'))
  invariant(avatarHash(clean)===contract.contract_sha256,'AVATAR_CONTRACT_CHANGED','El contrato de avatar cambió después de compilar la escena.',409)
  const pack=state.avatar_identity_packs?.[tenantId]?.[contract.identity_pack_id]
  const outfit=state.avatar_outfits?.[tenantId]?.[contract.outfit_id]
  const accessories=(contract.accessory_ids||[]).map(id=>state.avatar_accessories?.[tenantId]?.[id])
  const motion=state.avatar_motion_presets?.[tenantId]?.[contract.motion_preset_id]
  const scenePack=contract.scene_pack_id?state.avatar_scene_packs?.[tenantId]?.[contract.scene_pack_id]:null
  invariant(pack&&outfit&&motion&&accessories.every(Boolean)&&(!contract.scene_pack_id||scenePack),'AVATAR_AUTHORITY_CHANGED','La configuración autorizada del avatar ya no está disponible.',409)
  const authority={identity_pack:pack,outfit,accessories,motion,scene_pack:scenePack}
  invariant(avatarHash(authority)===contract.avatar_authority_sha256,'AVATAR_AUTHORITY_CHANGED','La configuración autorizada del avatar cambió; recompila la escena.',409)
  return true
}
