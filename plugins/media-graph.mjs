import { execFile as execFileCallback } from 'node:child_process'
import { access, lstat, realpath } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'

const execFileDefault = promisify(execFileCallback)
const SHA256_RE = /^[a-f0-9]{64}$/
const GIT_REV_RE = /^[a-f0-9]{40}$/
const EVENT_ID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
const IDENTIFIER_RE = /^[A-Za-z][A-Za-z0-9_-]{0,127}$/

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
    this.pythonExecutable = config.pythonExecutable || '/usr/bin/python3'
    this.gitExecutable = config.gitExecutable || '/usr/bin/git'
    if (!isAbsolute(this.pythonExecutable) || !isAbsolute(this.gitExecutable)) throw new MediaGraphError('media-graph requires absolute pythonExecutable and gitExecutable paths')
    this.moduleName = config.moduleName || 'graph_harness'
    if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(this.moduleName)) throw new MediaGraphError('moduleName is malformed')
    this.timeoutMs = config.timeoutMs || 30000
    this.maxBuffer = config.maxBuffer || 4 * 1024 * 1024
    this.execFile = options.execFile || execFileDefault
    this.enforcePinnedRevision = config.enforcePinnedRevision !== false
  }

  async runtimeInfo() {
    const actualRevision = await this.verifyRuntime()
    return { runtimeRoot: this.runtimeRoot, pinnedRevision: this.pinnedRevision, actualRevision, pythonExecutable: this.pythonExecutable, gitExecutable: this.gitExecutable, moduleName: this.moduleName, enforcePinnedRevision: this.enforcePinnedRevision }
  }

  async verifyRuntime() {
    await access(this.runtimeRoot)
    await access(this.gitExecutable)
    const { stdout } = await this._exec(this.gitExecutable, ['-C', this.runtimeRoot, 'rev-parse', 'HEAD'], { cwd: this.runtimeRoot, env: safeBaseEnv() })
    const actualRevision = stdout.trim()
    if (!GIT_REV_RE.test(actualRevision)) throw new MediaGraphError('Graph Harness runtime did not return a valid git revision', { actualRevision })
    if (this.enforcePinnedRevision && actualRevision !== this.pinnedRevision) throw new MediaGraphError('Graph Harness runtime revision mismatch', { expected: this.pinnedRevision, actual: actualRevision })
    return actualRevision
  }

  async validate(paths) { return this._run(paths, ['validate']) }
  async status(paths) { return this._run(paths, ['status']) }
  async readyNodes(paths) { const result = await this._run(paths, ['ready']); return result.ready_nodes || [] }

  async recordApproval(input) {
    assertIdentifier(input.node, 'node'); assertString(input.actor, 'actor'); assertSha256(input.scopeHash, 'scopeHash'); assertString(input.note, 'note')
    const args = ['record-approval', flag('node', input.node), flag('actor', input.actor), flag('scope-hash', input.scopeHash), flag('note', input.note)]
    appendExpectedEvent(args, input.expectedLastEventId)
    return this._run(input, args)
  }

  async recordEvidence(input) {
    assertIdentifier(input.node, 'node'); assertString(input.actor, 'actor'); assertIdentifier(input.kind, 'kind'); assertString(input.result, 'result'); assertString(input.artifact, 'artifact'); assertSha256(input.sha256, 'sha256'); assertString(input.command, 'command'); assertString(input.commit, 'commit')
    const args = ['record-evidence', flag('node', input.node), flag('actor', input.actor), flag('kind', input.kind), flag('result', input.result), flag('artifact', input.artifact), flag('sha256', input.sha256), flag('command-line', input.command), flag('commit', input.commit), flag('metadata-json', JSON.stringify(input.metadata || {}))]
    appendExpectedEvent(args, input.expectedLastEventId)
    return this._run(input, args)
  }

  async evaluateGate(input) {
    assertIdentifier(input.node, 'node'); assertString(input.actor, 'actor'); assertIdentifier(input.gate, 'gate'); assertString(input.note, 'note')
    if (!['PASS', 'FAIL', 'BLOCKED'].includes(input.result)) throw new MediaGraphError('gate result must be PASS, FAIL, or BLOCKED')
    if (!Array.isArray(input.evidenceIds) || input.evidenceIds.some(item => !EVENT_ID_RE.test(item))) throw new MediaGraphError('evidenceIds must be an array of event ids')
    const args = ['evaluate-gate', flag('node', input.node), flag('actor', input.actor), flag('gate', input.gate), flag('result', input.result)]
    if (input.evidenceIds.length > 0) args.push('--evidence', ...input.evidenceIds)
    args.push(flag('note', input.note))
    appendExpectedEvent(args, input.expectedLastEventId)
    return this._run(input, args)
  }

  async transition(input) {
    assertIdentifier(input.node, 'node'); assertString(input.actor, 'actor'); assertIdentifier(input.to, 'to'); assertString(input.reason, 'reason')
    const args = ['transition', flag('node', input.node), flag('actor', input.actor), flag('to', input.to), flag('reason', input.reason)]
    appendExpectedEvent(args, input.expectedLastEventId)
    return this._run(input, args)
  }

  async failAndRepair(input) {
    assertIdentifier(input.node, 'node'); assertString(input.actor, 'actor'); assertIdentifier(input.gate, 'gate'); assertString(input.reason, 'reason')
    const args = ['fail', flag('node', input.node), flag('actor', input.actor), flag('gate', input.gate), flag('reason', input.reason)]
    appendExpectedEvent(args, input.expectedLastEventId)
    return this._run(input, args)
  }

  async checkpoint(input) {
    assertString(input.actor, 'actor'); assertString(input.label, 'label'); assertString(input.commit, 'commit')
    const args = ['checkpoint', flag('actor', input.actor), flag('label', input.label), flag('commit', input.commit), flag('summary-json', JSON.stringify(input.evidenceSummary || {}))]
    appendExpectedEvent(args, input.expectedLastEventId)
    return this._run(input, args)
  }

  async _run(paths, commandArgs) {
    await this.verifyRuntime()
    const projectPath = this._projectPath(paths.projectPath)
    const eventsPath = this._eventsPath(paths.eventsPath)
    await this._assertCanonicalConfinement(projectPath, eventsPath)
    await access(this.pythonExecutable)
    const env = { ...safeBaseEnv(), PYTHONPATH: this.runtimeRoot, PYTHONNOUSERSITE: '1', PYTHONDONTWRITEBYTECODE: '1' }
    const args = ['-m', this.moduleName, flag('project', projectPath), flag('events', eventsPath), ...commandArgs]
    const { stdout } = await this._exec(this.pythonExecutable, args, { cwd: this.runtimeRoot, env })
    return parseJsonOutput(stdout)
  }

  _projectPath(value) { const path = this._pathWithinRoot(value, 'projectPath'); if (!path.endsWith('.json')) throw new MediaGraphError('projectPath must point to a .json project definition'); return path }
  _eventsPath(value) { const path = this._pathWithinRoot(value, 'eventsPath'); if (!path.endsWith('.jsonl')) throw new MediaGraphError('eventsPath must point to a .jsonl event store'); return path }

  _pathWithinRoot(value, label) {
    assertString(value, label)
    const candidate = resolve(this.projectRoot, value)
    assertContainedLexically(this.projectRoot, candidate, label, value)
    return candidate
  }

  async _assertCanonicalConfinement(projectPath, eventsPath) {
    const rootReal = await realpath(this.projectRoot)
    const projectReal = await realpath(projectPath)
    assertContainedLexically(rootReal, projectReal, 'projectPath', projectPath)
    const eventsStat = await lstatIfExists(eventsPath)
    if (eventsStat?.isSymbolicLink()) throw new MediaGraphError('eventsPath must not be a symbolic link', { value: eventsPath })
    const eventsReal = await realpathIfExists(eventsPath)
    if (eventsReal) assertContainedLexically(rootReal, eventsReal, 'eventsPath', eventsPath)
    else {
      const parentReal = await realpath(dirname(eventsPath))
      assertContainedLexically(rootReal, parentReal, 'eventsPath parent', dirname(eventsPath), true)
    }
  }

  async _exec(file, args, options) {
    try { return await this.execFile(file, args, { ...options, timeout: this.timeoutMs, maxBuffer: this.maxBuffer, windowsHide: true }) }
    catch (error) { throw new MediaGraphError('Graph Harness command failed', { executable: file, argumentCount: args.length, code: error.code, signal: error.signal, stdout: typeof error.stdout === 'string' ? error.stdout.slice(-4000) : '', stderr: typeof error.stderr === 'string' ? error.stderr.slice(-4000) : '' }) }
  }
}

