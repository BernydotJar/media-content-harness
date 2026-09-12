# Media Factory Web — ease-of-creation release

## Final software state

**COMPLETED** for the approved controlled-single-operator Web release.

Exact deployed candidate: `7f465d072f7faf05017b90e1da769e99a047674f`.

Public entry: `https://media-factory.textilesdemedellin.com/login`.

The release adds the guided creation improvements, truthful production/activity states, fictional character and place profiles, principal mascot support in Free Mode, exact-plan navigation, and administrator-only API/integration configuration. Saving a provider credential does not claim the provider adapter is operational and does not authorize paid generation.

## Exact-SHA release authority

- IBM Granite model: `ibm/granite3.3:2b`.
- Risk gate: `P / NONE`.
- Enterprise rubric: 10/10 categories PASS.
- Signed receipt SHA-256: `2e897480f3e72628a8444369bbf5c1a264eb0c8bcaa03597a8c4958a92de477c`.
- Detached signature SHA-256: `96a5bc6b1690c098079d419ac8644c426d1beaaca682f8e3365c77ab49209428`.
- Canonical Critic public-key SHA-256: `b61542031a4c61e9ccc270aac3ee2adb464508012d0b979eb40575da43d13e9e`.
- Canonical finalizer SHA-256: `edff9a10ef314ca38473af0e741aa7121611764c90626ae2e2cf7f69c785fb82`.

The detached signature was cryptographically verified before the deployment request.

## Host deployment

Deployment request: `7c35d741-2017-4072-afe4-ac395dd2f638`.

The existing shared host reconciler converged the exact release without creating a new tunnel, VPS, Kubernetes cluster, or public CDP endpoint.

Host evidence: `evidence/media-factory-host-reconcile-20260912T230143Z.json`.

All recorded deployment layers passed:

- release authority;
- runtime;
- edge network;
- local health;
- restart recovery;
- Caddy;
- existing Cloudflare tunnel;
- DNS/TLS/public path;
- security;
- authorization.

The host session proof recorded login `200`, workspace `200`, logout `303`, and revoked-session `401`.

## Bounded postdeploy verification

Already-passing functional suites and the browser walkthrough were not repeated.

New postdeploy checks were limited to release convergence and the changed access surface:

- exact desired/actual release SHA: PASS;
- `/api/v1/admin/integrations` anonymous: `401`;
- `/admin/integrations` anonymous: `401`;
- `/robots.txt`: `200`;
- `/sitemap.xml`: `200`;
- `/llms.txt`: `200`;
- `/llm.txt`: `200`;
- anonymous `/health`: `401` by the configured form-session access policy; host-local/authenticated health is PASS.

## Graph closure

`graph/media-factory-web.events.jsonl` validates with 113 events. All eight nodes `WEB001` through `WEB008` are `done`, with no READY node remaining.

## Explicit remaining product limits

The broader Media Factory product remains **PARTIAL_WITH_DOCUMENTED_BLOCKERS** beyond this software release:

1. The fictional mascot/caballito can be configured, selected, snapshotted into a story and taken to treatment/review, but actual animation/compositing remains blocked until an operational generation/composition adapter is implemented and authorized.
2. Seedance, Higgsfield, CapCut and Gemini credentials can be administered without being represented as operational adapters. No paid generation was authorized or performed by this release.
3. The deployed environment remains a controlled single-operator preview. Production workflows requiring distinct real customer reviewer identities still require operator provisioning.

These are explicit capability limits, not hidden release failures.
