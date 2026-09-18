# WEB026 — Human-centered review UX exact release

Product release SHA: `079caa6f209700d4cfafeda8c27c5a9b5522603a`

Public URL: `https://media-factory.textilesdemedellin.com`

## Product delivered

1. The story editor shows the authorized Caballito as a visible first-class character card using the tenant-scoped brand asset. The contradictory “include mascot” checkbox is gone, and native radio controls provide keyboard-accessible single-choice behavior.
2. “Así se plantea esta versión” is now a compact six-card summary for story, character, place, creative resources, authorized material, delivery and status. Internal slugs are translated to friendly labels and the recursive technical object remains behind `Ver detalles técnicos`.
3. Human review is progressive: first choose `Aprobar versión` or `Quiero hacer cambios`. The textarea, suggestion chips and reject option appear only on the change path; Critic findings can open and seed the change composer.

## Signed release identity

- Release bundle SHA-256: `10641a0220e136b288fa93350fd556dcf3ed0b89c5792fd52b17dcdc70865c80`
- Critic public-key SHA-256: `396f01f4a75d758a68833bfa4aead35a6c61da66ba21fddc8a44cf809cadb724`
- Critic receipt SHA-256: `47b4ef47b932c62e36d64f2280eb45d787e5713b9534209219b36c2e02c58d52`
- Critic signature SHA-256: `44d3fa81c93741191eea266150ef7f3417250309ef7929b5bc545ec5c621c345`
- Canonical finalizer SHA-256: `edff9a10ef314ca38473af0e741aa7121611764c90626ae2e2cf7f69c785fb82`
- Critic model: `ibm/granite3.3:2b`
- Reconcile request ID: `3253db59-cc21-4d33-a664-f241d9962b6d`

## Verification

WEB025 exact checks: 172 tests discovered / 171 PASS / 0 FAIL / 1 pre-existing SKIP; typecheck/build PASS; contracts 13/13; audit clean; focused UX 4/4; Ease/FIRMES/scene/generic browser E2E PASS; detached independent verifier 51/51 + typecheck/build/contracts/audit PASS.

Host reconciliation and public TLS/auth probes are PASS. The public release remains a controlled single-operator preview and performs no automatic social publication.
