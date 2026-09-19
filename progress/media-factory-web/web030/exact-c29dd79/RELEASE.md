# WEB030 — New-user and brand-workspace onboarding V8 release

Product release SHA: `c29dd79cac99e15371d8344868f62a8b1b670112`

Public URL: `https://media-factory.textilesdemedellin.com`

## Product delivered

### New-user guide

A genuinely new account can now enter a short private guide that explains the Media Factory operating model in human language:

1. **Elige tu marca**
2. **Trae material**
3. **Define el estilo**
4. **Crea y revisa**

The guide is persisted per authenticated user, can be completed or dismissed, and remains available later from **Guía rápida**. Active legacy users are recognized as `RETURNING` so this rollout does not forcibly interrupt the installed active user base.

### Brand / tenant clarity

The UI now speaks in terms of **Marca** and **Espacio de marca** while preserving `tenant_id` internally. Users without tenant-creation authority no longer see a misleading `Nueva marca` action; they see only their assigned brands and a clear access explanation. Users with authority can create their first/new brand exactly as before, with the server still enforcing `can_create_tenants`.

A newly created brand now lands on `/workspace/:tenant_id/start` instead of dropping directly into a form. That start page shows factual Material → Style → Create → Delivery state from the existing journey endpoint, the authoritative next action, the user's role, and an explanation that each brand's material/style/characters/productions stay isolated.

### Cross-flow repair discovered by Critic

While validating onboarding, Critic also found that a supported review change could immediately re-enter the V7 Creation Room and hide the success confirmation. The release fixes that: action feedback now remains visible above the Creation Room, so the user sees both **what was accepted** and **what is happening now**.

## Signed release identity

- Release bundle SHA-256: `21465a7aaba2e88cf503fdd012c1cc49beae52c1a91ef96eb2fbf555447bebb8`
- Critic public-key SHA-256: `396f01f4a75d758a68833bfa4aead35a6c61da66ba21fddc8a44cf809cadb724`
- Critic receipt SHA-256: `82be71515287b037e6c5631635b512b93eee2af6415155a7b064a2ef624d27ab`
- Critic signature SHA-256: `8141c9423efa0d8c526b7aeed028bb569265c5a11024aa1b88ceb03081c702c4`
- Canonical finalizer SHA-256: `edff9a10ef314ca38473af0e741aa7121611764c90626ae2e2cf7f69c785fb82`
- Critic model: `ibm/granite3.3:2b`
- Reconcile request ID: `1839250c-3c51-433c-9cbd-6d0c02f9c36b`

## Verification

WEB029 exact implementation verification: 188 tests discovered / 187 PASS / 0 FAIL / 1 pre-existing SKIP; focused 16/16; typecheck/build PASS; contracts 13/13; audit clean; generic browser/FIRMES/source-recovery/scene/Ease E2Es PASS; detached independent verifier 59/59 plus typecheck/build/contracts/audit PASS.

Host reconciliation, process recovery, public health, TLS and anonymous private-API boundaries are PASS. No automatic social publication or additional provider authority was introduced.
