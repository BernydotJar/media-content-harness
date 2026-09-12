import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function readJson(path) {
  return JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'))
}

test('reference observation keeps provenance separate from source copy', async () => {
  const observation = await readJson('examples/reference-observation.example.json')
  assert.equal(observation.schema_version, 'reference-observation.v1')
  assert.match(observation.evidence_sha256, /^[a-f0-9]{64}$/)
  assert.ok(observation.authorization_id)
  assert.ok(observation.locator)
  assert.ok(Array.isArray(observation.observed_elements) && observation.observed_elements.length > 0)
  const serialized = JSON.stringify(observation).toLowerCase()
  for (const forbidden of ['transcript', 'caption', 'verbatim', 'source_text', 'script']) assert.equal(serialized.includes(forbidden), false)
})

test('content DNA contains abstractions but not reference bytes or locators', async () => {
  const dna = await readJson('examples/content-dna.example.json')
  assert.equal(dna.schema_version, 'content-dna.v1')
  assert.equal(dna.audience_mode, 'general-audience')
  assert.ok(Array.isArray(dna.story_devices) && dna.story_devices.length > 0)
  assert.deepEqual(dna.copying_policy, {
    direct_text_reuse: false,
    shot_for_shot_copying: false,
    source_audio_reuse: false,
  })
  assert.equal('locator' in dna, false)
  assert.equal('evidence_sha256' in dna, false)
  assert.equal('authorization_id' in dna, false)
})

test('content DNA provenance references a structured observation from the same tenant', async () => {
  const observation = await readJson('examples/reference-observation.example.json')
  const dna = await readJson('examples/content-dna.example.json')
  assert.equal(dna.tenant_id, observation.tenant_id)
  assert.ok(dna.source_observation_ids.includes(observation.id))
})

test('schemas fail closed on undeclared fields', async () => {
  const observationSchema = await readJson('schemas/reference-observation.schema.json')
  const dnaSchema = await readJson('schemas/content-dna.schema.json')
  assert.equal(observationSchema.additionalProperties, false)
  assert.equal(dnaSchema.additionalProperties, false)
  assert.equal(dnaSchema.properties.audience_mode.const, 'general-audience')
  assert.equal(dnaSchema.properties.copying_policy.properties.direct_text_reuse.const, false)
  assert.equal(dnaSchema.properties.copying_policy.properties.shot_for_shot_copying.const, false)
  assert.equal(dnaSchema.properties.copying_policy.properties.source_audio_reuse.const, false)
})

test('story devices use a controlled abstraction vocabulary', async () => {
  const schema = await readJson('schemas/content-dna.schema.json')
  const allowed = schema.properties.story_devices.items.enum
  assert.ok(Array.isArray(allowed) && allowed.length >= 5)
  assert.ok(allowed.includes('activity-first-story'))
  assert.ok(allowed.includes('recurring-character-bridge'))
  assert.equal(allowed.some(value => /\s/.test(value)), false)
})
