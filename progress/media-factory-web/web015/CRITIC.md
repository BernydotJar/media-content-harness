# WEB015 Critic / Red Team

Candidate production-source SHA-256 reviewed: `dda83de709e3208758d9c2a437a3541e804750405052a3b3dcba0666c1b99644`.

Initial verdict: **REPAIR REQUIRED**. Post-fix verdict: **PASS** with zero open material findings.

## Findings and repairs

1. **Semantic reference-role drift — material, repaired.** A scene reference originally compiled as `ENVIRONMENT_ONLY` could retain identical bytes while its stored semantic role/authorization changed. Byte SHA alone was not sufficient. Reference IDs are now role-bound and runtime freshness verifies tenant, byte SHA, semantic role and current authorization. A regression test mutates role and authorization with unchanged bytes and proves fail-closed `REFERENCE_CHANGED`.

2. **Image-first release provenance gap — material, repaired.** The approved hero SHA was present in mutable job history but the release snapshot did not independently preserve the exact final-generation input list. Release provenance now includes generation request/prompt SHA, immutable generation input assets and the approved-hero decision record. Browser E2E verifies `APPROVED_HERO_IMAGE` equals the Critic-approved hero SHA while the release result SHA is the final MP4.

3. **Operator override precedence — material, repaired.** An operator override was hash-tracked but appended without an explicit lower-priority authority rule. Compilation now labels it `LOWER PRIORITY` and appends a final authority guard stating semantic reference roles, identity rules, required elements and absolute exclusions cannot be weakened, negated or reassigned. Regression coverage confirms the guard follows the override.

4. **Generic-tenant default behavior — product-quality finding, repaired.** A non-FIRMES tenant could initially select `default_brand_character` despite having no default mascot and presets carried Caballito labels. Generic tenants now resolve to `none` and receive neutral preset labels; no FIRMES character ID is required.

5. **Browser acceptance synchronization — test-harness finding, repaired.** Hidden file-input response waiting after identity switches was nondeterministic although backend state was correct. The browser acceptance still exercises the actual environment upload and first external-result UI upload; later authenticated uploads use the same browser request context after asserting the visible operational upload state and accepted media type. This removes a Playwright event race without bypassing application authorization or production validation.

## Red-team assertions

- Cross-tenant/default-character misuse fails closed.
- Same bytes under different semantic roles produce different scene-reference IDs.
- Non-editors cannot upload scene references.
- Reference role/authorization drift invalidates an already compiled scene.
- Unconfigured providers are not represented as executable integrations.
- Paid execution is not authorized by WEB015.
- Automatic social publication remains false; release state is manual publish only.
- Runtime package reports zero forbidden entries and zero external symlinks.
- No credential/session fields or absolute private filesystem paths are projected by the new scene contract.

**Open material findings: 0.**
