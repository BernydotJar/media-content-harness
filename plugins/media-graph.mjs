import { execFile as execFileCallback } from 'node:child_process'
import { access } from 'node:fs/promises'
import { delimiter, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'

const execFileDefault = promisify(execFileCallback)
const SHA256_RE = /^[a-f0-9]{64}$/
const GIT_REV_RE = /^[a-f0-9]{40}$/
const EVENT_ID_RE = /^[0-9a-fA-F-]{16,}$/

export const name = 'media-graph'

export class MediaGraphError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'MediaGraphError'
    this.details = details
  }
}

export class MediaGraphService {
  constructor(config = {}, options = {}) {
    if (config.failClosed !== true) throw new MediaGraphError('media-graph requires failClosed=true')
    const runtimeRoot = config.runtimeRoot || process.env.GRAPH_HARNESS_RUNTIME_ROOT
    if (!runtimeRoot || typeof runtimeRoot !== 'string') throw new MediaGraphError('media-graph requires runtimeRoot or GRAPH_HARNESS_RUNTIME_ROOT')
    if (!config.projectRoot || typeof config.projectRoot !== 'string') throw new MediaGraphError('media-graph requires a non-empty projectRoot')
    if (!GIT_REV_RE.test(config.pinnedRevision || '')) throw new MediaGraphError('media-graph requires pinnedRevision as a 40-character git commit SHA')
    this.projectRoot = resolve(config.projectRoot)
    this.runtimeRoot = resolve(runtimeRoot)
    this.pinnedRevision = config.pinnedRevision
    this.pythonExecutable = config.pythonExecutable || 'python3'
    this.moduleName = config.moduleName || 'graph_harness'
    this.timeoutMs = config.timeoutMs || 30000
    this.maxBuffer = config.maxBuffer || 4 * 1024 * 1024
    this.execFile = options.execFile || execFileDefault
    this.enforcePinnedRevision = config.enforcePinnedRevision !== false
  }

  async runtimeInfo() {
    const actualRevision = await this.verifyRuntime()
    return { runtimeRoot: this.runtimeRoot, pinnedRevision: this.pinnedRevision, actualRevision, pythonExecutable: this.pythonExecutable, moduleName: this.moduleName, enforcePinnedRevision: this.enforcePinnedRevision }
  }

  async verifyRuntime() {
    await access(this.runtimeRoot)
    const { stdout } = await this._exec('git', ['-C', this.runtimeRoot, 'rev-parse', 'HEAD'], { cwd: this.runtimeRoot, env: process.env })
    const actualRevision = stdout.trim()
    if (!GIT_REV_RE.test(actualRevision)) throw new MediaGraphError('Graph Harness runtime did not return a valid git revision', { actualRevision })
    if (this.enforcePinnedRevision && actualRevision !== this.pinnedRevision) throw new MediaGraphError('Graph Harness runtime revision mismatch', { expected: this.pinnedRevision, actual: actualRevision })
    return actualRevision
  }

  async validate(paths) { return this._run(paths, ['validate']) }
  async status(paths) { return this._run(paths, ['status']) }
  async readyNodes(paths) { const result = await this._run(paths, ['ready']); return result.ready_nodes || [] }

  async recordApproval(input) {
    assertString(input.node, 'node'); assertString(input.actor, 'actor'); assertSha256(input.scopeHash, 'scopeHash'); assertString(input.note, 'note')
    const args = ['record-approval', '--node', input.node, '--actor', input.actor, '--scope-hash', input.scopeHash, '--note', input.note]
    appendExpectedEvent(args, input.expectedLastEventId)
    return this._run(input, args)
  }

  async recordEvidence(input) {
    assertString(input.node, 'node'); assertString(input.actor, 'actor'); assertString(input.kind, 'kind'); assertString(input.result, 'result'); assertString(input.artifact, 'artifact'); assertSha256(input.sha256, 'sha256'); assertString(input.command, 'command'); assertString(input.commit, 'commit')
    const args = ['record-evidence', '--node', input.node, '--actor', input.actor, '--kind', input.kind, '--result', input.result, '--artifact', input.artifact, '--sha256', input.sha256, '--command-line', input.command, '--commit', input.commit, '--metadata-json', JSON.stringify(input.metadata || {})]
    appendExpectedEvent(args, input.expectedLastEventId)
    return this._run(input, args)
  }

