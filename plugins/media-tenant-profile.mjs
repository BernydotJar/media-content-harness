import { authorizeBrowserSource, resolveBrowserPolicy } from './media-browser-policy.mjs'

export const name = 'media-tenant-profile'

const SECRET_KEY_RE = /(^|_)(access[_-]?token|authorization[_-]?header|cookie|credentials?|password|secret|session|storage[_-]?state|websocket[_-]?debugger[_-]?url)($|_)/i
const ID_RE = /^[a-z0-9][a-z0-9-]{1,63}$/
const OPAQUE_REF_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/
const SOURCE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/

export class TenantMediaProfileError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'TenantMediaProfileError'
    this.details = details
  }
}

export function validateTenantMediaProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TenantMediaProfileError('tenant profile must be an object')
  rejectSecretFields(input)
  if (input.schema_version !== 'tenant-media-profile.v1') throw new TenantMediaProfileError('unsupported tenant profile schema_version')
  if (!ID_RE.test(input.tenant_id || '')) throw new TenantMediaProfileError('tenant_id is malformed')
  if (!ID_RE.test(input.runtime_namespace || '')) throw new TenantMediaProfileError('runtime_namespace is malformed')
  if (!OPAQUE_REF_RE.test(input.browser_context_ref || '')) throw new TenantMediaProfileError('browser_context_ref must be an opaque identifier, not a path or credential')
  if (typeof input.organization !== 'string' || input.organization.trim() === '') throw new TenantMediaProfileError('organization is required')
  if (!['community', 'public-affairs', 'commercial', 'nonprofit', 'media'].includes(input.content_context)) throw new TenantMediaProfileError('content_context is invalid')
  validateAudiencePolicy(input.audience_policy)
  validateBrand(input.brand)
  const sources = validateSources(input.sources)
  validateProductionDefaults(input.production_defaults)
  return Object.freeze({
    schema_version: input.schema_version,
    tenant_id: input.tenant_id,
    organization: input.organization,
    territory: input.territory ?? null,
    runtime_namespace: input.runtime_namespace,
    browser_context_ref: input.browser_context_ref,
    content_context: input.content_context,
    audience_policy: Object.freeze({ ...input.audience_policy }),
    brand: Object.freeze({ ...input.brand }),
    sources: Object.freeze(sources),
    production_defaults: Object.freeze({ ...input.production_defaults, duration_seconds: Object.freeze([...input.production_defaults.duration_seconds]) }),
  })
}

export function assertTenantIsolation(profiles) {
  if (!Array.isArray(profiles) || profiles.length === 0) throw new TenantMediaProfileError('profiles must be a non-empty array')
  const validated = profiles.map(validateTenantMediaProfile)
  assertUnique(validated, 'tenant_id')
  assertUnique(validated, 'runtime_namespace')
  assertUnique(validated, 'browser_context_ref')
  return true
}

function validateAudiencePolicy(policy) {
  if (!policy || typeof policy !== 'object') throw new TenantMediaProfileError('audience_policy is required')
  if (policy.mode !== 'general-audience') throw new TenantMediaProfileError('audience_policy.mode must be general-audience')
  if (policy.sensitive_trait_targeting !== false) throw new TenantMediaProfileError('sensitive-trait targeting is not supported')
  if (policy.voter_microtargeting !== false) throw new TenantMediaProfileError('voter microtargeting is not supported')
}

function validateBrand(brand) {
  if (!brand || typeof brand !== 'object') throw new TenantMediaProfileError('brand is required')
  if (typeof brand.display_name !== 'string' || brand.display_name.trim() === '') throw new TenantMediaProfileError('brand.display_name is required')
}

function validateSources(sources) {
  if (!Array.isArray(sources) || sources.length === 0) throw new TenantMediaProfileError('sources must be non-empty')
  const policy = resolveBrowserPolicy({ failClosed: true, readOnly: true })
  const ids = new Set()
  return sources.map(source => {
    if (!source || typeof source !== 'object') throw new TenantMediaProfileError('source must be an object')
    if (!SOURCE_ID_RE.test(source.id || '')) throw new TenantMediaProfileError('source.id is malformed')
    if (ids.has(source.id)) throw new TenantMediaProfileError('source ids must be unique within a tenant')
    ids.add(source.id)
    if (!['explicit', 'persisted-authorized'].includes(source.authorization)) throw new TenantMediaProfileError('source.authorization is invalid')
    const grant = authorizeBrowserSource({
      locator: source.locator,
      authorization: { id: source.id, locator: source.locator, match: source.match, purpose: source.purpose },
      operation: 'discover-authorized-page',
    }, policy)
    return Object.freeze({ id: source.id, locator: grant.locator, authorization: source.authorization, match: grant.match, purpose: grant.purpose })
  })
}

function validateProductionDefaults(value) {
  if (!value || typeof value !== 'object') throw new TenantMediaProfileError('production_defaults is required')
  if (!['9:16', '1:1', '16:9'].includes(value.aspect_ratio)) throw new TenantMediaProfileError('production_defaults.aspect_ratio is invalid')
  if (!['weekly', 'on-demand'].includes(value.cadence)) throw new TenantMediaProfileError('production_defaults.cadence is invalid')
  if (!Array.isArray(value.duration_seconds) || value.duration_seconds.length !== 2 || value.duration_seconds.some(item => typeof item !== 'number' || item <= 0) || value.duration_seconds[0] > value.duration_seconds[1]) throw new TenantMediaProfileError('production_defaults.duration_seconds must be an ascending positive range')
}

function rejectSecretFields(value, path = '$') {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    const semanticSourceAuthorization = key === 'authorization' && path.startsWith('$.sources.') && path.split('.').length === 3 && Number.isInteger(Number(path.split('.')[2]))
    if ((key === 'authorization' && !semanticSourceAuthorization) || SECRET_KEY_RE.test(key)) throw new TenantMediaProfileError('tenant profile must not contain credentials or browser session material', { path: `${path}.${key}` })
    rejectSecretFields(child, `${path}.${key}`)
  }
}

function assertUnique(profiles, field) {
  const seen = new Set()
  for (const profile of profiles) {
    if (seen.has(profile[field])) throw new TenantMediaProfileError(`${field} must be isolated across tenants`, { value: profile[field] })
    seen.add(profile[field])
  }
}

export function apply(ctx, config = {}) {
  if (!ctx || typeof ctx.provide !== 'function') throw new TenantMediaProfileError('media-tenant-profile requires ctx.provide()')
  ctx.provide('mediaTenantProfiles', {
    validate: validateTenantMediaProfile,
    assertIsolation: assertTenantIsolation,
    policy: Object.freeze({ failClosed: config.failClosed !== false }),
  })
}
