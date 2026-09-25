import { readFile } from 'node:fs/promises'

const files = [
  'schemas/media-treatment.schema.json',
  'schemas/synthetic-media-record.schema.json',
  'schemas/tenant-media-profile.schema.json',
  'schemas/reference-observation.schema.json',
  'schemas/content-dna.schema.json',
  'schemas/weekly-production-plan.schema.json',
  'schemas/creator-content-insight.schema.json',
  'schemas/creator-content-discovery.schema.json',
  'examples/media-treatment.example.json',
  'examples/tenant-media-profile.example.json',
  'examples/reference-observation.example.json',
  'examples/content-dna.example.json',
  'examples/weekly-production-plan.example.json',
  'examples/creator-content-insight.example.json',
  'examples/creator-content-discovery.example.json',
  'examples/media-production.graph.json',
  'config/upstreams.json',
]
const parsed = new Map()
for (const file of files) parsed.set(file, JSON.parse(await readFile(new URL(`../${file}`, import.meta.url), 'utf8')))

const treatment = parsed.get('examples/media-treatment.example.json')
assert(treatment.schema_version === 'media-treatment.v1', 'treatment schema_version')
for (const key of ['project_id','mode','intent','source','creative_hypothesis','beats','capcut_plan','quality_contract','critic_contract','release']) assert(treatment[key] !== undefined, `treatment missing ${key}`)
assert(Array.isArray(treatment.beats) && treatment.beats.length > 0, 'treatment beats')

const tenant = parsed.get('examples/tenant-media-profile.example.json')
assert(tenant.schema_version === 'tenant-media-profile.v1', 'tenant schema_version')
for (const key of ['tenant_id','organization','runtime_namespace','browser_context_ref','content_context','audience_policy','brand','sources','production_defaults']) assert(tenant[key] !== undefined, `tenant missing ${key}`)
assert(tenant.audience_policy.mode === 'general-audience', 'tenant audience mode')
assert(tenant.audience_policy.sensitive_trait_targeting === false, 'tenant sensitive targeting disabled')
assert(tenant.audience_policy.voter_microtargeting === false, 'tenant voter microtargeting disabled')
assert(Array.isArray(tenant.sources) && tenant.sources.length > 0, 'tenant sources')
assert(new Set(tenant.sources.map(source => source.id)).size === tenant.sources.length, 'tenant duplicate source id')

const observation = parsed.get('examples/reference-observation.example.json')
assert(observation.schema_version === 'reference-observation.v1', 'reference observation schema_version')
assert(observation.tenant_id === tenant.tenant_id, 'reference observation tenant')
assert(/^[a-f0-9]{64}$/.test(observation.evidence_sha256), 'reference observation evidence hash')
assert(Array.isArray(observation.observed_elements) && observation.observed_elements.length > 0, 'reference observation elements')

const dna = parsed.get('examples/content-dna.example.json')
assert(dna.schema_version === 'content-dna.v1', 'content DNA schema_version')
assert(dna.tenant_id === observation.tenant_id, 'content DNA tenant')
assert(dna.source_observation_ids.includes(observation.id), 'content DNA provenance')
assert(dna.audience_mode === 'general-audience', 'content DNA audience mode')
assert(dna.copying_policy.direct_text_reuse === false, 'content DNA direct text reuse disabled')
assert(dna.copying_policy.shot_for_shot_copying === false, 'content DNA shot copy disabled')
assert(dna.copying_policy.source_audio_reuse === false, 'content DNA source audio reuse disabled')

const weekly = parsed.get('examples/weekly-production-plan.example.json')
assert(weekly.schema_version === 'weekly-production-plan.v1', 'weekly schema_version')
assert(weekly.tenant_id === tenant.tenant_id, 'weekly tenant')
assert(weekly.audience_mode === 'general-audience', 'weekly audience mode')
assert(Array.isArray(weekly.jobs) && weekly.jobs.length > 0, 'weekly jobs')
for (const job of weekly.jobs) {
  assert(job.pipeline === 'media-graph-v1', 'weekly job pipeline')
  assert(job.initial_graph_node === 'BRIEF', 'weekly initial graph node')
  assert(job.human_approval_required === true, 'weekly approval gate')
  assert(job.publication_action === 'none', 'weekly no autopublish')
  assert(job.source_ids.every(id => weekly.source_authorization_snapshot.some(source => source.id === id && source.purpose === 'source')), 'weekly authorized production sources')
  assert(job.story_devices.every(device => dna.story_devices.includes(device)), 'weekly story devices bounded by DNA')
}

const insight = parsed.get('examples/creator-content-insight.example.json')
assert(insight.schema_version === 'creator-content-insight.v1', 'creator insight schema_version')
assert(insight.signal.live_platform_data === false, 'creator insight live data truthfulness')
for (const key of ['idea','title','description','hashtags']) assert(insight.plan[key] !== undefined, `creator insight plan missing ${key}`)
assert(insight.plan.audience_mode === 'general-audience', 'creator insight audience mode')
assert(insight.plan.automatic_publish === false, 'creator insight no autopublish')
assert(Array.isArray(insight.graph.nodes) && insight.graph.nodes.length === 6, 'creator insight graph nodes')

const discovery = parsed.get('examples/creator-content-discovery.example.json')
assert(discovery.schema_version === 'creator-content-discovery.v1', 'creator discovery schema_version')
assert(discovery.source_scope === 'workspace-recorded-signals', 'creator discovery source scope')
assert(discovery.live_platform_data === false, 'creator discovery live data truthfulness')
assert(discovery.ordering === 'created_at_desc', 'creator discovery chronological ordering')
assert(discovery.overview.total_signals === discovery.insights.length, 'creator discovery total signals')
assert(discovery.overview.content_gaps === discovery.insights.filter(item => item.content_gap).length, 'creator discovery gaps')
assert(Object.values(discovery.signal_types).reduce((sum, value) => sum + value, 0) === discovery.insights.length, 'creator discovery signal counts')
assert(discovery.insights.every(item => item.plan.idea && item.plan.title && item.plan.description && item.plan.hashtags.length), 'creator discovery content plan fields')

const graph = parsed.get('examples/media-production.graph.json')
assert(graph.schema_version === 'graph-harness.project.v1', 'graph schema_version')
assert(graph.mode === 'SHIP', 'graph mode')
assert(Array.isArray(graph.nodes) && graph.nodes.length >= 10, 'graph nodes')
assert(new Set(graph.nodes.map(node => node.id)).size === graph.nodes.length, 'graph duplicate node id')
assert(Array.isArray(graph.gate_definitions) && graph.gate_definitions.length > 0, 'graph gates')

const upstreams = parsed.get('config/upstreams.json')
for (const key of ['deepseek_harness','graph_harness_sdlc']) assert(/^[a-f0-9]{40}$/.test(upstreams[key].tested_revision), `${key} tested_revision`)
console.log(JSON.stringify({ valid: true, files: files.length }))

function assert(condition, label) { if (!condition) throw new Error(`example validation failed: ${label}`) }
