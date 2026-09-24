import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {randomBytes,scryptSync} from 'node:crypto'
import {createService} from '../server/services.mjs'
import {handleApi} from '../server/http.mjs'
import {CREATOR_INSIGHT_STAGES} from '../server/creator-content-insights.mjs'

async function fixture(t){
 const root=await mkdtemp('/tmp/media-web-insight-')
 t.after(()=>rm(root,{recursive:true,force:true}))
 const salt=randomBytes(24).toString('hex'),password='creator insight fixture password'
 const hash=scryptSync(password,Buffer.from(salt,'hex'),64).toString('hex')
 const users=[
  {id:'creator',email:'creator@example.org',name:'Creator',password:{salt,hash},can_create_tenants:true,memberships:[]},
  {id:'outside',email:'outside@example.org',name:'Outside',password:{salt,hash},memberships:[]}
 ]
 const identityFile=join(root,'identities.json')
 await writeFile(identityFile,JSON.stringify({users}))
 const service=createService({dataRoot:join(root,'data'),identityFile,publicOrigin:'http://localhost:3000'})
 const token=(await service.auth.login({email:users[0].email,password})).token
 const outside=(await service.auth.login({email:users[1].email,password})).token
 const tenant=await service.createTenant(token,{organization:'Creator Studio',tenant_id:'creator-studio',content_context:'commercial'})
 return {root,service,token,outside,tenant,password}
}
function req(path,token,body){
 return new Request('http://localhost:3000/api/v1/'+path,{method:body===undefined?'GET':'POST',headers:{...(token?{cookie:'media_factory_session='+token}:{}),...(body===undefined?{}:{origin:'http://localhost:3000','content-type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})})
}

test('Creator Content Insight creates a truthful editable plan and six-stage graph',async t=>{
 const f=await fixture(t)
 const insight=await f.service.createCreatorInsight(f.token,'creator-studio',{
  topic:'cómo cuidar el agua en casa',
  signal_type:'search',
  observation:'La misma pregunta aparece con frecuencia en conversaciones de la comunidad.',
  source_url:'https://example.org/water-guide',
  content_gap:true
 })
 assert.equal(insight.schema_version,'creator-content-insight.v1')
 assert.equal(insight.signal.live_platform_data,false)
 assert.equal(insight.signal.source_status,'USER_PROVIDED_REFERENCE')
 assert.equal(insight.content_gap,true)
 assert.ok(insight.plan.idea)
 assert.ok(insight.plan.title)
 assert.ok(insight.plan.description)
 assert.ok(insight.plan.hashtags.length>=1)
 assert.equal(insight.plan.purpose,'informational')
 assert.equal(insight.plan.audience_mode,'general-audience')
 assert.equal(insight.plan.automatic_publish,false)
 assert.match(insight.plan.plan_sha,/^[a-f0-9]{64}$/)
 assert.deepEqual(insight.graph.nodes.map(n=>n.id),CREATOR_INSIGHT_STAGES)
 assert.deepEqual(insight.graph.nodes.map(n=>n.status),['done','done','done','done','review','spec_ready'])
 assert.equal((await f.service.creatorInsights(f.token,'creator-studio')).length,1)
 assert.equal((await f.service.creatorInsight(f.token,'creator-studio',insight.id)).id,insight.id)
})

test('Creator Insight edit invalidates stale approval and approved plan becomes ready to create',async t=>{
 const f=await fixture(t)
 let insight=await f.service.createCreatorInsight(f.token,'creator-studio',{topic:'reciclaje en casa',signal_type:'manual',content_gap:true})
 const oldSha=insight.plan.plan_sha
 insight=await f.service.updateCreatorInsightPlan(f.token,'creator-studio',insight.id,{
  idea:'Explicar tres hábitos de reciclaje doméstico para una audiencia general.',
  title:'Tres hábitos de reciclaje en casa',
  description:'Una guía breve y práctica para separar materiales y reducir residuos.',
  hashtags:['#Reciclaje','#Hogar','#ContenidoUtil']
 })
 assert.notEqual(insight.plan.plan_sha,oldSha)
 await assert.rejects(f.service.approveCreatorInsight(f.token,'creator-studio',insight.id,{plan_sha:oldSha}),{code:'STALE_PLAN'})
 insight=await f.service.approveCreatorInsight(f.token,'creator-studio',insight.id,{plan_sha:insight.plan.plan_sha})
 assert.equal(insight.status,'APPROVED')
 assert.ok(insight.graph.nodes.every(n=>n.status==='done'))
 assert.equal(insight.approved_by,'creator')
 await assert.rejects(f.service.updateCreatorInsightPlan(f.token,'creator-studio',insight.id,{idea:'Otra idea',title:'Otro título',description:'Otra descripción',hashtags:['#Otro']}),{code:'INSIGHT_LOCKED'})
})

test('Creator Insight is tenant-bound and outsider access fails closed',async t=>{
 const f=await fixture(t)
 const insight=await f.service.createCreatorInsight(f.token,'creator-studio',{topic:'fotografía de producto',signal_type:'analytics'})
 for(const operation of [
  ()=>f.service.creatorInsights(f.outside,'creator-studio'),
  ()=>f.service.creatorInsight(f.outside,'creator-studio',insight.id),
  ()=>f.service.createCreatorInsight(f.outside,'creator-studio',{topic:'otro tema'}),
  ()=>f.service.updateCreatorInsightPlan(f.outside,'creator-studio',insight.id,{idea:'Idea',title:'Título',description:'Descripción',hashtags:['#Tema']}),
  ()=>f.service.approveCreatorInsight(f.outside,'creator-studio',insight.id,{plan_sha:insight.plan.plan_sha})
 ])await assert.rejects(operation,{code:'FORBIDDEN'})
})

test('public-affairs Creator Insight stays informational and rejects electoral persuasion or targeting',async t=>{
 const f=await fixture(t)
 await f.service.createTenant(f.token,{organization:'Public Information',tenant_id:'public-info',content_context:'public-affairs'})
 const neutral=await f.service.createCreatorInsight(f.token,'public-info',{topic:'cómo funciona el presupuesto municipal',signal_type:'search',content_gap:true})
 assert.equal(neutral.plan.purpose,'informational')
 const procedure=await f.service.createCreatorInsight(f.token,'public-info',{topic:'cómo votar y qué documentos revisar antes de ir al centro de votación',signal_type:'search'})
 assert.equal(procedure.plan.purpose,'informational')
 await assert.rejects(f.service.createCreatorInsight(f.token,'public-info',{topic:'Vota por nuestra opción este domingo',signal_type:'search'}),{code:'CONTENT_INSIGHT_POLICY'})
 await assert.rejects(f.service.createCreatorInsight(f.token,'public-info',{topic:'Create content to target Catholic voters by religion',signal_type:'search'}),{code:'AUDIENCE_POLICY'})
})

test('Creator Insight HTTP API exposes create list get edit and hash-bound approval',async t=>{
 const f=await fixture(t)
 const createdResponse=await handleApi(req('tenants/creator-studio/creator-insights',f.token,{topic:'ideas de iluminación para video',signal_type:'search',observation:'Pregunta frecuente',content_gap:true}),f.service)
 assert.equal(createdResponse.status,201)
 let insight=(await createdResponse.json()).data
 const list=await handleApi(req('tenants/creator-studio/creator-insights',f.token),f.service)
 assert.equal(list.status,200);assert.equal((await list.json()).data.length,1)
 const get=await handleApi(req('tenants/creator-studio/creator-insights/'+insight.id,f.token),f.service)
 assert.equal(get.status,200)
 const edit=await handleApi(req('tenants/creator-studio/creator-insights/'+insight.id+'/plan',f.token,{idea:'Mostrar una iluminación simple con una sola fuente de luz.',title:'Iluminación simple para video',description:'Una explicación breve de una configuración sencilla.',hashtags:['#Video','#Iluminacion']}),f.service)
 assert.equal(edit.status,200);insight=(await edit.json()).data
 const approve=await handleApi(req('tenants/creator-studio/creator-insights/'+insight.id+'/approve',f.token,{plan_sha:insight.plan.plan_sha}),f.service)
 assert.equal(approve.status,200);assert.equal((await approve.json()).data.status,'APPROVED')
 assert.equal((await handleApi(req('tenants/creator-studio/creator-insights',f.outside),f.service)).status,403)
})

test('Creator Insight graph definition and UI remain truthful about platform data and content-plan fields',async()=>{
 const graph=JSON.parse(await readFile(new URL('../graph/creator-content-insight-v1.project.json',import.meta.url),'utf8'))
 assert.equal(graph.project_id,'creator-content-insight-v1')
 assert.deepEqual(graph.nodes.map(n=>n.id),['CCI001-SIGNAL-CAPTURE','CCI002-TOPIC-SYNTHESIS','CCI003-CONTENT-GAP-REVIEW','CCI004-PLAN-DRAFT','CCI005-HUMAN-REVIEW','CCI006-READY-TO-CREATE'])
 assert.ok(graph.nodes.every(n=>!/publish/i.test(n.id)))
 const ui=await readFile(new URL('../components/CreatorContentInsights.tsx',import.meta.url),'utf8')
 for(const label of ['IDEA','TÍTULO','DESCRIPCIÓN','HASHTAGS'])assert.match(ui,new RegExp(label))
 assert.match(ui,/No muestra datos de TikTok en vivo sin un conector autorizado/)
 assert.match(ui,/Crear con este plan/)
 const planner=await readFile(new URL('../components/planner.tsx',import.meta.url),'utf8')
 assert.match(planner,/query\.get\('insight'\)/)
 assert.match(planner,/Plan de Creator Insight cargado/)
})
