import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveSeedancePolicy } from '../plugins/media-seedance-policy.mjs'

const base = {
  failClosed: true,
  preferredModel: 'seedance-2.5',
  maxNativeClipSeconds: 30,
  requireHumanApprovalForCreditSpend: true,
  requireSyntheticProvenance: true,
  allowSyntheticPeople: false,
  allowSyntheticFactualEvents: false,
  allowedUses: ['abstract-transition', 'motion-graphics'],
}

test('accepts the canonical safe Seedance 2.5 policy', () => {
  const policy = resolveSeedancePolicy(base)
  assert.equal(policy.preferredModel, 'seedance-2.5')
  assert.equal(policy.maxNativeClipSeconds, 30)
  assert.deepEqual(policy.allowedUses, ['abstract-transition', 'motion-graphics'])
})

test('rejects credit spend without a human gate', () => {
  assert.throws(
    () => resolveSeedancePolicy({ ...base, requireHumanApprovalForCreditSpend: false }),
    /credit spend must require human approval/,
  )
})

test('rejects synthetic factual-event reconstruction', () => {
  assert.throws(
    () => resolveSeedancePolicy({ ...base, allowSyntheticFactualEvents: true }),
    /forbids synthetic people\/factual event reconstruction/,
  )
})

test('rejects undeclared synthetic use classes', () => {
  assert.throws(
    () => resolveSeedancePolicy({ ...base, allowedUses: ['fake-event-shot'] }),
    /unknown Seedance allowedUses/,
  )
})
