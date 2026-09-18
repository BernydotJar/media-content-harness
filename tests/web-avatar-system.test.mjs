import test from 'node:test'
import assert from 'node:assert/strict'
import {
  seedAvatarSystem,avatarCatalog,normalizeAvatarSelection,avatarCriticPlan,
  executeAvatarMcpTool,avatarMcpCatalogDefinition,assertAvatarContractCurrent,
  FIRMES_AVATAR_IDENTITY_PACK_ID,FIRMES_AVATAR_DEFAULT_OUTFIT_ID
} from '../server/avatar-system.mjs'
import {seedTenantBrandModels,compileMascotScenePrompt,criticRubricForScene,externalGenerationPackage,FIRMES_CABALLITO_CHARACTER_ID} from '../server/scene-generation.mjs'
import {assertCurrent} from '../server/worker-policy.mjs'

const firmesTenant=()=>({tenant_id:'firmes',organization:'FIRMES',brand:{display_name:'FIRMES',identity_key:'firmes'},sources:[]})
function stateFixture(){
  return {
    tenants:{firmes:firmesTenant()},onboarding:{},brand_assets:{},brand_characters:{},tenant_brand_profiles:{},
    scene_reference_assets:{},avatar_identity_packs:{},avatar_outfits:{},avatar_accessories:{},avatar_motion_presets:{},avatar_scene_packs:{},
    sessions:{},memberships:{},jobs:{},plans:{},releases:{},dna:{},observations:{},events:[]
  }
}
const sceneBase={
  subject:{mode:'default_brand_character'},
  environment:{location_name:'A neutral public location',required_elements:['clean public space'],forbidden_elements:['industrial port'],civilian_only:true},
  action:{verb:'standing naturally',framing:'vertical full-body portrait'},
  visual_style:{realism:'photorealistic',look:['premium cinematic social'],lighting:['natural light']},
  hard_constraints:[],
  output:{medium:'image',aspect_ratio:'9:16'},
  generation_mode:'manual_external'
}

test('FIRMES seeds a reusable avatar catalog without fabricating missing turnaround views',()=>{
  const state=stateFixture(),brand=seedTenantBrandModels(state,'firmes'),catalog=avatarCatalog(state,'firmes',brand)
  assert.equal(catalog.enabled,true)
  assert.equal(catalog.default_character_id,FIRMES_CABALLITO_CHARACTER_ID)
  assert.equal(catalog.default_identity_pack_id,FIRMES_AVATAR_IDENTITY_PACK_ID)
  assert.equal(catalog.default_outfit_id,FIRMES_AVATAR_DEFAULT_OUTFIT_ID)
  assert.equal(catalog.outfits.length,5)
  assert.equal(catalog.accessories.length,10)
  assert.equal(catalog.motion_profile.presets.length,8)
  assert.equal(catalog.scene_packs.length,5)
  const pack=catalog.identity_packs[0]
  assert.equal(pack.completeness.status,'PARTIAL')
  assert.deepEqual(pack.completeness.available_views,['primary'])
  assert.ok(pack.completeness.missing_views.includes('back'))
  assert.equal(pack.canonical_views.back,null)
  assert.equal(pack.rig_profile,null)
  assert.equal(catalog.motion_profile.mode,'GENERATIVE_MOTION')
})