export function apply(ctx, config) {
  if (!ctx || typeof ctx.provide !== 'function') throw new MediaGraphError('media-graph requires a Cordis context with ctx.provide()')
  ctx.provide('mediaGraph', new MediaGraphService(config))
}

function safeBaseEnv() {
  const env = {}
  for (const key of ['PATH', 'HOME', 'LANG', 'LC_ALL', 'TMPDIR']) if (process.env[key]) env[key] = process.env[key]
  return env
}
function flag(name, value) { return `--${name}=${String(value)}` }
function appendExpectedEvent(args, eventId) { if (eventId === undefined || eventId === null || eventId === '') return; if (!EVENT_ID_RE.test(eventId)) throw new MediaGraphError('expectedLastEventId is malformed'); args.push(flag('expected-last-event-id', eventId)) }
function assertString(value, label) { if (typeof value !== 'string' || value.trim() === '') throw new MediaGraphError(`${label} must be a non-empty string`) }
function assertIdentifier(value, label) { if (!IDENTIFIER_RE.test(value || '')) throw new MediaGraphError(`${label} must be a safe identifier`) }
function assertSha256(value, label) { if (!SHA256_RE.test(value || '')) throw new MediaGraphError(`${label} must be a lowercase SHA-256`) }
function assertContainedLexically(root, candidate, label, original, allowRoot = false) { const rel = relative(root, candidate); if ((!allowRoot && rel === '') || rel === '..' || rel.startsWith(`..${sep}`)) throw new MediaGraphError(`${label} escapes projectRoot`, { value: original }) }
async function realpathIfExists(path) { try { return await realpath(path) } catch (error) { if (error && error.code === 'ENOENT') return null; throw error } }
async function lstatIfExists(path) { try { return await lstat(path) } catch (error) { if (error && error.code === 'ENOENT') return null; throw error } }
function parseJsonOutput(stdout) {
  const lines = String(stdout || '').trim().split(/\r?\n/).filter(Boolean)
  for (let index = lines.length - 1; index >= 0; index -= 1) { try { return JSON.parse(lines[index]) } catch {} }
  throw new MediaGraphError('Graph Harness command produced no valid JSON output', { outputTail: lines.slice(-10).join('\n') })
}
