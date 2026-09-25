import {randomUUID} from 'node:crypto'
import {fields,invariant,safeId,boundedText} from './errors.mjs'
import {assertAudienceSafe,rejectSecretMaterial,validatePublicLocator,contentHash} from './contracts.mjs'

const EDIT=['owner','admin','editor']
const REVIEW=['owner','admin','reviewer']
export const CREATOR_INSIGHT_STAGES=Object.freeze(['SIGNAL_CAPTURE','TOPIC_SYNTHESIS','CONTENT_GAP_REVIEW','PLAN_DRAFT','HUMAN_REVIEW','READY_TO_CREATE'])
const SIGNAL_TYPES=new Set(['manual','search','comments','analytics'])
const PUBLIC_AFFAIRS_CTA=/(?:\b(?:vota|voten|vote)\s+(?:por|x|for)\b|\b(?:apoya|apoye|apoyen|respalda|respalde|respalden)\s+(?:a|al|la|el|nuestro|nuestra)\b|\b(?:af[ií]liate|afil[ií]ate|[uú]nete)\s+(?:a|al|con)\b|\bsupport\s+(?:our|the|candidate|party|campaign)\b|\bjoin\s+(?:our|the)\s+(?:campaign|party)\b)/i
const STOPWORDS=new Set(['para','como','sobre','desde','este','esta','estos','estas','with','from','that','this','what','your','the','and','una','uno','unos','unas','del','las','los','por','que'])

