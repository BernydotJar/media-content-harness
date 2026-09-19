# WEB031 Implementation — Provider Execution Gateway V9

Exact product SHA: `515785504c3dbb4d68492cd34dd360cce992be21`

## Shipped runtime capability

- Added a real server-side Higgsfield adapter targeting Seedance 2.5 text-to-video under the existing provider-neutral contract: `capabilities → estimate → prepare → generate → poll → collect → provenance`.
- Added durable asynchronous provider attempts with request SHA, prompt SHA, exact input hashes, provider request ID, status observations, retry lineage, artifact SHA and approval linkage.
- Added an authenticated human spend gate. No credit-bearing request can submit until owner/admin approval is bound to the exact job revision, provider/model, request/prompt hashes, estimate and input hashes.
- Added restart-safe request recovery: a persisted provider request ID is polled again; ambiguous submission without a request ID is never blindly resubmitted; crash-after-collection completes from the exact durable artifact without another paid call.
- Added authoritative provider telemetry as a separate signal from Graph workflow progress. Higgsfield status is surfaced as lifecycle state only; provider percentage remains `null` because an authoritative numeric render percentage is not part of the documented provider contract used by V9.
- Added credential-aware provider discovery. The adapter may be shipped while the UI reports `CREDENTIAL_REQUIRED`; secret material remains in the existing encrypted IntegrationVault and is never returned through provider/job projections.
- Added fail-closed handling for reference/mascot inputs until a reviewed provider media-upload bridge exists. V9 never silently converts a reference-dependent scene into text-only generation.
- Added fail-closed provider moderation/failure behavior with no automatic paid retry.
- Added bounded provider output collection: HTTPS only, no URL credentials, public DNS only, actual TLS media socket pinned to a validated DNS answer, redirect revalidation, timeout, maximum bytes and supported video MIME checks.
- Existing Graph Critic, Fixer, Independent Verifier and Release authority remain unchanged; no automatic social publication was added.

## Exact verification

- Full suite: 198 discovered / 197 PASS / 0 FAIL / 1 pre-existing SKIP.
- V9/core targeted suite: 48/48 PASS.
- TypeScript: PASS.
- Production build: PASS.
- Contract examples: 13/13 PASS.
- Production dependency audit: no known vulnerabilities.
- Clean exact browser E2E: PASS, including separate provider telemetry and explicit spend approval UI.
- Clean exact non-test FIRMES completion E2E: PASS.
- Detached exact worktree verifier: 38/38 PASS plus typecheck/build/contracts/audit PASS.
- Runtime package: 1,481 files, 0 forbidden entries, 0 external symlinks.
- Runtime manifest SHA-256: `5afae8d43b20173b378fb03416aaeb5cb5efc8ed58e32debbbf859db24a0b93a`.
- Production-source SHA-256: `7deda35e5b0fced97a207b137555b422d7b250bea1751034ebfdb57679f3880c`.

No live paid Higgsfield smoke is claimed by WEB031. That is intentionally a separate operation requiring an actual Media Factory server credential and explicit spend approval.