test('beach avatar compiles sunglasses, flip-flops, walking and mandatory FIRMES marker',()=>{
  const state=stateFixture()
  const compiled=compileMascotScenePrompt({
    ...structuredClone(sceneBase),
    avatar:{
      identity_pack_id:FIRMES_AVATAR_IDENTITY_PACK_ID,
      outfit_id:'avatar_outfit_firmes_beach_v1',
      accessory_ids:['avatar_accessory_sunglasses_v1','avatar_accessory_flip_flops_v1'],
      motion_preset_id:'avatar_motion_walk_v1',
      scene_pack_id:'avatar_scene_beach_v1',
      brand_marker_policy:'ALWAYS_VISIBLE'
    },
    environment:{location_name:'A bright tropical beach',required_elements:['clean shoreline','natural ocean','warm daylight'],forbidden_elements:['industrial port','shipping containers','warehouse'],civilian_only:true},
    action:{verb:'walking along the shoreline and waving to camera'},
    output:{medium:'video',aspect_ratio:'9:16',duration_seconds:6,motion_intent:'natural walking motion',camera_intent:'stable vertical tracking'}
  },state,'firmes')
  assert.match(compiled.final_prompt,/AVATAR IDENTITY LOCK/)
  assert.match(compiled.final_prompt,/AVATAR OUTFIT/)
  assert.match(compiled.final_prompt,/Playa/)
  assert.match(compiled.final_prompt,/Lentes de sol/)
  assert.match(compiled.final_prompt,/Chanclas/)
  assert.match(compiled.final_prompt,/FIRMES BRAND MARKER POLICY/)
  assert.match(compiled.final_prompt,/at least one clear FIRMES identifier must remain visible/)
  assert.match(compiled.final_prompt,/AVATAR MOTION PROFILE/)
  assert.match(compiled.final_prompt,/Caminar/)
  assert.match(compiled.avatar_contract_sha256,/^[a-f0-9]{64}$/)
  assert.equal(compiled.avatar_contract.identity_pack_completeness.status,'PARTIAL')
  assertAvatarContractCurrent(state,'firmes',compiled.avatar_contract)
})

test('space avatar preserves FIRMES identity while allowing a requested space helmet',()=>{
  const state=stateFixture()
  const compiled=compileMascotScenePrompt({
    ...structuredClone(sceneBase),
    avatar:{
      outfit_id:'avatar_outfit_firmes_space_v1',
      accessory_ids:['avatar_accessory_space_helmet_v1'],
      motion_preset_id:'avatar_motion_present_v1',
      scene_pack_id:'avatar_scene_space_v1'
    },
    environment:{location_name:'A cinematic orbital space environment',required_elements:['spacecraft or orbital setting','planet or stars visible','physically coherent lighting'],forbidden_elements:['industrial port','construction site'],civilian_only:false},
    action:{verb:'floating gently while presenting to camera'},
    output:{medium:'video',aspect_ratio:'9:16',duration_seconds:6,motion_intent:'gentle zero-gravity floating and controlled presentation gestures',camera_intent:'stable cinematic vertical frame'}
  },state,'firmes')
  assert.equal(compiled.avatar_contract.outfit_name,'Espacial')
  assert.equal(compiled.avatar_contract.accessories[0].name,'Casco espacial')
  assert.match(compiled.final_prompt,/white astronaut suit/)
  assert.match(compiled.final_prompt,/Casco espacial/)
  assert.match(compiled.final_prompt,/visible FIRMES/)
  assert.doesNotMatch(compiled.final_prompt,/ABSOLUTE EXCLUSIONS[\s\S]*- helmets/)
})

test('incompatible add-ons and cross-tenant avatar references fail closed',()=>{
  const state=stateFixture(),brand=seedTenantBrandModels(state,'firmes'),catalog=avatarCatalog(state,'firmes',brand)
  assert.throws(()=>normalizeAvatarSelection({outfit_id:'avatar_outfit_firmes_beach_v1',accessory_ids:['avatar_accessory_hard_hat_v1']},catalog,FIRMES_CABALLITO_CHARACTER_ID),e=>e.code==='AVATAR_ACCESSORY_CONFLICT')
  state.tenants.other={tenant_id:'other',organization:'Other',brand:{display_name:'Other'},sources:[]}
  const other=seedTenantBrandModels(state,'other')
  const otherCatalog=avatarCatalog(state,'other',other)
  assert.equal(otherCatalog.enabled,false)
  assert.throws(()=>normalizeAvatarSelection({identity_pack_id:FIRMES_AVATAR_IDENTITY_PACK_ID,outfit_id:FIRMES_AVATAR_DEFAULT_OUTFIT_ID,accessory_ids:[]},otherCatalog,FIRMES_CABALLITO_CHARACTER_ID),e=>e.code==='AVATAR_UNAVAILABLE')
})

