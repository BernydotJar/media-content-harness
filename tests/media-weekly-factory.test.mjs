import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { WeeklyFactoryError, apply, buildWeeklyProductionPlan } from '../plugins/media-weekly-factory.mjs'

async function fixtures() {
  return {
    tenant: JSON.parse(await readFile(new URL('../examples/tenant-media-profile.example.json', import.meta.url), 'utf8')),
    dna: JSON.parse(await readFile(new URL('../examples/content-dna.example.json', import.meta.url), 'utf8')),
  }
}

function story(overrides = {}) {
  return {
    id: 'story-01',
    title: 'A community moment',
    objective: 'Show one authorized community activity with a clear beginning, middle, and payoff.',
    source_ids: ['authorized-album'],
    story_devices: ['activity-first-story', 'place-as-character'],
    approved: true,
    ...overrides,
  }
}

test('builds a weekly video-production plan from tenant + DNA + approved stories', async () => {
  const { tenant, dna } = await fixtures()
  const plan = buildWeeklyProductionPlan({ tenant, contentDna: dna, weekOf: '2026-09-14', stories: [story()] })
  assert.equal(plan.schema_version, 'weekly-production-plan.v1')
  assert.equal(plan.tenant_id, tenant.tenant_id)
  assert.equal(plan.jobs.length, 1)
  assert.equal(plan.jobs[0].pipeline, 'media-graph-v1')
  assert.equal(plan.jobs[0].initial_graph_node, 'BRIEF')
  assert.equal(plan.jobs[0].target.aspect_ratio, '9:16')
  assert.equal(plan.jobs[0].target.resolution, '1080x1920')
  assert.deepEqual(plan.jobs[0].target.duration_seconds, [8, 25])
  assert.equal(plan.jobs[0].human_approval_required, true)
  assert.equal(plan.jobs[0].publication_action, 'none')
  assert.equal(plan.jobs[0].status, 'PLANNED')
})

test('production jobs cannot treat a reference-only source as production media', async () => {
  const { tenant, dna } = await fixtures()
  assert.throws(() => buildWeeklyProductionPlan({ tenant, contentDna: dna, weekOf: '2026-09-14', stories: [story({ source_ids: ['reference-page'] })] }), /purpose=source/)
})

test('rejects unknown sources and story devices outside Content DNA', async () => {
  const { tenant, dna } = await fixtures()
  assert.throws(() => buildWeeklyProductionPlan({ tenant, contentDna: dna, weekOf: '2026-09-14', stories: [story({ source_ids: ['missing'] })] }), /unknown tenant source/)
  assert.throws(() => buildWeeklyProductionPlan({ tenant, contentDna: dna, weekOf: '2026-09-14', stories: [story({ story_devices: ['unknown-device'] })] }), /outside tenant Content DNA/)
})

test('rejects unapproved stories and undeclared story fields', async () => {
  const { tenant, dna } = await fixtures()
  assert.throws(() => buildWeeklyProductionPlan({ tenant, contentDna: dna, weekOf: '2026-09-14', stories: [story({ approved: false })] }), /explicit human approval/)
  assert.throws(() => buildWeeklyProductionPlan({ tenant, contentDna: dna, weekOf: '2026-09-14', stories: [{ ...story(), extra_mode: 'unexpected' }] }), /undeclared field/)
})

test('rejects cross-tenant DNA and copying-policy drift', async () => {
  const { tenant, dna } = await fixtures()
  assert.throws(() => buildWeeklyProductionPlan({ tenant, contentDna: { ...dna, tenant_id: 'other-tenant' }, weekOf: '2026-09-14', stories: [story()] }), /tenant does not match/)
  assert.throws(() => buildWeeklyProductionPlan({ tenant, contentDna: { ...dna, copying_policy: { ...dna.copying_policy, direct_text_reuse: true } }, weekOf: '2026-09-14', stories: [story()] }), /copying policy is not fail-closed/)
})

test('rejects invalid dates, duplicate job ids, and duplicate source ids', async () => {
  const { tenant, dna } = await fixtures()
  assert.throws(() => buildWeeklyProductionPlan({ tenant, contentDna: dna, weekOf: '2026-02-30', stories: [story()] }), /not a real calendar date/)
  assert.throws(() => buildWeeklyProductionPlan({ tenant, contentDna: dna, weekOf: '2026-09-14', stories: [story(), story()] }), /story ids must be unique/)
  assert.throws(() => buildWeeklyProductionPlan({ tenant, contentDna: dna, weekOf: '2026-09-14', stories: [story({ source_ids: ['authorized-album', 'authorized-album'] })] }), /source_ids must be unique/)
})

test('source snapshot contains only production sources actually used by the weekly jobs', async () => {
  const { tenant, dna } = await fixtures()
  const plan = buildWeeklyProductionPlan({ tenant, contentDna: dna, weekOf: '2026-09-14', stories: [story()] })
  assert.deepEqual(plan.source_authorization_snapshot.map(source => source.id), ['authorized-album'])
  assert.equal(plan.source_authorization_snapshot[0].purpose, 'source')
  assert.equal(JSON.stringify(plan).includes('browser_context_ref'), false)
})

test('registers weekly factory through Cordis provide', () => {
  let provided
  apply({ provide(key, value) { provided = { key, value } } })
  assert.equal(provided.key, 'mediaWeeklyFactory')
  assert.equal(typeof provided.value.build, 'function')
  assert.ok(WeeklyFactoryError)
})

test('weekly planner requires weekly cadence, Monday boundary, and unique DNA references', async () => {
  const { tenant, dna } = await fixtures()
  assert.throws(() => buildWeeklyProductionPlan({
    tenant: { ...tenant, production_defaults: { ...tenant.production_defaults, cadence: 'on-demand' } },
    contentDna: dna,
    weekOf: '2026-09-14',
    stories: [story()],
  }), /cadence is not weekly/)
  assert.throws(() => buildWeeklyProductionPlan({ tenant, contentDna: dna, weekOf: '2026-09-15', stories: [story()] }), /must be a Monday/)
  assert.throws(() => buildWeeklyProductionPlan({
    tenant,
    contentDna: { ...dna, source_observation_ids: [dna.source_observation_ids[0], dna.source_observation_ids[0]] },
    weekOf: '2026-09-14',
    stories: [story()],
  }), /source observation ids must be unique/)
  assert.throws(() => buildWeeklyProductionPlan({
    tenant,
    contentDna: { ...dna, story_devices: [dna.story_devices[0], dna.story_devices[0]] },
    weekOf: '2026-09-14',
    stories: [story({ story_devices: [dna.story_devices[0]] })],
  }), /story devices must be unique/)
})
