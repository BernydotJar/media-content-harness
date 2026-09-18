# WEB025 Fixer — exact `079caa6f209700d4cfafeda8c27c5a9b5522603a`

The Producer candidate `bea4634` implemented the requested UX, then Red Team found two material release blockers.

## F1 repaired — native keyboard-accessible character choice

The visual mascot cards now contain native radio inputs grouped by `name=story-character-<story-id>`. The cards remain visual, but browser-native radio semantics now provide single-choice state, keyboard arrow navigation and Space activation. Focus-visible receives an explicit outline. State changes remain atomic:

- no character → `mascot=false`, `character_id=null`;
- default authorized mascot → `mascot=true`, principal character ID when available;
- another reusable character → explicit character ID.

The FIRMES non-test browser verifier now exercises ArrowRight, ArrowLeft and Space and verifies the authorized Caballito image remains visible.

## F2 repaired — verifier aligned with current autosave/navigation contract

The Ease browser verifier no longer asserts the obsolete manual-save state from before WEB019. It now verifies the shipped contract: continuing from story editing autosaves the weekly draft while production remains explicitly approval-gated. It also opens the intentionally collapsed `Configurar marca` navigation before visiting reusable character/place profiles.

## Exact repaired-candidate verification

- full Node suite: 172 discovered, 171 PASS, 0 FAIL, 1 pre-existing SKIP;
- TypeScript: PASS;
- production build: PASS;
- contracts/examples: 13/13 PASS;
- production dependency audit: no known vulnerabilities;
- human-review UX focused tests: 4/4 PASS;
- Ease browser E2E: PASS on clean exact SHA;
- FIRMES non-test completion E2E: PASS on clean exact SHA;
- scene-generation E2E: PASS on clean exact SHA;
- generic browser E2E: PASS on clean exact SHA;
- runtime package: 1,481 files, zero forbidden entries and zero external symlinks.
