export const name = 'media-browser-policy'

const CANONICAL_ALLOWED = ['discover-authorized-page', 'inspect-main-content', 'capture-main-evidence']
const CANONICAL_DENIED = ['navigate', 'evaluate-script', 'click', 'type', 'submit', 'download', 'cookie-read', 'storage-read', 'message', 'comment', 'react', 'publish']
const SENSITIVE_QUERY_KEYS = /^(access[_-]?token|auth|authorization|key|password|session|sig|signature|token)$/i

export class MediaBrowserPolicyError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'MediaBrowserPolicyError'
    this.details = details
  }
}

export function resolveBrowserPolicy(config = {}) {
  if (config.failClosed !== true) throw new MediaBrowserPolicyError('browser policy requires failClosed=true')
  if (config.readOnly !== true) throw new MediaBrowserPolicyError('browser policy requires readOnly=true')
  const allowedOperations = config.allowedOperations || CANONICAL_ALLOWED
  const extraDenied = config.deniedOperations || []
  if (!Array.isArray(allowedOperations) || allowedOperations.length === 0) throw new MediaBrowserPolicyError('allowedOperations must be non-empty')
  if (allowedOperations.some(item => !CANONICAL_ALLOWED.includes(item))) throw new MediaBrowserPolicyError('allowedOperations may only narrow the canonical read-only allowlist')
  if (!Array.isArray(extraDenied)) throw new MediaBrowserPolicyError('deniedOperations must be an array')
  const deniedOperations = [...new Set([...CANONICAL_DENIED, ...extraDenied])]
  if (allowedOperations.some(item => deniedOperations.includes(item))) throw new MediaBrowserPolicyError('browser operation cannot be both allowed and denied')
  return Object.freeze({ failClosed: true, readOnly: true, allowedOperations: [...allowedOperations], deniedOperations: [...deniedOperations] })
}

export function authorizeBrowserSource(input = {}, policy = resolveBrowserPolicy({ failClosed: true, readOnly: true })) {
  if (!input.authorization || typeof input.authorization !== 'object') throw new MediaBrowserPolicyError('explicit source authorization is required')
  const locator = normalizeUrl(input.locator, 'locator')
  const authorized = normalizeUrl(input.authorization.locator, 'authorization.locator')
  const match = input.authorization.match || 'exact'
  if (!['exact', 'prefix'].includes(match)) throw new MediaBrowserPolicyError('authorization.match must be exact or prefix')
  const inScope = match === 'exact' ? locator === authorized : isBoundedPrefix(locator, authorized)
  if (!inScope) throw new MediaBrowserPolicyError('locator is outside explicit authorization scope')
  if (!policy.allowedOperations.includes(input.operation)) throw new MediaBrowserPolicyError('browser operation is not allowed', { operation: input.operation })
  if (policy.deniedOperations.includes(input.operation)) throw new MediaBrowserPolicyError('browser operation is explicitly denied', { operation: input.operation })
  const authorizationId = input.authorization.id
  if (typeof authorizationId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(authorizationId)) throw new MediaBrowserPolicyError('authorization.id is malformed')
  const purpose = input.authorization.purpose || 'reference'
  if (!['reference', 'source'].includes(purpose)) throw new MediaBrowserPolicyError('authorization.purpose must be reference or source')
  return Object.freeze({
    authorizationId,
    locator,
    match,
    operation: input.operation,
    purpose,
    readOnly: true,
  })
}

export function sanitizeBrowserObservation(input = {}) {
  if (!input.authorizationId || !input.locator) throw new MediaBrowserPolicyError('observation requires authorizationId and locator')
  const text = typeof input.text === 'string' ? input.text.slice(0, 20000) : ''
  const articles = Array.isArray(input.articles) ? input.articles.slice(0, 30).map(item => ({ text: String(item.text || '').slice(0, 4000) })) : []
  return Object.freeze({ authorizationId: input.authorizationId, locator: normalizeUrl(input.locator, 'locator'), text, articles, evidenceSha256: validSha(input.evidenceSha256) })
}

function normalizeUrl(value, label) {
  let url
  try { url = new URL(value) } catch { throw new MediaBrowserPolicyError(`${label} must be a valid URL`) }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new MediaBrowserPolicyError(`${label} must be a public http(s) URL without credentials`)
  for (const key of url.searchParams.keys()) {
    if (SENSITIVE_QUERY_KEYS.test(key)) throw new MediaBrowserPolicyError(`${label} contains a sensitive query parameter`)
  }
  url.hash = ''
  return url.href
}

function isBoundedPrefix(locator, authorized) {
  const candidate = new URL(locator)
  const scope = new URL(authorized)
  if (candidate.origin !== scope.origin) return false
  const basePath = scope.pathname.endsWith('/') ? scope.pathname : `${scope.pathname}/`
  return candidate.pathname === scope.pathname || candidate.pathname.startsWith(basePath)
}

function validSha(value) {
  if (value === undefined || value === null || value === '') return null
  if (!/^[a-f0-9]{64}$/.test(value)) throw new MediaBrowserPolicyError('evidenceSha256 must be lowercase SHA-256')
  return value
}

export function apply(ctx, config) {
  if (!ctx || typeof ctx.provide !== 'function') throw new MediaBrowserPolicyError('media-browser-policy requires ctx.provide()')
  ctx.provide('mediaBrowserPolicy', resolveBrowserPolicy(config))
}
