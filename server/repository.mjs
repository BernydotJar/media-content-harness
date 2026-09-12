import { mkdir, open, readFile, rename, realpath, lstat } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { invariant } from './errors.mjs'
const queues = new Map()
const listeners = new Map()
const emptyState = () => ({ version: 1, tenants: {}, onboarding: {}, dna: {}, observations: {}, plans: {}, jobs: {}, releases: {}, sessions: {}, events: [], memberships: {} })
export class AtomicRepository {
  constructor(root) { invariant(typeof root === 'string' && root.startsWith('/'), 'CONFIGURATION_REQUIRED', 'Durable storage must be configured', 503); this.root = resolve(root); this.file = join(this.root, 'state.json') }
  subscribe(fn) { const set=listeners.get(this.file)||new Set();set.add(fn);listeners.set(this.file,set);return ()=>{set.delete(fn);if(!set.size)listeners.delete(this.file)} }
  async init() { await mkdir(this.root, { recursive: true, mode: 0o700 }); invariant((await realpath(this.root)) === this.root, 'UNSAFE_STORAGE', 'Storage location is unavailable', 503); const stat = await lstat(this.file).catch(e => e.code === 'ENOENT' ? null : Promise.reject(e)); invariant(!stat?.isSymbolicLink(), 'UNSAFE_STORAGE', 'Storage location is unavailable', 503) }
  async read() { await this.init(); try { const state = JSON.parse(await readFile(this.file, 'utf8')); invariant(state && state.version === 1 && ['tenants','onboarding','dna','observations','plans','jobs','releases','sessions','memberships'].every(k=>state[k] && typeof state[k]==='object' && !Array.isArray(state[k])) && Array.isArray(state.events), 'STORAGE_UNAVAILABLE', 'Stored data could not be loaded', 503); return state } catch (e) { if (e.code === 'ENOENT') return emptyState(); throw e } }
  async transact(fn) {
    const previous = queues.get(this.file) || Promise.resolve()
    const operation = previous.catch(() => {}).then(async () => { const state = await this.read(); const result = await fn(state); const temp = join(this.root, '.state-' + randomUUID() + '.tmp'); const fd = await open(temp, 'wx', 0o600); try { await fd.writeFile(JSON.stringify(state)); await fd.sync() } finally { await fd.close() }; await rename(temp, this.file); const directory = await open(this.root, 'r'); try { await directory.sync() } finally { await directory.close() }; for(const notify of listeners.get(this.file)||[]) { try { notify() } catch {} }; return structuredClone(result) })
    queues.set(this.file, operation); try { return await operation } finally { if (queues.get(this.file) === operation) queues.delete(this.file) }
  }
}
export function newState() { return emptyState() }
