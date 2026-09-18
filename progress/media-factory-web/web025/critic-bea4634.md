# WEB025 Critic / Red Team — `bea463461e518ff2928c52cd968dbe69e892de85`

## Verdict: FAIL — repair required

The primary product objective is materially implemented: the story editor shows the authorized default mascot as a visible choice, the pre-production candidate becomes a compact six-card summary with friendly labels and technical disclosure, and human review is progressive (decision first, change composer second). Exact full unit suite, typecheck, build, contract validation, audit, generic browser E2E, FIRMES non-test E2E and scene-generation E2E all pass.

Two issues prevent release:

### F1 — Accessibility: custom radio buttons do not implement native radio-group keyboard semantics

The avatar selector uses `button role="radio"`. Space/Enter works, but the WAI-ARIA radio pattern also expects arrow-key navigation and single-tab-stop behavior. The WEB025 acceptance criterion explicitly requires a real radiogroup/radio pattern and keyboard usability. This is a product defect in the new UI, not a cosmetic preference.

**Required repair:** use native `input type="radio"` controls inside labeled visual cards (or implement the complete roving-tabindex + arrow-key pattern). Preserve the atomic state transitions `mascot=false, character_id=null` and `mascot=true, character_id=<principal-or-null>`. Extend exact tests to assert native radio semantics.

### F2 — Release verification: `test-ease-e2e` still asserts the pre-V4 manual-save UX

Exact `node scripts/test-ease-e2e.mjs --require-clean` fails before the new avatar assertions because it expects `Borrador sin guardar · todavía no se produce` after step 4. The current product intentionally autosaves when continuing from story editing; that behavior is already protected by V4 tests and the main browser E2E. The E2E assertion is stale and makes the verification gate red.

**Required repair:** update the E2E to assert the current autosave contract (`Tu semana ya está guardada` / saved-draft state), then continue the same journey. Do not revert product autosave merely to satisfy an obsolete test.

## Passing exact evidence before repair

- Full Node suite: 172 tests discovered; 171 PASS, 0 FAIL, 1 pre-existing SKIP.
- TypeScript: PASS.
- Production build: PASS.
- Contracts: 13/13 PASS.
- Production audit: no known vulnerabilities.
- Main browser E2E: PASS, exact commit and clean tree.
- FIRMES non-test completion E2E: PASS; visible Caballito card, compact summary, progressive changes path verified.
- Scene-generation E2E: PASS; Critic finding opens/populates the progressive change composer and same-job repair remains intact.
- Ease E2E: FAIL due stale autosave assertion described above.
