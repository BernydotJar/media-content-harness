# WEB012 revision 1 — Critic / Fixer evidence

The first IBM Granite enterprise rubric rejected exact candidate `bc7ba224702470de0518508ddce19c3a33a9a59c`: architecture=P and the other nine categories=F. The release was not signed or deployed.

The failure was recorded in the append-only Graph and WEB012 was invalidated to repair revision 1.

## Fixer finding

An expanded enterprise-focused test run found one concrete regression in the verification suite: `tests/web-execution.test.mjs` still expected a mascot request to block before creative review. That expectation no longer matched the already-approved product behavior from WEB007/WEB011: the fictional mascot reaches `CREATIVE_GATE` so a human can inspect treatment/context, then after approval the runtime fails closed at `PROVIDER_PRODUCTION` with `MASCOT_RENDER_UNAVAILABLE` before any unsupported composition occurs.

The test was repaired to assert the actual governed lifecycle. No production runtime behavior was weakened.

## Verification after repair

- `tests/web-execution.test.mjs`: 23/23 PASS.
- Full repository suite: 127 PASS, 0 FAIL, 1 environment-gated Graph integration skip.
- Graph integration rerun explicitly against pinned runtime `477bdcc3d390c30eb49d823e5c7fd105fee2cc4d`: PASS with no skip.
- Contract/example validation: 13 files valid.
- TypeScript typecheck: PASS.
- Production dependency audit: no known vulnerabilities.
- Sensitive surfaces unchanged from deployed base `7f465d072f7faf05017b90e1da769e99a047674f`: authentication, repository, HTTP/CSRF boundary, provider registry, contract validation, singleton, worker lock/policy/adapters, package/lock, Docker/Compose and Critic finalizer.
- The only server implementation delta relative to that base remains the bounded `server/execution.mjs` missing-source ID propagation used by the directed upload recovery.

## Fail-closed properties exercised

The expanded suite executes cross-tenant denial, viewer denial, source/reference separation, secret material rejection, CSRF/path traversal/bounded HTTP bodies, state serialization, login concurrency, source/DNA invalidation, Graph crash recovery, job leases, immutable provenance, stale-candidate rejection, separate real Critic/Verifier identities, paid-provider blocking, provider failure blocking, source hash freezing, mascot fail-closed behavior, artifact range authorization/integrity and runtime package allowlisting.

This repair does not claim mascot animation/compositing became operational. That remains an explicit capability limit until an authorized adapter exists.
