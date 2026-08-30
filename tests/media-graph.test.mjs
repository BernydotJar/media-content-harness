import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
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
    pythonExecutable: '/usr/bin/python3',
    gitExecutable: '/usr/bin/git',
    ...overrides,
  }
}

test('fails closed without runtime, pin, or absolute executables', () => {
  const previous = process.env.GRAPH_HARNESS_RUNTIME_ROOT
  delete process.env.GRAPH_HARNESS_RUNTIME_ROOT
  try {
    assert.throws(() => new MediaGraphService({ failClosed: true, projectRoot: '/tmp', pinnedRevision: GRAPH_REVISION }), /runtimeRoot/)
  } finally {
    if (previous === undefined) delete process.env.GRAPH_HARNESS_RUNTIME_ROOT
    else process.env.GRAPH_HARNESS_RUNTIME_ROOT = previous
  }
  assert.throws(() => new MediaGraphService(config({ pinnedRevision: 'not-a-revision' })), /pinnedRevision/)
  assert.throws(() => new MediaGraphService(config({ pythonExecutable: 'python3' })), /absolute/)
})

test('rejects lexical graph path escape before graph command execution', async () => {
  const service = new MediaGraphService(config())
  service.verifyRuntime = async () => GRAPH_REVISION
  await assert.rejects(service.status({ projectPath: '../escape.json', eventsPath: 'events.jsonl' }), /escapes projectRoot/)
})

test('rejects canonical symlink escape from projectRoot', async () => {
  const root = await mkdtemp(join(tmpdir(), 'media-graph-symlink-'))
  const projectRoot = join(root, 'projects')
  const outside = join(root, 'outside')
  await mkdir(projectRoot)
  await mkdir(outside)
  await writeFile(join(outside, 'project.json'), '{}')
  await symlink(outside, join(projectRoot, 'link'))
  const service = new MediaGraphService(config({ projectRoot, runtimeRoot: '/workspace' }))
  service.verifyRuntime = async () => GRAPH_REVISION
  await assert.rejects(
    service.status({ projectPath: 'link/project.json', eventsPath: 'events.jsonl' }),
    /escapes projectRoot/,
  )
})

test('rejects an events symlink even when its current target is missing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'media-graph-event-link-'))
  await writeFile(join(root, 'project.json'), '{}')
  await symlink('/tmp/does-not-exist-yet.jsonl', join(root, 'events.jsonl'))
  const service = new MediaGraphService(config({ projectRoot: root, runtimeRoot: '/workspace' }))
  service.verifyRuntime = async () => GRAPH_REVISION
  await assert.rejects(
    service.status({ projectPath: 'project.json', eventsPath: 'events.jsonl' }),
    /must not be a symbolic link/,
  )
})

test('registers ctx.mediaGraph using Cordis provide()', () => {
  let provided
  const ctx = { provide(name, value) { provided = { name, value }; return () => {} } }
  apply(ctx, config())
  assert.equal(provided.name, 'mediaGraph')
  assert.ok(provided.value instanceof MediaGraphService)
})

test('uses argv flag=value framing and optimistic concurrency without a shell', async () => {
  const root = await mkdtemp(join(tmpdir(), 'media-graph-unit-'))
  const runtimeRoot = join(root, 'runtime')
  const projectRoot = join(root, 'projects')
  await mkdir(runtimeRoot)
  await mkdir(projectRoot)
  await writeFile(join(projectRoot, 'project.json'), '{}')
  const calls = []
  const fakeExec = async (file, args, options) => {
    calls.push({ file, args, options })
    return { stdout: '{"event_id":"abc"}\n', stderr: '' }
  }
  const service = new MediaGraphService(config({ runtimeRoot, projectRoot }), { execFile: fakeExec })
  service.verifyRuntime = async () => GRAPH_REVISION
  await service.checkpoint({
    projectPath: 'project.json', eventsPath: 'events.jsonl', actor: '--agent', label: '--checkpoint', commit: 'deadbeef', evidenceSummary: { ok: true }, expectedLastEventId: '11111111-1111-4111-8111-111111111111',
  })
  const call = calls.at(-1)
  assert.equal(call.file, '/usr/bin/python3')
  assert.ok(call.args.includes('--actor=--agent'))
  assert.ok(call.args.includes('--label=--checkpoint'))
  assert.ok(call.args.includes('--expected-last-event-id=11111111-1111-4111-8111-111111111111'))
  assert.ok(!call.args.join(' ').includes('&&'))
})

