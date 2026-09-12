import { readFile } from 'node:fs/promises'
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { invariant, boundedText, ProductError } from './errors.mjs'
const scrypt = promisify(scryptCallback)
const tokenHash = token => createHash('sha256').update(token).digest('hex')
export class AuthService {
  constructor({ repository, identityFile, operatorUsername, operatorPasswordVerifier, clock = () => Date.now() }) { this.repository = repository; this.identityFile = identityFile; this.operatorUsername = operatorUsername; this.operatorPasswordVerifier = operatorPasswordVerifier; this.clock = clock; this.attempts = new Map(); this.globalAttempts = { count: 0, until: 0 }; this.activeLogins = 0 }
  async identities() {
    if (this.identityFile) { let value; try { value = JSON.parse(await readFile(this.identityFile, 'utf8')) } catch { throw new ProductError('AUTH_UNAVAILABLE', 'Authentication configuration is unavailable', 503) }; invariant(Array.isArray(value.users), 'AUTH_UNAVAILABLE', 'Authentication configuration is unavailable', 503); return value.users }
    if (this.operatorUsername && this.operatorPasswordVerifier && /^[a-f0-9]{32}:[a-f0-9]{64}$/.test(this.operatorPasswordVerifier)) { const [salt, hash] = this.operatorPasswordVerifier.split(':'); return [{ id: 'host-operator', email: this.operatorUsername, name: 'Operator', password: { salt, hash }, can_create_tenants: true, memberships: [] }] }
    throw new ProductError('AUTH_UNAVAILABLE', 'An operator must configure authentication before sign-in', 503)
  }
  async login(input, attemptKey = 'global') {
    const identifier = boundedText(input.email ?? input.username, 'Username', 254).toLowerCase(); const password = input.password; invariant(typeof password === 'string' && password.length > 0 && password.length <= 1024, 'INVALID_INPUT', 'Password is required')
    const now = this.clock(); if (now > this.globalAttempts.until) this.globalAttempts = { count: 0, until: now + 60_000 }; invariant(this.globalAttempts.count < 100 && this.activeLogins < 4, 'RATE_LIMITED', 'Too many sign-in attempts; try again later', 429); this.globalAttempts.count++; const key = String(attemptKey).slice(0,100) + ':' + identifier; const prior = this.attempts.get(key) || { count: 0, until: now + 15 * 60_000 }
    if (now > prior.until) { prior.count = 0; prior.until = now + 15 * 60_000 }; invariant(prior.count < 10, 'RATE_LIMITED', 'Too many sign-in attempts; try again later', 429); prior.count++; this.attempts.set(key, prior); if (this.attempts.size > 1000) this.attempts.delete(this.attempts.keys().next().value)
    this.activeLogins++; try {
    const users = await this.identities(); const user = users.find(u => String(u.email ?? u.username).toLowerCase() === identifier && u.disabled !== true); const record = user?.password
    const validRecord = record && /^[a-f0-9]{32,128}$/.test(record.salt) && /^(?:[a-f0-9]{64}|[a-f0-9]{128})$/.test(record.hash)
    const expected = validRecord ? Buffer.from(record.hash, 'hex') : Buffer.alloc(64); const actual = await scrypt(password, validRecord ? Buffer.from(record.salt, 'hex') : Buffer.alloc(24), expected.length, { N:16384,r:8,p:1 })
    invariant(validRecord && timingSafeEqual(actual, expected), 'INVALID_CREDENTIALS', 'Invalid username or password', 401); this.attempts.delete(key)
    const token = randomBytes(32).toString('hex'); await this.repository.transact(state => { for (const [id, session] of Object.entries(state.sessions)) if (session.expires_at <= now) delete state.sessions[id]; state.sessions[tokenHash(token)] = { user_id: user.id, credential_hash: tokenHash(record.salt + ':' + record.hash), expires_at: now + 12 * 60 * 60_000 }; return null }); return { token, user: await this.resolve(token) }
    } finally { this.activeLogins-- }
  }
  async resolve(token) { invariant(typeof token === 'string' && /^[a-f0-9]{64}$/.test(token), 'UNAUTHENTICATED', 'Sign in to continue', 401); const state = await this.repository.read(); const session = state.sessions[tokenHash(token)]; invariant(session && session.expires_at > this.clock(), 'UNAUTHENTICATED', 'Session expired; sign in again', 401); const user = (await this.identities()).find(u => u.id === session.user_id && u.disabled !== true); invariant(user && tokenHash(user.password.salt + ':' + user.password.hash) === session.credential_hash, 'UNAUTHENTICATED', 'Session expired; sign in again', 401); return { id:user.id, name:user.name || user.email || user.username, email:user.email || user.username, can_create_tenants:user.can_create_tenants === true, memberships: mergeMemberships(user.memberships || [], state.memberships[user.id] || []) } }
  async logout(token) { if (typeof token === 'string') await this.repository.transact(s => { delete s.sessions[tokenHash(token)]; return null }) }
}
function mergeMemberships(configured, created) { const merged = new Map(); for (const item of [...created, ...configured]) if (item && typeof item.tenant_id === 'string' && ['owner','admin','editor','reviewer','viewer'].includes(item.role)) merged.set(item.tenant_id, { tenant_id:item.tenant_id, role:item.role }); return [...merged.values()] }
