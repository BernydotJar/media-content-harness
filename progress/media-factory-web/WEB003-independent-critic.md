# WEB003 independent Critic — changes required

Reviewer: independent baseline_audit agent. Scope: `server/execution.mjs`, `server/worker-policy.mjs`, `server/worker-adapters.mjs`, `server/worker-lock.mjs`. Reviewed the working implementation on 2026-09-12, after the first service/worker integration passed in isolated test mode. No worker files edited by this reviewer. This is not a release approval.

Result: CHANGES_REQUIRED. Do not record PASS until the findings below are repaired and independently verified against the resulting files.

## P1 — Independent Verifier and Release bind different candidates

Locations: `server/execution.mjs:33`, `:43`, `:46`, `:48`.

`waiting()` hashes the whole stage-specific candidate. Independent Verifier includes `stage: INDEPENDENT_VERIFIER`, while Release includes `stage: RELEASE` and adds the DNA revision. Therefore the verifier approval and final release approval necessarily have different `candidate_sha` values even when bytes and treatment are unchanged. The release record persists only the latter. This violates the explicit same immutable candidate requirement and prevents a direct verifier-to-release identity check.

Observed deterministic hashes for identical artifact/treatment/source values: verifier `3cfe4fdf8daad9a55d17f8081de725e065b3a75fd37cbb97f2fb510c7e83d9d7`; release `c84805f5d9660004c5172e45360a1f6e596f70002ffa186ecdbadb75f7550226`.

Fix: define one immutable artifact candidate manifest containing artifact, source bytes/authorization, DNA, treatment and repair revision. Keep stage outside its identity. Persist and require the same manifest hash at verifier and release. Add a production-mode regression checking verifier approval hash equals release candidate hash and release record hash.

## P1 — Mascot production requirement is silently ignored

Locations: `server/execution.mjs:38`, `:41`; `server/worker-adapters.mjs:12-16`.

Jobs contain `mascot: true`, but neither Director Treatment nor provider selection checks the character requirement. FFmpeg accepts the job and merely concatenates equal-duration source segments. It does not resolve or include the configured mascot asset and can advance to normal review/release as though the request were fulfilled.

Read-only reproduction: `new FFmpegAdapter().prepare({job:{mascot:true},assets:[{source_id:'ordinary-video'}]})` succeeds; capabilities advertise only REAL_FOOTAGE. The exact user request includes a distinct caballito video, so this is a concrete product-fidelity issue.

Fix: bind the approved mascot source into the job's immutable input snapshot and treatment, and require adapter capability to fulfill that treatment. Until such production is implemented, block with an explicit unsupported-character-production error; do not silently create ordinary footage. Test the exact fourth-video contract.

## P1 — Actual provider cost is not checked before generation

Location: `server/execution.mjs:41`.

The worker checks only registry `credit_bearing`, which is statically false for CapCut and FFmpeg. It never calls `adapter.estimate()` and does not reject actual `adapter.capabilities().paid`. A subsequently configured credit-bearing adapter using either identifier can reach `prepare()`/`generate()` without the required cost approval. This is material for the requested interchangeable adapter contract, even though shipped FFmpeg itself costs no credits.

Fix: validate estimate and capability fields immediately before external preparation/generation; any positive/unknown paid amount or paid capability must fail closed until an approved integration and hash-bound spend gate exist. Add a fake paid adapter test proving generate is never called.

## P1 — Crash during repair or rejection leaves Graph and product state divergent

Locations: `server/execution.mjs:28`, `:49-50`.

Approval has a persisted action intent, but requestChanges and reject mutate the Graph first and only then update the product state. A crash between those operations leaves the previous `AWAITING_REVIEW` candidate in the product store while Graph revisions or node states have already changed. Recovery excludes `AWAITING_REVIEW` jobs and only replays pending approve actions, so this state cannot recover normally and can continue presenting obsolete approval controls.

Fix: journal repair/reject decisions before Graph mutation, replay them idempotently, and reconcile Graph projection before displaying/reusing a candidate. Add crash-injection tests after the durable Graph failure/block event but before product transaction.

## P1 — A stale reclaim lease permanently prevents job recovery

Location: `server/worker-lock.mjs:9`.

When recovering a dead worker lease, the code publishes `<path>.reclaim`; if that already exists it returns JOB_BUSY without checking its process identity. If the recovering process dies before the finally block, both the primary and reclaim leases are stale and every future recovery returns JOB_BUSY.

Reproduction used temporary files with nonexistent PID 999999999, stale boot/start identity, distinct primary/reclaim tokens. Two consecutive `withJobLease()` calls both returned JOB_BUSY; the protected operation never ran.

Fix: reclaim stale recovery leases safely (or use a crash-recoverable lock protocol without an unhandled second lock). Add regression for a crash after publishing the reclaim lease and before replacing the primary lease.

## P2 — Recovery trusts captured role rather than resolving current authorization

Locations: `server/execution.mjs:28`, `:48`.

Pending approval stores actor ID plus a membership role, and recovery passes that saved actor straight to approve(). The worker has no identity resolver, so disabling/removing that reviewer after the crash does not affect the replay. At RELEASE this bypasses the stated membership recheck boundary.

Fix: inject a current actor/membership resolver for recovered side effects, or explicitly persist the final authorized approval as complete before replaying only mechanical projection changes. Test disabled reviewer and revoked membership between crash and recovery.

## Evidence and limits

- Service/actual pinned Graph integration ran in temporary test storage and progressed CREATIVE_GATE -> RELEASE -> RELEASED; generated fixture was explicitly `test: true` and removed afterward. This confirms basic wiring, not production completion.
- The observations above include exact code paths and isolated lock/candidate/mascot reproductions. Full independent production acceptance remains pending fixes.
- No paid provider was called, no production source altered, no real media approval fabricated, and no social publication performed.