test('omits --evidence when a non-passing gate has no evidence ids', async () => {
  const root = await mkdtemp(join(tmpdir(), 'media-graph-empty-evidence-'))
  await writeFile(join(root, 'project.json'), '{}')
  const calls = []
  const fakeExec = async (file, args) => { calls.push({ file, args }); return { stdout: '{"event_id":"abc"}\n', stderr: '' } }
  const service = new MediaGraphService(config({ runtimeRoot: root, projectRoot: root }), { execFile: fakeExec })
  service.verifyRuntime = async () => GRAPH_REVISION
  await service.evaluateGate({ projectPath: 'project.json', eventsPath: 'events.jsonl', node: 'BRIEF', actor: 'critic', gate: 'brief_spec', result: 'BLOCKED', evidenceIds: [], note: '--not-ready' })
  const args = calls.at(-1).args
  assert.ok(!args.includes('--evidence'))
  assert.ok(args.includes('--note=--not-ready'))
})

test('sanitizes git and python environments', async () => {
  const root = await mkdtemp(join(tmpdir(), 'media-graph-env-'))
  await writeFile(join(root, 'project.json'), '{}')
  const calls = []
  const fakeExec = async (file, args, options) => {
    calls.push({ file, args, env: options.env })
    if (file === '/usr/bin/git') return { stdout: `${GRAPH_REVISION}\n`, stderr: '' }
    return { stdout: '{"valid":true}\n', stderr: '' }
  }
  const oldGitDir = process.env.GIT_DIR
  const oldPythonPath = process.env.PYTHONPATH
  process.env.GIT_DIR = '/attacker/git'
  process.env.PYTHONPATH = '/attacker/python'
  try {
    const service = new MediaGraphService(config({ runtimeRoot: root, projectRoot: root }), { execFile: fakeExec })
    await service.validate({ projectPath: 'project.json', eventsPath: 'events.jsonl' })
  } finally {
    if (oldGitDir === undefined) delete process.env.GIT_DIR; else process.env.GIT_DIR = oldGitDir
    if (oldPythonPath === undefined) delete process.env.PYTHONPATH; else process.env.PYTHONPATH = oldPythonPath
  }
  const gitCall = calls.find(call => call.file === '/usr/bin/git')
  const pythonCall = calls.find(call => call.file === '/usr/bin/python3')
  assert.equal(gitCall.env.GIT_DIR, undefined)
  assert.equal(gitCall.env.PYTHONPATH, undefined)
  assert.equal(pythonCall.env.GIT_DIR, undefined)
  assert.equal(pythonCall.env.PYTHONPATH, root)
  assert.equal(pythonCall.env.PYTHONNOUSERSITE, '1')
})

test('rejects a drifted Graph Harness runtime revision', async () => {
  const fakeExec = async () => ({ stdout: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n', stderr: '' })
  const service = new MediaGraphService(config({ runtimeRoot: '/tmp' }), { execFile: fakeExec })
  await assert.rejects(service.verifyRuntime(), /revision mismatch/)
})

test('integration: real Graph Harness exposes BRIEF flow and SOURCE readiness', { skip: !existsSync('/workspace/graph_harness') }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'media-graph-integration-'))
  const projectPath = join(root, 'project.json')
  const eventsPath = join(root, 'events.jsonl')
  const template = await readFile(new URL('../examples/media-production.graph.json', import.meta.url), 'utf8')
  await writeFile(projectPath, template)
  const { stdout } = await execFile('/usr/bin/git', ['-C', '/workspace', 'rev-parse', 'HEAD'])
  assert.equal(stdout.trim(), GRAPH_REVISION)

  const service = new MediaGraphService(config({ runtimeRoot: '/workspace', projectRoot: root }))
  const validated = await service.validate({ projectPath: 'project.json', eventsPath: 'events.jsonl' })
  assert.equal(validated.valid, true)
  assert.deepEqual(await service.readyNodes({ projectPath: 'project.json', eventsPath: 'events.jsonl' }), [])
  const evidence = await service.recordEvidence({ projectPath: 'project.json', eventsPath: 'events.jsonl', node: 'BRIEF', actor: 'spec-author', kind: 'brief_spec', result: 'PASS', artifact: '00_BRIEF/brief.md', sha256: 'a'.repeat(64), command: 'unit-test', commit: 'deadbeef' })
  await service.evaluateGate({ projectPath: 'project.json', eventsPath: 'events.jsonl', node: 'BRIEF', actor: 'reviewer', gate: 'brief_spec', result: 'PASS', evidenceIds: [evidence.event_id], note: 'brief is valid' })
  await service.recordApproval({ projectPath: 'project.json', eventsPath: 'events.jsonl', node: 'BRIEF', actor: 'human', scopeHash: 'b'.repeat(64), note: 'approved' })
  for (const [to, actor] of [['approved','human'], ['ready','leader'], ['running','producer'], ['review','producer'], ['done','reviewer']]) await service.transition({ projectPath: 'project.json', eventsPath: 'events.jsonl', node: 'BRIEF', actor, to, reason: `move to ${to}` })
  assert.deepEqual(await service.readyNodes({ projectPath: 'project.json', eventsPath: 'events.jsonl' }), ['SOURCE'])
  const state = await service.status({ projectPath: 'project.json', eventsPath: 'events.jsonl' })
  assert.equal(state.nodes.find(node => node.id === 'BRIEF').status, 'done')
})
