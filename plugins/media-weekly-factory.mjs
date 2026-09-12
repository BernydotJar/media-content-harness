import { validateTenantMediaProfile } from './media-tenant-profile.mjs'

export const name = 'media-weekly-factory'

const STORY_KEYS = new Set(['id', 'title', 'objective', 'source_ids', 'story_devices', 'approved'])
const RESOLUTION_BY_RATIO = Object.freeze({ '9:16': '1080x1920', '1:1': '1080x1080', '16:9': '1920x1080' })

export class WeeklyFactoryError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'WeeklyFactoryError'
    this.details = details
  }
}

export function buildWeeklyProductionPlan({ tenant, contentDna, weekOf, stories }) {
  const profile = validateTenantMediaProfile(tenant)
  if (profile.production_defaults.cadence !== 'weekly') throw new WeeklyFactoryError('tenant production cadence is not weekly')
  const dna = validateDnaForTenant(contentDna, profile.tenant_id)
  const week = validateWeek(weekOf)
  if (!Array.isArray(stories) || stories.length === 0 || stories.length > 12) throw new WeeklyFactoryError('stories must contain between 1 and 12 approved concepts')

  const knownSources = new Map(profile.sources.map(source => [source.id, source]))
  const allowedDevices = new Set(dna.story_devices)
  const seenIds = new Set()
  const usedSourceIds = new Set()

  const jobs = stories.map(story => {
    validateStoryShape(story)
    if (story.approved !== true) throw new WeeklyFactoryError('every weekly story requires explicit human approval', { storyId: story.id })
    if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(story.id || '')) throw new WeeklyFactoryError('story id is malformed')
    if (seenIds.has(story.id)) throw new WeeklyFactoryError('story ids must be unique')
    seenIds.add(story.id)
    if (typeof story.title !== 'string' || story.title.trim() === '' || story.title.length > 200) throw new WeeklyFactoryError('story title is invalid', { storyId: story.id })
    if (typeof story.objective !== 'string' || story.objective.trim() === '' || story.objective.length > 500) throw new WeeklyFactoryError('story objective is invalid', { storyId: story.id })
    if (!Array.isArray(story.source_ids) || story.source_ids.length === 0) throw new WeeklyFactoryError('story requires at least one authorized source', { storyId: story.id })
    const sourceIds = [...new Set(story.source_ids)]
    if (sourceIds.length !== story.source_ids.length) throw new WeeklyFactoryError('story source_ids must be unique', { storyId: story.id })
    for (const sourceId of sourceIds) {
      if (!knownSources.has(sourceId)) throw new WeeklyFactoryError('story references an unknown tenant source', { storyId: story.id, sourceId })
      if (knownSources.get(sourceId).purpose !== 'source') throw new WeeklyFactoryError('story production source must be explicitly authorized with purpose=source', { storyId: story.id, sourceId })
      usedSourceIds.add(sourceId)
    }
    if (!Array.isArray(story.story_devices) || story.story_devices.length === 0) throw new WeeklyFactoryError('story requires at least one Content DNA device', { storyId: story.id })
    const devices = [...new Set(story.story_devices)]
    if (devices.length !== story.story_devices.length) throw new WeeklyFactoryError('story devices must be unique', { storyId: story.id })
    for (const device of devices) if (!allowedDevices.has(device)) throw new WeeklyFactoryError('story device is outside tenant Content DNA', { storyId: story.id, device })

    return Object.freeze({
      id: story.id,
      title: story.title.trim(),
      objective: story.objective.trim(),
      source_ids: Object.freeze(sourceIds),
      story_devices: Object.freeze(devices),
      target: Object.freeze({
        aspect_ratio: profile.production_defaults.aspect_ratio,
        resolution: RESOLUTION_BY_RATIO[profile.production_defaults.aspect_ratio],
        duration_seconds: Object.freeze([...profile.production_defaults.duration_seconds]),
      }),
      pipeline: 'media-graph-v1',
      initial_graph_node: 'BRIEF',
      human_approval_required: true,
      publication_action: 'none',
      status: 'PLANNED',
    })
  })

  const sourceSnapshot = profile.sources
    .filter(source => usedSourceIds.has(source.id))
    .map(source => Object.freeze({ id: source.id, locator: source.locator, authorization: source.authorization, purpose: source.purpose }))

  return Object.freeze({
    schema_version: 'weekly-production-plan.v1',
    plan_id: `${profile.tenant_id}-${week}`,
    tenant_id: profile.tenant_id,
    week_of: week,
    cadence: 'weekly',
    audience_mode: 'general-audience',
    source_authorization_snapshot: Object.freeze(sourceSnapshot),
    content_dna_observation_ids: Object.freeze([...dna.source_observation_ids]),
    jobs: Object.freeze(jobs),
    deliverables: Object.freeze(['master-videos', 'caption-drafts', 'thumbnail-drafts', 'provenance-manifest', 'release-report']),
  })
}

function validateStoryShape(story) {
  if (!story || typeof story !== 'object' || Array.isArray(story)) throw new WeeklyFactoryError('story must be an object')
  for (const key of Object.keys(story)) if (!STORY_KEYS.has(key)) throw new WeeklyFactoryError('story contains an undeclared field', { key })
}

function validateDnaForTenant(dna, tenantId) {
  if (!dna || typeof dna !== 'object') throw new WeeklyFactoryError('contentDna is required')
  if (dna.schema_version !== 'content-dna.v1') throw new WeeklyFactoryError('contentDna schema_version is invalid')
  if (dna.tenant_id !== tenantId) throw new WeeklyFactoryError('contentDna tenant does not match tenant profile')
  if (dna.audience_mode !== 'general-audience') throw new WeeklyFactoryError('contentDna audience mode must be general-audience')
  if (!Array.isArray(dna.source_observation_ids) || dna.source_observation_ids.length === 0) throw new WeeklyFactoryError('contentDna requires source observations')
  if (!Array.isArray(dna.story_devices) || dna.story_devices.length === 0) throw new WeeklyFactoryError('contentDna requires story devices')
  if (new Set(dna.source_observation_ids).size !== dna.source_observation_ids.length) throw new WeeklyFactoryError('contentDna source observation ids must be unique')
  if (new Set(dna.story_devices).size !== dna.story_devices.length) throw new WeeklyFactoryError('contentDna story devices must be unique')
  const copying = dna.copying_policy
  if (!copying || copying.direct_text_reuse !== false || copying.shot_for_shot_copying !== false || copying.source_audio_reuse !== false) throw new WeeklyFactoryError('contentDna copying policy is not fail-closed')
  return dna
}

function validateWeek(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new WeeklyFactoryError('weekOf must use YYYY-MM-DD')
  const date = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) throw new WeeklyFactoryError('weekOf is not a real calendar date')
  if (date.getUTCDay() !== 1) throw new WeeklyFactoryError('weekOf must be a Monday')
  return value
}

export function apply(ctx) {
  if (!ctx || typeof ctx.provide !== 'function') throw new WeeklyFactoryError('media-weekly-factory requires ctx.provide()')
  ctx.provide('mediaWeeklyFactory', Object.freeze({ build: buildWeeklyProductionPlan }))
}
