# WEB016 — signed release authority blocker

## Product state

The deployable Media Factory product candidate remains exact Git SHA `20418c13e51cf07d2f068ba5144affd69f2a91b0`. Its post-fix exact verification is complete and the fresh IBM Granite release reviews now pass:

- risk: `P / NONE`;
- enterprise rubric: all ten categories `P`;
- product/runtime code has not changed since the independently verified candidate.

## Blocking control

The installed Host Reconciler trust root is public key SHA-256:

`b61542031a4c61e9ccc270aac3ee2adb464508012d0b979eb40575da43d13e9e`

The only discoverable persistent private signer in the central workspace derives a different public key SHA-256:

`eef80f5fd016b7deb7a2f31710ea3b1b814cfb12e6e2e9c90b2ab84febbaa173`

The canonical installed finalizer (`edff9a10ef314ca38473af0e741aa7121611764c90626ae2e2cf7f69c785fb82`) was exercised with the passing raw Granite envelopes and the discoverable private key against the installed trusted public key. It failed closed with:

`private/public key mismatch`

No receipt or signature was produced.

A historical Media Factory receipt for the current deployed `c4d5d47...` release still verifies successfully with the installed `b615420...` public key. Therefore the public trust root itself is intact; what is unavailable is its matching central private signing authority.

The shared `b615420...` trust root is currently referenced by **two active products** (`campaignos` and `media-factory`). Rotating it ad hoc from this Media Factory release would mutate a cross-product trust boundary, invalidate the established release/rollback authority relationship, and bypass the signed-control-plane lifecycle. No explicit audited trust-root rotation command/mechanism exists in the installed Host Reconciler tooling.

Historical critic evidence documents this exact class of defect as HIGH severity (`critic-signer-persistence-006`) and prescribes durable central signer restoration/rotation plus fresh cryptographic gates. The current session therefore does **not** overwrite the trusted public key, fabricate a receipt, reuse an old signature, or issue an unsigned deploy request.

## Safe state preserved

No new deployment request was submitted. Registry desired/current Media Factory release remains `c4d5d47db4c4c23244785cf7a16b9c2c8de0a9e7`, reconciliation remains `converged`, prior authenticated public health remains recorded `PASS_HTTP_200`, and process recovery remains `PASS`. A fresh anonymous `/health` request returned `401`, consistent with the configured `form_session_single_operator` access boundary.

## Required unblock

Restore the matching private signer for public key `b615420...` to the documented central private state, **or** perform a separately reviewed cross-product trust-root rotation that preserves rollback/release semantics for all consumers. After that, rerun the canonical finalizer against the already-passing exact-SHA raw Granite responses, verify the detached RSA signature, issue the desired-state deployment through `productctl`, and complete host/public reconciliation.

Until that cryptographic authority exists, WEB016 cannot truthfully pass its signed-release gate.
