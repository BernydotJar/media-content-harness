import { readFile } from 'node:fs/promises'

const files = [
  'schemas/media-treatment.schema.json',
  'schemas/synthetic-media-record.schema.json',
  'examples/media-treatment.example.json',
  'examples/media-production.graph.json',
  'config/upstreams.json',
]
const parsed = new Map()
for (const file of files) parsed.set(file, JSON.parse(await readFile(new URL(`../${file}`, import.meta.url), 'utf8')))

const treatment = parsed.get('examples/media-treatment.example.json')
assert(treatment.schema_version === 'media-treatment.v1', 'treatment schema_version')
for (const key of ['project_id','mode','intent','source','creative_hypothesis','beats','capcut_plan','quality_contract','critic_contract','release']) assert(treatment[key] !== undefined, `treatment missing ${key}`)
assert(Array.isArray(treatment.beats) && treatment.beats.length > 0, 'treatment beats')

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