  async evaluateGate(input) {
    assertString(input.node, 'node'); assertString(input.actor, 'actor'); assertString(input.gate, 'gate'); assertString(input.note, 'note')
    if (!['PASS', 'FAIL', 'BLOCKED'].includes(input.result)) throw new MediaGraphError('gate result must be PASS, FAIL, or BLOCKED')
    if (!Array.isArray(input.evidenceIds) || input.evidenceIds.some(item => typeof item !== 'string')) throw new MediaGraphError('evidenceIds must be an array of strings')
    const args = ['evaluate-gate', '--node', input.node, '--actor', input.actor, '--gate', input.gate, '--result', input.result, '--evidence', ...input.evidenceIds, '--note', input.note]
    appendExpectedEvent(args, input.expectedLastEventId)
    return this._run(input, args)
  }

  async transition(input) {
    assertString(input.node, 'node'); assertString(input.actor, 'actor'); assertString(input.to, 'to'); assertString(input.reason, 'reason')
    const args = ['transition', '--node', input.node, '--actor', input.actor, '--to', input.to, '--reason', input.reason]
    appendExpectedEvent(args, input.expectedLastEventId)
    return this._run(input, args)
  }

  async failAndRepair(input) {
    assertString(input.node, 'node'); assertString(input.actor, 'actor'); assertString(input.gate, 'gate'); assertString(input.reason, 'reason')
    const args = ['fail', '--node', input.node, '--actor', input.actor, '--gate', input.gate, '--reason', input.reason]
    appendExpectedEvent(args, input.expectedLastEventId)
    return this._run(input, args)
  }

  async checkpoint(input) {
    assertString(input.actor, 'actor'); assertString(input.label, 'label'); assertString(input.commit, 'commit')
    const args = ['checkpoint', '--actor', input.actor, '--label', input.label, '--commit', input.commit, '--summary-json', JSON.stringify(input.evidenceSummary || {})]
    appendExpectedEvent(args, input.expectedLastEventId)
    return this._run(input, args)
  }

  async _run(paths, commandArgs) {
    await this.verifyRuntime()
    const projectPath = this._projectPath(paths.projectPath)
    const eventsPath = this._eventsPath(paths.eventsPath)
    const pythonPath = [this.runtimeRoot, process.env.PYTHONPATH].filter(Boolean).join(delimiter)
    const args = ['-m', this.moduleName, '--project', projectPath, '--events', eventsPath, ...commandArgs]
    const { stdout } = await this._exec(this.pythonExecutable, args, { cwd: this.runtimeRoot, env: { ...process.env, PYTHONPATH: pythonPath } })
    return parseLastJsonLine(stdout)
  }

  _projectPath(value) { const path = this._pathWithinRoot(value, 'projectPath'); if (!path.endsWith('.json')) throw new MediaGraphError('projectPath must point to a .json project definition'); return path }
  _eventsPath(value) { const path = this._pathWithinRoot(value, 'eventsPath'); if (!path.endsWith('.jsonl')) throw new MediaGraphError('eventsPath must point to a .jsonl event store'); return path }

  _pathWithinRoot(value, label) {
    assertString(value, label)
    const candidate = resolve(this.projectRoot, value)
    const rel = relative(this.projectRoot, candidate)
    if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`)) {
      const suffix = rel === '' ? 'must be a file below projectRoot' : 'escapes projectRoot'
      throw new MediaGraphError(`${label} ${suffix}`, { value })
    }
    return candidate
  }

  async _exec(file, args, options) {
    try { return await this.execFile(file, args, { ...options, timeout: this.timeoutMs, maxBuffer: this.maxBuffer, windowsHide: true }) }
    catch (error) { throw new MediaGraphError('Graph Harness command failed', { file, args, code: error.code, signal: error.signal, stdout: typeof error.stdout === 'string' ? error.stdout.slice(-4000) : '', stderr: typeof error.stderr === 'string' ? error.stderr.slice(-4000) : '' }) }
  }
}

export function apply(ctx, config) {
  if (!ctx || typeof ctx.provide !== 'function') throw new MediaGraphError('media-graph requires a Cordis context with ctx.provide()')
  ctx.provide('mediaGraph', new MediaGraphService(config))
}

function appendExpectedEvent(args, eventId) {
  if (eventId === undefined || eventId === null || eventId === '') return
  if (!EVENT_ID_RE.test(eventId)) throw new MediaGraphError('expectedLastEventId is malformed')
  args.push('--expected-last-event-id', eventId)
}
function assertString(value, label) { if (typeof value !== 'string' || value.trim() === '') throw new MediaGraphError(`${label} must be a non-empty string`) }
function assertSha256(value, label) { if (!SHA256_RE.test(value || '')) throw new MediaGraphError(`${label} must be a lowercase SHA-256`) }
function parseLastJsonLine(stdout) {
  const lines = String(stdout || '').trim().split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) throw new MediaGraphError('Graph Harness command produced no JSON output')
  try { return JSON.parse(lines.at(-1)) }
  catch (error) { throw new MediaGraphError('Graph Harness output was not valid JSON', { output: lines.at(-1), cause: error.message }) }
}
