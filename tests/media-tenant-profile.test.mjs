import assert from 'node:assert/strict'
import test from 'node:test'

import { TenantMediaProfileError, apply, assertTenantIsolation, validateTenantMediaProfile } from '../plugins/media-tenant-profile.mjs'

function profile(overrides = {}) {
  return {
    schema_version: 'tenant-media-profile.v1',
    tenant_id: 'tenant-a',
    organization: 'Tenant A',
    territory: 'Example Territory',
    runtime_namespace: 'tenant-a',
    browser_context_ref: 'tenant-a-browser',
    content_context: 'community',
    audience_policy: { mode: 'general-audience', sensitive_trait_targeting: false, voter_microtargeting: false },
    brand: { display_name: 'Tenant A', logo_asset_key: 'brand/logo', mascot_asset_key: null, visual_language: 'warm documentary' },
    sources: [{ id: 'source-a', locator: 'https://example.com/source-a/', authorization: 'explicit', match: 'exact', purpose: 'source' }],
    production_defaults: { aspect_ratio: '9:16', cadence: 'weekly', duration_seconds: [8, 25] },
    ...overrides,
  }
}

test('accepts a reusable general-audience tenant profile', () => {
  const result = validateTenantMediaProfile(profile())
  assert.equal(result.tenant_id, 'tenant-a')
  assert.equal(result.sources[0].locator, 'https://example.com/source-a/')
  assert.equal(result.audience_policy.mode, 'general-audience')
})

test('rejects raw credentials and browser session material at any depth', () => {
  for (const bad of [
    { password: 'secret' },
    { access_token: 'secret' },
    { cookie: 'secret' },
    { webSocketDebuggerUrl: 'ws://secret' },
    { nested: { session: 'secret' } },
  ]) {
    assert.throws(() => validateTenantMediaProfile({ ...profile(), ...bad }), /must not contain credentials or browser session material/)
  }
})

test('browser context references are opaque and tenant-owned', () => {
  assert.throws(() => validateTenantMediaProfile(profile({ browser_context_ref: '/Users/demo/profile' })), /opaque identifier/)
  assert.throws(() => assertTenantIsolation([
    profile(),
    profile({ tenant_id: 'tenant-b', organization: 'Tenant B', runtime_namespace: 'tenant-b', browser_context_ref: 'tenant-a-browser' }),
  ]), /browser_context_ref must be isolated across tenants/)
})

test('runtime namespaces and tenant IDs cannot collide', () => {
  assert.throws(() => assertTenantIsolation([
    profile(),
    profile({ organization: 'Duplicate', browser_context_ref: 'tenant-b-browser' }),
  ]), /tenant_id must be isolated across tenants/)
  assert.throws(() => assertTenantIsolation([
    profile(),
    profile({ tenant_id: 'tenant-b', organization: 'Tenant B', browser_context_ref: 'tenant-b-browser' }),
  ]), /runtime_namespace must be isolated across tenants/)
})

test('public-affairs profiles remain general-audience and cannot enable voter microtargeting', () => {
  const publicProfile = validateTenantMediaProfile(profile({ content_context: 'public-affairs' }))
  assert.equal(publicProfile.audience_policy.mode, 'general-audience')
  assert.throws(() => validateTenantMediaProfile(profile({
    content_context: 'public-affairs',
    audience_policy: { mode: 'general-audience', sensitive_trait_targeting: false, voter_microtargeting: true },
  })), /voter microtargeting is not supported/)
  assert.throws(() => validateTenantMediaProfile(profile({
    content_context: 'public-affairs',
    audience_policy: { mode: 'segment', sensitive_trait_targeting: false, voter_microtargeting: false },
  })), /must be general-audience/)
})

test('source authorization is explicit, unique, and secret-free', () => {
  assert.throws(() => validateTenantMediaProfile(profile({ sources: [
    { id: 'same', locator: 'https://example.com/a/', authorization: 'explicit', match: 'exact', purpose: 'source' },
    { id: 'same', locator: 'https://example.com/b/', authorization: 'explicit', match: 'exact', purpose: 'source' },
  ] })), /source ids must be unique/)
  assert.throws(() => validateTenantMediaProfile(profile({ sources: [
    { id: 'tokenized', locator: 'https://example.com/a/?token=secret', authorization: 'explicit', match: 'exact', purpose: 'source' },
  ] })), /sensitive query parameter/)
})

test('production defaults require an ascending positive duration range', () => {
  assert.throws(() => validateTenantMediaProfile(profile({ production_defaults: { aspect_ratio: '9:16', cadence: 'weekly', duration_seconds: [25, 8] } })), /ascending positive range/)
})

test('registers tenant service through Cordis provide', () => {
  let provided
  apply({ provide(key, value) { provided = { key, value } } }, { failClosed: true })
  assert.equal(provided.key, 'mediaTenantProfiles')
  assert.equal(typeof provided.value.validate, 'function')
  assert.ok(TenantMediaProfileError)
})

test('authorization is semantic only inside a declared source record', () => {
  assert.throws(() => validateTenantMediaProfile({ ...profile(), authorization: 'unexpected' }), /must not contain credentials or browser session material/)
  assert.throws(() => validateTenantMediaProfile({ ...profile(), brand: { ...profile().brand, authorization: 'unexpected' } }), /must not contain credentials or browser session material/)
})

test('two distinct tenants can safely share the reusable engine', () => {
  const tenantA = profile()
  const tenantB = profile({
    tenant_id: 'tenant-b',
    organization: 'Tenant B',
    runtime_namespace: 'tenant-b',
    browser_context_ref: 'tenant-b-browser',
    sources: [{ id: 'source-b', locator: 'https://example.com/source-b/', authorization: 'explicit', match: 'exact', purpose: 'source' }],
  })
  assert.equal(assertTenantIsolation([tenantA, tenantB]), true)
})
