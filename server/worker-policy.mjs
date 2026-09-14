import { createHash } from 'node:crypto'
import { invariant } from './errors.mjs'
export const GRAPH_REVISION = '477bdcc3d390c30eb49d823e5c7fd105fee2cc4d'
export const STAGES = ['BRIEF','SOURCE','INGEST','DIRECTOR_TREATMENT','CONCEPT_REVIEW','CREATIVE_GATE','PROVIDER_PRODUCTION','TECHNICAL_QA','CRITIC','FIXER','INDEPENDENT_VERIFIER','COMPLIANCE','RELEASE']
export const HUMAN_STAGES = ['CONCEPT_REVIEW','CREATIVE_GATE','CRITIC','INDEPENDENT_VERIFIER','RELEASE']
export const digest = value => createHash('sha256').update(Buffer.isBuffer(value) ? value : typeof value === 'string' ? value : canonical(value)).digest('hex')
function canonical(value) { if (Array.isArray(value)) return '[' + value.map(v=>v===undefined?'null':canonical(v)).join(',') + ']'; if (value && typeof value === 'object') return '{' + Object.keys(value).filter(k=>value[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',') + '}'; return JSON.stringify(value) }
export function requireActor(actor, tenantId, review = false) { const role = actor?.memberships?.find(m=>m.tenant_id===tenantId)?.role; invariant(actor?.id && (review ? ['owner','admin','reviewer'] : ['owner','admin','editor']).includes(role), 'FORBIDDEN', 'You do not have permission for this production', 403) }
export function assertCurrent(state, job) {
 const tenant=state.tenants[job.tenant_id]
 invariant(tenant, 'SOURCE_CHANGED','Workspace is unavailable',409)
 if(job.creation_mode==='GUIDED_SCENE'){
  const profile=state.tenant_brand_profiles?.[job.tenant_id]
  invariant(profile&&profile.version===job.tenant_brand_profile_version,'BRAND_PROFILE_CHANGED','Brand configuration changed after this scene was created; recompile the scene before continuing',409)
  for(const ref of job.prompt_compilation?.reference_roles||[]){
   const asset=ref.role==='CHARACTER_IDENTITY_ONLY'?state.brand_assets?.[job.tenant_id]?.[ref.asset_id]:state.scene_reference_assets?.[job.tenant_id]?.[ref.asset_id]
   const semanticRoleCurrent=ref.role==='CHARACTER_IDENTITY_ONLY'?asset?.kind==='CHARACTER_REFERENCE'&&asset?.rights_state==='AUTHORIZED'&&ref.authorization==='AUTHORIZED':asset?.role===ref.role&&asset?.authorization===ref.authorization&&['ENVIRONMENT_ONLY','STYLE_ONLY'].includes(ref.role)
   invariant(asset&&asset.tenant_id===job.tenant_id&&asset.sha256===ref.sha256&&semanticRoleCurrent,'REFERENCE_CHANGED','A scene reference or its semantic authorization changed after prompt compilation; recompile before continuing',409)
  }
  return []
 }
 const current=job.source_ids.map(id=>tenant.sources.find(s=>s.id===id))
 invariant(current.every(Boolean) && current.every(s=>s.purpose==='source'&&['explicit','persisted-authorized'].includes(s.authorization)), 'SOURCE_CHANGED','A source authorization is no longer available',409)
 invariant(digest(current.sort((a,b)=>a.id.localeCompare(b.id)))===digest([...job.source_authorization_snapshot].sort((a,b)=>a.id.localeCompare(b.id))), 'SOURCE_CHANGED','Sources changed after this plan was created; create a fresh plan',409)
 invariant(state.dna[job.tenant_id]?.revision===job.content_dna_revision, 'DNA_CHANGED','Content DNA changed after this plan was created; create a fresh plan',409)
 return current
}
export function requiresHuman(job,node,testMode=false){if(job.creation_mode==='GUIDED_SCENE')return node==='RELEASE'||(!testMode&&['CRITIC','INDEPENDENT_VERIFIER'].includes(node));return (node==='CONCEPT_REVIEW'&&['HYBRID','GENERATIVE'].includes(job.strategy))||['CREATIVE_GATE','RELEASE'].includes(node)||(!testMode&&['CRITIC','INDEPENDENT_VERIFIER'].includes(node))}
export function buildJobGraph(job,testMode=false) { return { schema_version:'graph-harness.project.v1', project_id:'media-'+job.id, mode:'SHIP', gate_definitions:STAGES.map(id=>({id:id.toLowerCase(),required_evidence_kinds:[id.toLowerCase()],blocking:true})), nodes:STAGES.map((id,i)=>({id,kind:id.toLowerCase(),title:id.replaceAll('_',' '),status:requiresHuman(job,id,testMode)?'spec_ready':'approved',depends_on:i?[STAGES[i-1]]:[],capability:requiresHuman(job,id,testMode)?'human-review':testMode?'test-fixture':'media-production',gates:{review:[id.toLowerCase()]},allowed_paths:['evidence/**','artifacts/**']})) } }
export function event(state,job,type,message,now=Date.now()) { const item={id:String((state.event_sequence||0)+1),tenant_id:job.tenant_id,job_id:job.id,type:'product_event',event:type,message,stage:job.stage,status:job.status,created_at:new Date(now).toISOString()}; state.event_sequence=Number(item.id); state.events.push(item); return item }
