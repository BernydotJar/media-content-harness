# WEB016 Granite failure analysis

Exact product candidate: `20418c13e51cf07d2f068ba5144affd69f2a91b0`.

## Observed gate result

The first strict IBM Granite 3.3 2B risk review returned `F / MATERIAL_FINDINGS`. A separate diagnostic review did not identify a new negative behavior in the candidate. Instead, its `material_findings` array repeated four controls that the post-fix candidate already implements and tests as repaired behavior, while its `evidence_gaps` array repeated three predeployment sequencing/boundary requirements that WEB016 intentionally enforces.

This is treated as a failed release gate, not ignored. The release remains undeployed until a fresh exact-candidate risk/rubric review succeeds and the canonical signing finalizer verifies the raw model responses.

## Independent exact-code audit of the diagnostic items

1. **Semantic reference role / authorization drift** — resolved and fail-closed.
   - Exact candidate `server/worker-policy.mjs` lines 15-18 re-resolve each compiled reference from tenant state and require the current semantic role/authorization to match the compiled role/authorization in addition to tenant and SHA equality.
   - Exact test: `reference role and authorization drift invalidate a compiled scene even when bytes are unchanged`.

2. **Approved hero and final generation inputs frozen in release provenance** — resolved.
   - `sceneReleaseProvenance()` copies compiled reference roles, hashes, the approved hero decision, and the terminal generation attempt inputs into the immutable release snapshot.
   - Exact E2E proves the final MP4 release retains `APPROVED_HERO_IMAGE` SHA `28de0345...` while the released final output SHA is `b0519393...`.

3. **Operator override lower priority than semantic roles / hard constraints** — resolved.
   - The compiler appends operator text under the literal section `OPERATOR OVERRIDE (LOWER PRIORITY)` followed by a guard that prohibits changing reference roles, identity preservation, environment-only isolation, or hard exclusions.
   - Exact deterministic compiler test covers override provenance and prompt ordering.

4. **Generic tenant no longer assumes FIRMES mascot** — resolved.
   - Non-FIRMES tenant brand profile defaults have null mascot asset/character IDs; presets derive `withDefault` from the tenant profile instead of a FIRMES constant.
   - Exact test: `generic tenant does not require a FIRMES character and receives neutral preset labels`.

## Classification of the diagnostic `evidence_gaps`

These are release preconditions or deployment boundaries, not missing implementation evidence:

- `Exact candidate must be archived from Git and signed only after Granite risk P/NONE and all ten rubric categories P.` — this is the WEB016 gate being executed now; no deployment success is claimed before it passes.
- `Host reconciler owns Docker, Caddy, DNS/TLS/tunnel and restart verification.` — this is an intentional trust boundary; direct product-workspace host mutation would be a governance defect.
- `controlled_single_operator_preview` does not claim production reviewer accounts on the public preview — this is the declared deployment class; separation of duties is verified in isolated production-mode acceptance identities.

## Remaining open material findings

None identified by the exact code/test audit. The failed first Granite decision is preserved as evidence. A repaired release dossier must explicitly separate **resolved findings**, **open findings**, and **post-sign deployment preconditions**, then a fresh strict Granite risk review and full ten-category rubric must be run. If either returns FAIL, WEB016 remains blocked and no signing/deployment occurs.