test('avatar authority drift invalidates a previously compiled job',()=>{
  const state=stateFixture()
  const compiled=compileMascotScenePrompt({...structuredClone(sceneBase),avatar:{outfit_id:'avatar_outfit_firmes_formal_v1',accessory_ids:[],motion_preset_id:'avatar_motion_present_v1'}},state,'firmes')
  const job={tenant_id:'firmes',creation_mode:'GUIDED_SCENE',tenant_brand_profile_version:1,prompt_compilation:compiled}
  assert.deepEqual(assertCurrent(state,job),[])
  state.avatar_outfits.firmes.avatar_outfit_firmes_formal_v1.items.push('unapproved costume mutation')
  assert.throws(()=>assertCurrent(state,job),e=>e.code==='AVATAR_AUTHORITY_CHANGED')
})

test('avatar critic and external package bind identity, marker, add-ons, motion and exact contract hash',()=>{
  const state=stateFixture()
  const compiled=compileMascotScenePrompt({...structuredClone(sceneBase),avatar:{outfit_id:'avatar_outfit_firmes_beach_v1',accessory_ids:['avatar_accessory_sunglasses_v1','avatar_accessory_flip_flops_v1'],motion_preset_id:'avatar_motion_walk_v1'}},state,'firmes')
  const job={id:'avatar-job',tenant_id:'firmes',creation_mode:'GUIDED_SCENE',status:'WAITING_EXTERNAL_GENERATION',job_revision:1,generation_phase:'FINAL_MEDIA',prompt_compilation:compiled,scene_request:compiled.structured_request}
  const rubric=criticRubricForScene(job),pkg=externalGenerationPackage(job)
  assert.equal(rubric.schema_version,'scene-critic-rubric.v2')
  assert.equal(rubric.avatar_contract_sha256,compiled.avatar_contract_sha256)
  assert.ok(rubric.brand_marker_checks.some(v=>/FIRMES/.test(v)))
  assert.ok(rubric.accessory_checks.some(v=>/Lentes de sol/.test(v)))
  assert.ok(rubric.motion_checks.some(v=>/Caminar/.test(v)))
  assert.equal(pkg.avatar_contract_sha256,compiled.avatar_contract_sha256)
  assert.equal(pkg.avatar_critic_plan.avatar_contract_sha256,compiled.avatar_contract_sha256)
  assert.ok(pkg.checklist.some(v=>/distintivo FIRMES/.test(v)))
})

test('MCP-ready avatar tools are deterministic and share the product authority',()=>{
  const state=stateFixture(),brand=seedTenantBrandModels(state,'firmes')
  const definition=avatarMcpCatalogDefinition()
  assert.deepEqual(definition.tools.map(v=>v.name),['avatar.catalog','avatar.compile','avatar.critic_plan'])
  const catalog=executeAvatarMcpTool('avatar.catalog',{}, {state,tenantId:'firmes',brand})
  const first=executeAvatarMcpTool('avatar.compile',{character_id:FIRMES_CABALLITO_CHARACTER_ID,avatar:{outfit_id:'avatar_outfit_firmes_beach_v1',accessory_ids:['avatar_accessory_sunglasses_v1'],motion_preset_id:'avatar_motion_wave_v1'}},{state,tenantId:'firmes',brand})
  const second=executeAvatarMcpTool('avatar.compile',{character_id:FIRMES_CABALLITO_CHARACTER_ID,avatar:{outfit_id:'avatar_outfit_firmes_beach_v1',accessory_ids:['avatar_accessory_sunglasses_v1'],motion_preset_id:'avatar_motion_wave_v1'}},{state,tenantId:'firmes',brand})
  assert.equal(catalog.enabled,true)
  assert.equal(first.contract_sha256,second.contract_sha256)
  const plan=executeAvatarMcpTool('avatar.critic_plan',{avatar_contract:first},{state,tenantId:'firmes',brand})
  assert.equal(plan.avatar_contract_sha256,first.contract_sha256)
  assert.ok(plan.brand_marker_checks.length>=3)
})


