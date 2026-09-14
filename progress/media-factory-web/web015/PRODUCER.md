# WEB015 Producer — Operational Creation Layer

Verdict: **IMPLEMENTED / READY FOR INDEPENDENT REVIEW**.

Working candidate production-source SHA-256: `dda83de709e3208758d9c2a437a3541e804750405052a3b3dcba0666c1b99644`.

The producer implemented the approved WEB015 contract without replacing the existing Media Factory execution boundary:

- FIRMES Caballito is resolved through tenant-scoped BrandAsset → BrandCharacter → TenantBrandProfile state and the exact authorized asset SHA.
- Guided Scene exposes subject, environment, action, required/forbidden elements, output format and provider route.
- The compiler assigns semantic reference roles and emits request/compiler/prompt hashes.
- `manual-external` is an explicit same-job operational adapter; unconfigured named providers remain `INTEGRATION_REQUIRED`.
- Video is image-first: a Critic-approved hero SHA becomes `APPROVED_HERO_IMAGE` for image-to-video.
- Critic findings regenerate the same job and preserve retry provenance.
- Final release binds the accepted output SHA plus immutable scene provenance and remains `READY_FOR_MANUAL_PUBLISH`.

Producer verification reached 10/10 focused tests, 145 PASS / 0 FAIL / 1 pre-existing SKIP in the 146-test repository suite, 13/13 contract examples, typecheck PASS, production build PASS, production dependency audit clean, and production-mode browser E2E PASS.