function neutralText(value,tenant,label,max){
 const text=boundedText(value,label,max)
 assertAudienceSafe(text)
 if(tenant?.content_context==='public-affairs')invariant(!PUBLIC_AFFAIRS_CTA.test(text),'CONTENT_INSIGHT_POLICY','Creator Insight en asuntos públicos admite planificación informativa para audiencia general, no llamados electorales ni persuasión política.')
 return text
}
function normalizeHashtag(value){
 invariant(typeof value==='string','INVALID_INPUT','Cada hashtag debe ser texto.')
 const raw=value.trim().replace(/^#+/,'').normalize('NFKC').replace(/[^\p{L}\p{N}_]/gu,'')
 invariant(raw.length>0&&raw.length<=40,'INVALID_INPUT','Cada hashtag debe tener entre 1 y 40 caracteres útiles.')
 return '#'+raw
}
function deriveHashtags(topic){
 const tokens=topic.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').split(/[^a-zA-Z0-9]+/).filter(v=>v.length>=4&&!STOPWORDS.has(v.toLowerCase())).slice(0,4)
 const tags=tokens.map(v=>'#'+v[0].toUpperCase()+v.slice(1))
 if(tags.length<3)tags.push('#ContenidoUtil')
 return [...new Set(tags)].slice(0,6)
}
function normalizeHashtags(input,topic,tenant){
 const values=input===undefined?deriveHashtags(topic):input
 invariant(Array.isArray(values)&&values.length>0&&values.length<=8,'INVALID_INPUT','Usa entre 1 y 8 hashtags.')
 const tags=[...new Set(values.map(normalizeHashtag))]
 neutralText(tags.join(' '),tenant,'Hashtags',400)
 return tags
}
function graphFor(approved=false){
 return {graph_id:'creator-content-insight-v1',nodes:CREATOR_INSIGHT_STAGES.map(id=>({id,status:approved?'done':id==='HUMAN_REVIEW'?'review':id==='READY_TO_CREATE'?'spec_ready':'done'}))}
}
function normalizePlan(input,topic,tenant){
 fields(input,['idea','title','description','hashtags'])
 const idea=neutralText(input.idea??`Explicar ${topic} con una pieza breve, clara y útil para una audiencia general.`,tenant,'Idea',500)
 const title=neutralText(input.title??`Guía breve: ${topic}`,tenant,'Título',200)
 const description=neutralText(input.description??`Contenido breve que organiza lo esencial sobre ${topic}, responde una pregunta concreta y deja claras las fuentes o datos que conviene revisar antes de publicar.`,tenant,'Descripción',1200)
 const hashtags=normalizeHashtags(input.hashtags,topic,tenant)
 const value={idea,title,description,hashtags,purpose:'informational',audience_mode:'general-audience',automatic_publish:false}
 value.plan_sha=contentHash(value)
 return value
}
function publicInsight(value){return structuredClone(value)}

export function creatorContentInsightSupport({repository,context}){
 return {
  async creatorInsights(token,id){
   await context(token,id)
   const state=await repository.read()
   return Object.values(state.creator_insights?.[id]||{}).sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(publicInsight)
  },
  async creatorInsightDiscovery(token,id){
   await context(token,id)
   const state=await repository.read()
   const insights=Object.values(state.creator_insights?.[id]||{}).sort((a,b)=>b.created_at.localeCompare(a.created_at))
   const signal_types={manual:0,search:0,comments:0,analytics:0}
   for(const insight of insights)if(Object.hasOwn(signal_types,insight.signal?.type))signal_types[insight.signal.type]+=1
   return {
    schema_version:'creator-content-discovery.v1',
    tenant_id:id,
    source_scope:'workspace-recorded-signals',
    live_platform_data:false,
    ordering:'created_at_desc',
    overview:{
     total_signals:insights.length,
     content_gaps:insights.filter(value=>value.content_gap===true).length,
     draft_plans:insights.filter(value=>value.status==='DRAFT').length,
     approved_plans:insights.filter(value=>value.status==='APPROVED').length,
     last_updated_at:insights[0]?.updated_at||insights[0]?.created_at||null
    },
    signal_types,
    insights:insights.map(publicInsight)
   }
  },
  async creatorInsight(token,id,insightId){
   await context(token,id);safeId(insightId,'Insight ID')
   const value=(await repository.read()).creator_insights?.[id]?.[insightId]
   invariant(value,'NOT_FOUND','No se encontró el insight.',404)
   return publicInsight(value)
  },
  async createCreatorInsight(token,id,input){
   const {user}=await context(token,id,EDIT)
   fields(input,['topic','signal_type','observation','source_url','content_gap','plan'])
   const state=await repository.read(),tenant=state.tenants[id]||state.onboarding[id]
   invariant(tenant,'NOT_FOUND','No se encontró el espacio.',404)
   const topic=neutralText(input.topic,tenant,'Tema',180),signal_type=input.signal_type||'manual'
   invariant(SIGNAL_TYPES.has(signal_type),'INVALID_INPUT','Elige una señal válida.')
   const observation=input.observation?neutralText(input.observation,tenant,'Observación',1200):''
   const source_url=input.source_url?validatePublicLocator(input.source_url):null
   invariant(input.content_gap===undefined||typeof input.content_gap==='boolean','INVALID_INPUT','El indicador de oportunidad no es válido.')
   rejectSecretMaterial(input)
   const plan=normalizePlan(input.plan||{},topic,tenant),created_at=new Date().toISOString(),insightId='insight_'+randomUUID()
   return repository.transact(s=>{
    s.creator_insights??={};s.creator_insights[id]??={}
    const value={schema_version:'creator-content-insight.v1',id:insightId,tenant_id:id,topic,signal:{type:signal_type,observation,source_url,source_status:source_url?'USER_PROVIDED_REFERENCE':'MANUAL_OBSERVATION',live_platform_data:false},content_gap:input.content_gap===true,plan,status:'DRAFT',graph:graphFor(false),created_at,updated_at:created_at,created_by:user.id,approved_at:null,approved_by:null}
    value.insight_sha=contentHash({...value,insight_sha:undefined})
    s.creator_insights[id][insightId]=value
    s.events.push({id:randomUUID(),tenant_id:id,type:'CREATOR_INSIGHT_DRAFTED',insight_id:insightId,actor_id:user.id,created_at})
    return publicInsight(value)
   })
  },
  async updateCreatorInsightPlan(token,id,insightId,input){
   const {user}=await context(token,id,EDIT);safeId(insightId,'Insight ID')
   return repository.transact(state=>{
    const tenant=state.tenants[id]||state.onboarding[id],value=state.creator_insights?.[id]?.[insightId]
    invariant(tenant&&value,'NOT_FOUND','No se encontró el insight.',404)
    invariant(value.status==='DRAFT','INSIGHT_LOCKED','Un plan aprobado no se edita; crea un insight nuevo para cambiarlo.',409)
    value.plan=normalizePlan(input,value.topic,tenant)
    value.updated_at=new Date().toISOString();value.updated_by=user.id;value.insight_sha=contentHash({...value,insight_sha:undefined})
    state.events.push({id:randomUUID(),tenant_id:id,type:'CREATOR_INSIGHT_PLAN_UPDATED',insight_id:insightId,actor_id:user.id,created_at:value.updated_at})
    return publicInsight(value)
   })
  },
  async approveCreatorInsight(token,id,insightId,input){
   const {user}=await context(token,id,REVIEW);safeId(insightId,'Insight ID')
   fields(input,['plan_sha'])
   invariant(typeof input.plan_sha==='string'&&/^[a-f0-9]{64}$/.test(input.plan_sha),'INVALID_INPUT','La aprobación no coincide con este plan.')
   return repository.transact(state=>{
    const value=state.creator_insights?.[id]?.[insightId]
    invariant(value,'NOT_FOUND','No se encontró el insight.',404)
    invariant(value.status==='DRAFT'||value.status==='APPROVED','INSIGHT_LOCKED','El insight no se puede aprobar.',409)
    invariant(value.plan.plan_sha===input.plan_sha,'STALE_PLAN','Revisa la versión actual del plan antes de aprobar.',409)
    if(value.status==='APPROVED')return publicInsight(value)
    value.status='APPROVED';value.approved_at=new Date().toISOString();value.approved_by=user.id;value.updated_at=value.approved_at;value.graph=graphFor(true);value.insight_sha=contentHash({...value,insight_sha:undefined})
    state.events.push({id:randomUUID(),tenant_id:id,type:'CREATOR_INSIGHT_APPROVED',insight_id:insightId,actor_id:user.id,created_at:value.approved_at})
    return publicInsight(value)
   })
  }
 }
}
