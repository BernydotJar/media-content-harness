export const name = 'media-seedance-policy'

const ALLOWED_SYNTHETIC_USES = new Set([
  'abstract-transition',
  'light-texture',
  'water-texture',
  'particles',
  'motion-graphics',
  'stylized-non-documentary-insert',
  'reference-guided-broll-clearly-synthetic',
])

/**
 * Resolve and fail-close the Seedance deployment policy used by Media Content Harness.
 * The service does not spend credits or call CapCut. It validates the production
 * contract before a future Seedance gateway is allowed to execute.
 *
 * @param {object} config deployment policy.
 * @returns {Readonly<object>} canonical policy.
 */
export function resolveSeedancePolicy(config) {
  if (!config || config.failClosed !== true) {
    throw new Error('media-seedance-policy requires failClosed=true')
  }
  if (config.preferredModel !== 'seedance-2.5') {
    throw new Error('media-seedance-policy preferredModel must be seedance-2.5')
  }
  if (config.maxNativeClipSeconds !== 30) {
    throw new Error('media-seedance-policy maxNativeClipSeconds must be 30')
  }
  if (config.requireHumanApprovalForCreditSpend !== true) {
    throw new Error('Seedance credit spend must require human approval')
  }
  if (config.allowSyntheticPeople === true || config.allowSyntheticFactualEvents === true) {
    throw new Error('Seedance documentary policy forbids synthetic people/factual event reconstruction')
  }
  if (config.requireSyntheticProvenance !== true) {
    throw new Error('Seedance outputs must carry synthetic provenance')
  }
  const allowedUses = Array.isArray(config.allowedUses) ? config.allowedUses : []
  const unknownUses = allowedUses.filter((value) => !ALLOWED_SYNTHETIC_USES.has(value))
  if (unknownUses.length > 0) {
    throw new Error(`unknown Seedance allowedUses: ${unknownUses.join(', ')}`)
  }

  return Object.freeze({
    preferredModel: 'seedance-2.5',
    maxNativeClipSeconds: 30,
    requireHumanApprovalForCreditSpend: true,
    requireSyntheticProvenance: true,
    allowSyntheticPeople: false,
    allowSyntheticFactualEvents: false,
    allowedUses: Object.freeze([...allowedUses]),
  })
}

/**
 * DeepSeek Harness / Cordis plugin entry point.
 *
 * @param {object} _ctx harness context.
 * @param {object} config deployment policy.
 */
export function apply(_ctx, config) {
  resolveSeedancePolicy(config)
}
