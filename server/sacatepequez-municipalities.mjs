import { randomUUID } from 'node:crypto'

export const SACATEPEQUEZ_MUNICIPALITIES = Object.freeze([
  { municipality: 'Antigua Guatemala', canonical_tenant_id: 'firmes-antigua-guatemala', legacy_tenant_ids: ['caballito'] },
  { municipality: 'Jocotenango', canonical_tenant_id: 'firmes-jocotenango' },
  { municipality: 'Pastores', canonical_tenant_id: 'firmes-pastores' },
  { municipality: 'Sumpango', canonical_tenant_id: 'firmes-sumpango' },
  { municipality: 'Santo Domingo Xenacoj', canonical_tenant_id: 'firmes-santo-domingo-xenacoj' },
  { municipality: 'Santiago Sacatepéquez', canonical_tenant_id: 'firmes-santiago-sacatepequez' },
  { municipality: 'San Bartolomé Milpas Altas', canonical_tenant_id: 'firmes-san-bartolome-milpas-altas' },
  { municipality: 'San Lucas Sacatepéquez', canonical_tenant_id: 'firmes-san-lucas-sacatepequez' },
  { municipality: 'Santa Lucía Milpas Altas', canonical_tenant_id: 'firmes-santa-lucia-milpas-altas' },
  { municipality: 'Magdalena Milpas Altas', canonical_tenant_id: 'firmes-magdalena-milpas-altas' },
  { municipality: 'Santa María de Jesús', canonical_tenant_id: 'firmes-santa-maria-de-jesus' },
  { municipality: 'Ciudad Vieja', canonical_tenant_id: 'firmes-ciudad-vieja' },
  { municipality: 'San Miguel Dueñas', canonical_tenant_id: 'firmes-san-miguel-duenas' },
  { municipality: 'Alotenango', canonical_tenant_id: 'firmes-alotenango' },
  { municipality: 'San Antonio Aguas Calientes', canonical_tenant_id: 'firmes-san-antonio-aguas-calientes' },
  { municipality: 'Santa Catarina Barahona', canonical_tenant_id: 'firmes-santa-catarina-barahona' },
])

const normalized = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLowerCase()
  .replace(/^la\s+/, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const tenantValues = state => [...Object.values(state.tenants || {}), ...Object.values(state.onboarding || {})]

function resolveTenant(state, entry) {
  for (const id of entry.legacy_tenant_ids || []) {
    const existing = state.tenants?.[id] || state.onboarding?.[id]
    if (existing) return existing
  }
  const canonical = state.tenants?.[entry.canonical_tenant_id] || state.onboarding?.[entry.canonical_tenant_id]
  if (canonical) return canonical
  const wanted = normalized(entry.municipality)
  return tenantValues(state).find(tenant => normalized(tenant.territory) === wanted) || null
}

function profileFor(entry) {
  const id = entry.canonical_tenant_id
  const organization = 'FIRMES ' + entry.municipality
  return {
    schema_version: 'tenant-media-profile.v1', tenant_id: id, organization, territory: entry.municipality,
    runtime_namespace: id, browser_context_ref: id + '-browser', content_context: 'community',
    audience_policy: { mode: 'general-audience', sensitive_trait_targeting: false, voter_microtargeting: false },
    brand: { display_name: organization, visual_language: 'FIRMES burgundy, community-first' }, sources: [],
    production_defaults: { aspect_ratio: '9:16', cadence: 'weekly', duration_seconds: [8, 25] },
  }
}

export function sacatepequezMunicipalities(state) {
  return SACATEPEQUEZ_MUNICIPALITIES.map(entry => {
    const tenant = resolveTenant(state, entry)
    return { tenant_id: tenant?.tenant_id || entry.canonical_tenant_id, municipality: entry.municipality, organization: tenant?.organization || ('FIRMES ' + entry.municipality) }
  })
}

export function ensureSacatepequezTenant(state, tenantId, configuredUsers = []) {
  const entry = SACATEPEQUEZ_MUNICIPALITIES.find(item => {
    const tenant = resolveTenant(state, item)
    return (tenant?.tenant_id || item.canonical_tenant_id) === tenantId
  })
  if (!entry) return null
  let tenant = resolveTenant(state, entry)
  if (!tenant) {
    tenant = profileFor(entry)
    state.onboarding[tenant.tenant_id] = tenant
    state.events.push({ id: randomUUID(), tenant_id: tenant.tenant_id, type: 'MUNICIPAL_WORKSPACE_BOOTSTRAPPED', created_at: new Date().toISOString(), actor_id: 'system-bootstrap' })
  }
  if (tenant.territory !== entry.municipality) tenant.territory = entry.municipality
  state.memberships ||= {}
  for (const user of configuredUsers.filter(user => user?.disabled !== true && user?.can_create_tenants === true)) {
    state.memberships[user.id] ||= []
    if (!state.memberships[user.id].some(membership => membership.tenant_id === tenant.tenant_id)) {
      state.memberships[user.id].push({ tenant_id: tenant.tenant_id, role: 'owner' })
      state.events.push({ id: randomUUID(), tenant_id: tenant.tenant_id, type: 'MUNICIPAL_OWNER_BOOTSTRAPPED', created_at: new Date().toISOString(), actor_id: user.id })
    }
  }
  if (state.events.length > 10000) state.events.splice(0, state.events.length - 10000)
  return tenant
}
