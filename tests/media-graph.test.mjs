import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import test from 'node:test'

import { MediaGraphService, apply } from '../plugins/media-graph.mjs'

const execFile = promisify(execFileCallback)
const GRAPH_REVISION = '477bdcc3d390c30eb49d823e5c7fd105fee2cc4d'

function config(overrides = {}) {
  return {
    failClosed: true,
    projectRoot: '/tmp/media-projects',
    runtimeRoot: '/tmp/graph-runtime',
    pinnedRevision: GRAPH_REVISION,
    ...overrides,
  }
}

test('fails closed without a pinned runtime', () => {
  const previous = process.env.GRAPH_HARNESS_RUNTIME_ROOT
  delete process.env.GRAPH_HARNESS_RUNTIME_ROOT
  try {
    assert.throws(() => new MediaGraphService({ failClosed: true, projectRoot: '/tmp', pinnedRevision: GRAPH_REVISION }), /runtimeRoot/)
  } finally {
    if (previous === undefined) delete process.env.GRAPH_HARNESS_RUNTIME_ROOT
    else process.env.GRAPH_HARNESS_RUNTIME_ROOT = previous
  }
  assert.throws(() => new MediaGraphService(config({ pinnedRevision: 'not-a-revision' })), /pinnedRevision/)
})

test('rejects graph paths outside projectRoot before graph command execution', async () => {
  const service = new MediaGraphService(config())
  service.verifyRuntime = async () => GRAPH_REVISION
  await assert.rejects(service.status({ projectPath: '../escape.json', eventsPath: 'events.jsonl' }), /escapes projectRoot/)
})

test('registers ctx.mediaGraph using Cordis provide()', () => {
  let provided
  const ctx = { provide(name, value) { provided = { name, value }; return () => {} } }
  apply(ctx, config())
  assert.equal(provided.name, 'mediaGraph')
  assert.ok(provided.value instanceof MediaGraphService)
})

test('passes optimistic concurrency id through argv without a shell', async () => {
  const calls = []
  const fakeExec = async (file, args) => {
    calls.push({ file, args })
    return { stdout: '{"event_id":"abc"}\n', stderr: '' }
  }
  const service = new MediaGraphService(config(), { execFile: fakeExec })
  service.verifyRuntime = async () => GRAPH_REVISION
  await service.checkpoint({
    projectPath: 'project.json', eventsPath: 'events.jsonl', actor: 'agent', label: 'checkpoint', commit: 'deadbeef', evidenceSummary: { ok: true }, expectedLastEventId: '11111111-1111-4111-8111-111111111111',
  })
  const call = calls.at(-1)
  assert.equal(call.file, 'python3')
  assert.ok(call.args.includes('--expected-last-event-id'))
  assert.ok(!call.args.join(' ').includes('&&'))
})

test('rejects a drifted Graph Harness runtime revision', async () => {
  const fakeExec = async () => ({ stdout: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n', stderr: '' })
  const service = new MediaGraphService(config(), { execFile: fakeExec })
  service.runtimeRoot = '/tmp'
  await assert.rejects(service.verifyRuntime(), /revision mismatch/)
})

test('integration: real Graph Harness exposes BRIEF flow and SOURCE readiness', { skip: !existsSync('/workspace/graph_harness') }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'media-graph-integration-'))
  const projectPath = join(root, 'project.json')
  const eventsPath = join(root, 'events.jsonl')
  const template = await readFile(new URL('../examples/media-production.graph.json', import.meta.url), 'utf8')
  await writeFile(projectPath, template)
  const { stdout } = await execFile('git', ['-C', '/workspace', 'rev-parse', 'HEAD'])
  assert.equal(stdout.trim(), GRAPH_REVISION)

  const service = new MediaGraphService(config({ runtimeRoot: '/workspace', projectRoot: root }))
  const validated = await service.validate({ projectPath: 'project.json', eventsPath: 'events.jsonl' })
  assert.equal(validated.valid, true)
  assert.deepEqual(await service.readyNodes({ projectPath: 'project.json', eventsPath: 'events.jsonl' }), [])

  const evidence = await service.recordEvidence({
    projectPath: 'project.json', eventsPath: 'events.jsonl', node: 'BRIEF', actor: 'spec-author', kind: 'brief_spec', result: 'PASS', artifact: '00_BRIEF/brief.md', sha256: 'a'.repeat(64), command: 'unit-test', commit: 'deadbeef',
  })
  await service.evaluateGate({
    projectPath: 'project.json', eventsPath: 'events.jsonl', node: 'BRIEF', actor: 'reviewer', gate: 'brief_spec', result: 'PASS', evidenceIds: [evidence.event_id], note: 'brief is valid',
  })
  await service.recordApproval({
    projectPath: 'project.json', eventsPath: 'events.jsonl', node: 'BRIEF', actor: 'human', scopeHash: 'b'.repeat(64), note: 'approved',
  })
  for (const [to, actor] of [['approved','human'], ['ready','leader'], ['running','producer'], ['review','producer'], ['done','reviewer']]) {
    await service.transition({ projectPath: 'project.json', eventsPath: 'events.jsonl', node: 'BRIEF', actor, to, reason: `move to ${to}` })
  }
  assert.deepEqual(await service.readyNodes({ projectPath: 'project.json', eventsPath: 'events.jsonl' }), ['SOURCE'])
  const state = await service.status({ projectPath: 'project.json', eventsPath: 'events.jsonl' })
  assert.equal(state.nodes.find(node => node.id === 'BRIEF').status, 'done')
})
