import { readFile, realpath, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { resolve, relative, sep } from 'node:path'
import { MediaGraphService } from '../plugins/media-graph.mjs'

const root = await realpath(process.cwd())
const upstream = JSON.parse(await readFile('config/upstreams.json', 'utf8'))
const service = new MediaGraphService({ failClosed: true, projectRoot: root, runtimeRoot: process.env.GRAPH_HARNESS_RUNTIME_ROOT, pinnedRevision: upstream.graph_harness_sdlc.tested_revision })
const paths = { projectPath: 'graph/media-factory-web.project.json', eventsPath: 'graph/media-factory-web.events.jsonl' }
const validation = await service.validate(paths)
const state = await service.status(paths)
const events = (await readFile(paths.eventsPath, 'utf8')).trim().split('\n').filter(Boolean).map(JSON.parse)
const checks = []
for (const event of events.filter(e => e.event_type === 'evidence.recorded')) {
  const e = event.payload
  if (!/^[a-f0-9]{40}$/.test(e.commit)) throw new Error(`Evidence ${event.event_id}: immutable commit required`)
  execFileSync('git', ['cat-file', '-e', `${e.commit}^{commit}`], { stdio: 'pipe' })
  const path = await realpath(resolve(root, e.artifact))
  const rel = relative(root, path)
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`)) throw new Error(`Evidence ${event.event_id}: escaped repository`)
  if (!(await stat(path)).isFile()) throw new Error(`Evidence ${event.event_id}: not a file`)
  const actual = createHash('sha256').update(await readFile(path)).digest('hex')
  if (actual !== e.sha256) throw new Error(`Evidence ${event.event_id}: content hash mismatch`)
  checks.push({ event_id: event.event_id, node: event.node_id, kind: e.kind, commit: e.commit, sha256: actual })
}
const nodes = Object.fromEntries(state.nodes.map(n => [n.id,n.status]))
if (process.argv.includes('--require-done') && Object.values(nodes).some(status => status !== 'done')) throw new Error('Product graph has unfinished nodes')
console.log(JSON.stringify({ valid: validation.valid, event_count: validation.event_count, evidence_count: checks.length, nodes, checks }, null, 2))