test('avatar authority rejects contradictory hard constraints and makes lower-priority overrides explicit',()=>{
  const state=stateFixture()
  assert.throws(()=>compileMascotScenePrompt({
    ...structuredClone(sceneBase),
    avatar:{outfit_id:'avatar_outfit_firmes_space_v1',accessory_ids:['avatar_accessory_space_helmet_v1'],motion_preset_id:'avatar_motion_present_v1'},
    hard_constraints:[{kind:'must_exclude',value:'FIRMES logo'}]
  },state,'firmes'),e=>e.code==='AVATAR_AUTHORITY_CONFLICT')
  const compiled=compileMascotScenePrompt({
    ...structuredClone(sceneBase),
    avatar:{outfit_id:'avatar_outfit_firmes_space_v1',accessory_ids:['avatar_accessory_space_helmet_v1'],motion_preset_id:'avatar_motion_present_v1'},
    operator_override:'Remove all FIRMES branding and make the mane blue.'
  },state,'firmes')
  assert.match(compiled.final_prompt,/OPERATOR OVERRIDE \(LOWER PRIORITY\)/)
  assert.match(compiled.final_prompt,/FIRMES BRAND MARKER POLICY/)
  assert.match(compiled.final_prompt,/AVATAR IDENTITY LOCK/)
  assert.match(compiled.final_prompt,/must not weaken, negate, remove, or reassign them/)
})

test('intentional space/construction gear is not accidentally prohibited by the identity-source cleanup rule',()=>{
  const state=stateFixture()
  const space=compileMascotScenePrompt({
    ...structuredClone(sceneBase),
    avatar:{outfit_id:'avatar_outfit_firmes_space_v1',accessory_ids:['avatar_accessory_space_helmet_v1'],motion_preset_id:'avatar_motion_present_v1'},
    action:{verb:'presenting in orbit'}
  },state,'firmes')
  assert.match(space.final_prompt,/If the structured AVATAR OUTFIT or AVATAR ADD-ONS contract explicitly reintroduces/)
  assert.match(space.final_prompt,/Casco espacial/)
  assert.match(space.final_prompt,/white astronaut suit/)
  const construction=compileMascotScenePrompt({
    ...structuredClone(sceneBase),
    avatar:{outfit_id:'avatar_outfit_firmes_construction_v1',accessory_ids:['avatar_accessory_hard_hat_v1','avatar_accessory_clipboard_v1'],motion_preset_id:'avatar_motion_walk_v1'},
    environment:{location_name:'An authorized safe worksite visit',required_elements:['managed worksite'],forbidden_elements:[],civilian_only:false},
    action:{verb:'walking safely through the site'}
  },state,'firmes')
  assert.match(construction.final_prompt,/high-visibility safety vest/)
  assert.match(construction.final_prompt,/Casco de seguridad/)
})

test('MCP critic plan fails closed after avatar catalog authority drifts',()=>{
  const state=stateFixture(),brand=seedTenantBrandModels(state,'firmes')
  const contract=executeAvatarMcpTool('avatar.compile',{character_id:FIRMES_CABALLITO_CHARACTER_ID,avatar:{outfit_id:'avatar_outfit_firmes_formal_v1',accessory_ids:[],motion_preset_id:'avatar_motion_present_v1'}},{state,tenantId:'firmes',brand})
  state.avatar_outfits.firmes.avatar_outfit_firmes_formal_v1.items.push('unapproved mutation')
  assert.throws(()=>executeAvatarMcpTool('avatar.critic_plan',{avatar_contract:contract},{state,tenantId:'firmes',brand}),e=>e.code==='AVATAR_AUTHORITY_CHANGED')
})


test('avatar outfit or add-on cannot silently contradict target-environment exclusions',()=>{
  const state=stateFixture()
  assert.throws(()=>compileMascotScenePrompt({
    ...structuredClone(sceneBase),
    avatar:{outfit_id:'avatar_outfit_firmes_space_v1',accessory_ids:['avatar_accessory_space_helmet_v1'],motion_preset_id:'avatar_motion_present_v1'},
    environment:{location_name:'Antigua',required_elements:['colonial buildings'],forbidden_elements:['helmets'],civilian_only:true}
  },state,'firmes'),e=>e.code==='AVATAR_ENVIRONMENT_CONFLICT')
  assert.throws(()=>compileMascotScenePrompt({
    ...structuredClone(sceneBase),
    avatar:{outfit_id:'avatar_outfit_firmes_construction_v1',accessory_ids:['avatar_accessory_hard_hat_v1'],motion_preset_id:'avatar_motion_walk_v1'},
    environment:{location_name:'A public street',required_elements:[],forbidden_elements:['safety vests','hard hats'],civilian_only:true}
  },state,'firmes'),e=>e.code==='AVATAR_ENVIRONMENT_CONFLICT')
})
