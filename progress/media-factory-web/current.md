# Current Media Factory Web delivery

2026-09-13 — **FIRMES / Caballito completion: COMPLETED**.

Deployed product SHA: `a72b2e927055beca050a4e72757855c96c6bc4dc` at https://media-factory.textilesdemedellin.com.

This checkpoint supersedes the earlier V3 completion assessment that the user rejected. The accepted scope now includes explicit FIRMES tenant identity, dominant burgundy/gold treatment, the authorized Caballito de Firmes asset, real production-mode video generation with immutable caballito/source provenance, and actionable same-job recovery for `SOURCE_TOO_SHORT`.

Verification: 135/135 pinned-Graph tests PASS with zero skips, 13/13 contracts, typecheck/build/audit PASS, clean `MEDIA_FACTORY_TEST_MODE=false` E2E PASS, IBM Granite exact-SHA risk P/NONE and enterprise rubric 10/10 P, signed receipt PASS, and host L1-L9 reconciliation PASS. Public health and restart recovery PASS; authenticated workspace lifecycle PASS.

Generated video SHA-256: `fb04b3a78dd794b2b7974e41c955f5014e76492090fa98f2538f5aafc931de66`.
Authorized caballito SHA-256: `b17c55ffb0eec46bfa719128ee68a9f18475c45afb90d6d73ce9d82567938397`.
Deployment request: `cd98b770-9907-4b1c-8302-84a791a1c4c5`.

Graph checkpoint `media-factory-firmes-caballito-completed`: event 223, all nodes DONE, no READY nodes.

The authenticated Chrome bridge remains read-only by contract. Its already-open production tab could be re-inspected and screenshotted without mutation, but not navigated/reloaded; the postdeploy capture was therefore correctly labeled stale/diagnostic and is not used as fresh acceptance evidence. Fresh visual acceptance comes from the exact clean candidate E2E, while host reconciliation independently proves that exact candidate SHA is deployed.

See `a72b2e9-deployed/RELEASE_REPORT.md` and `a72b2e9-deployed/host-reconcile-summary.json`.
