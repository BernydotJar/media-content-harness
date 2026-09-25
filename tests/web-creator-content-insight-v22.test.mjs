import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'

test('V22 discovery contract stays workspace-scoped, chronological and non-ranked',async()=>{
 const schema=JSON.parse(await readFile(new URL('../schemas/creator-content-discovery.schema.json',import.meta.url),'utf8'))
 const example=JSON.parse(await readFile(new URL('../examples/creator-content-discovery.example.json',import.meta.url),'utf8'))
 assert.equal(schema.properties.source_scope.const,'workspace-recorded-signals')
 assert.equal(schema.properties.live_platform_data.const,false)
 assert.equal(schema.properties.ordering.const,'created_at_desc')
 assert.equal(example.source_scope,'workspace-recorded-signals')
 assert.equal(example.live_platform_data,false)
 assert.equal(example.ordering,'created_at_desc')
 assert.equal(example.overview.total_signals,example.insights.length)
 assert.equal(example.overview.content_gaps,example.insights.filter(item=>item.content_gap).length)
})

test('V22 UI exposes internal analytics, discovery filters and all required plan fields without platform-demand claims',async()=>{
 const ui=await readFile(new URL('../components/CreatorContentInsights.tsx',import.meta.url),'utf8')
 for(const text of ['Señales registradas','Oportunidades','Planes en borrador','Planes aprobados','Analítica interna','Buscar insights','Filtrar insights','Filtrar por señal','IDEA','TÍTULO','DESCRIPCIÓN','HASHTAGS'])assert.match(ui,new RegExp(text))
 assert.match(ui,/no es un ranking ni una recomendación de plataforma/)
 assert.match(ui,/No inventamos métricas externas ni datos de TikTok/)
 assert.doesNotMatch(ui,/search volume|trend score|popularidad TikTok|demanda TikTok/i)
})

test('V22 spec preserves the public-affairs informational boundary and human approval',async()=>{
 const spec=await readFile(new URL('../specs/media-factory-web/WEB059-CREATOR-INSIGHT-DISCOVERY-V22.md',import.meta.url),'utf8')
 assert.match(spec,/general-audience informational planning/)
 assert.match(spec,/does not recommend a political actor, message, audience, campaign choice or content priority/)
 assert.match(spec,/exact-hash human approval/)
 assert.match(spec,/Nothing auto-publishes/)
})
