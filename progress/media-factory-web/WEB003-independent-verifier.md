# WEB003 independent verification — PASS for implemented scope

Reviewer: baseline_audit independent agent, 2026-09-12. This report supersedes the open findings in `WEB003-independent-critic.md`; it does not overwrite that historical critique. No worker source files were edited by this reviewer.

## Verified result

PASS for the repaired asynchronous Graph worker, human review and local rendering scope. All five initial P1 findings are resolved. The captured-role P2 is closed after reviewing the journal semantics: `pending_review` is the same previously authenticated, durably accepted decision bound to actor, action, candidate hash and review stage. Recovery finishes that decision; it does not grant a fresh approval or authorize a changed candidate. Current source/DNA/candidate checks remain enforced during replay, and new HTTP actions still resolve current authentication/membership.

This is not a claim that paid providers, mascot compositing, or arbitrary creative edits are implemented. They are explicitly blocked without producing misleading output, and remain product delivery limits.

## Independent executions

- Executed the initial complete worker suite against actual pinned Graph runtime: 17/17 PASS, zero skipped. Transcript: `WEB003-independent-worker-tests.txt`.
- After two additional tests were added, executed kernel lease exclusion/stale-file recovery and rejection journal crash recovery: 2/2 PASS, zero skipped. Transcript: `WEB003-independent-additional-tests.txt`. Thus all 19 current test cases were independently exercised.
- After the final lock hardening, re-executed all five affected lock/restart/approve/repair/reject recovery cases: 5/5 PASS, zero skipped. Transcript: `WEB003-independent-final-lock-tests.txt`.
- Independently exercised the production execution path using an isolated synthetic fixture and distinct producer, critic and verifier identities. Verified equality between Independent Verifier candidate, RELEASE candidate and persisted release candidate: `6c36cdcde033b6350971ee04f3b6f37278bb030ea0a3fb618ec2c3298dfa3dbf`. Artifact SHA: `fd22f7f31bcadcf53a1e7b42b9a0f3558f2efa32528cd2dc53760d92e1cb5f8b`. Evidence: `WEB003-independent-candidate-equality.json`. No customer production or public publishing occurred; temporary fixture was removed.

## Finding disposition

1. Candidate identity: stage is separated from the stable media manifest; mandatory `review_stage` prevents a replay against a later stage sharing the same media hash. Verifier/release equality independently tested.
2. Mascot request: fails closed at Director Treatment with `MASCOT_RENDER_UNAVAILABLE`; no ordinary-footage artifact is misrepresented as fulfilling character compositing.
3. Cost authority: actual capabilities and estimate are checked before `prepare`/`generate`; unknown or nonzero credit/cost authority is blocked. Fake paid adapter regression proves no generation invocation.
4. Repair/reject crash windows: durable action intents precede Graph mutation; recovery deduplicates failure events and completes the original decision. Crash-injection tests passed for approve, repair and reject.
5. Lease recovery: replaced stale PID/reclaim ownership with kernel flock. Final implementation opens the file descriptor in Node with O_NOFOLLOW, passes that descriptor to Python for lock acquisition, waits for the helper to exit, and keeps Node's shared open-file description alive until the protected operation completes. Helper exit cannot release an active lease; Node exit releases the kernel lease. Exclusion/recovery tests passed.
6. Captured role: accepted durable decision replay, not an authorization cache for new actions; see scope analysis above.

## Exact verified file identities

- `server/execution.mjs`: `fc79ca381282d8afdd1ce47391cd99ece5c46f34b65e6dac7cf3e8bc05b4f126`
- `server/worker-policy.mjs`: `dca6630b541f500e6d7ea71ee486a3a29b18a4593d5c4c1024879dc7a4b701e4`
- `server/worker-adapters.mjs`: `e1cfa6404ae1c1694561bf04ba16b9150b243ec8974e3ce00fd13149a71d0cdf`
- `server/worker-lock.mjs`: `5565b67f2fc80bc50dcbf318c0b873bbbeead1b8c8f2f2d46111b8778a29a20e`
- `tests/web-execution.test.mjs`: `57404557255f1ae9f82dd4959158436e18a7acb3a206dbc2306f809fd549e38d`

Release Gate must bind its software candidate to these verified source identities (or require re-verification after changes). Final deployment, browser E2E and product terminal assessment belong to their separate gates.

## Final projection addendum — PASS

A narrow post-review fix makes `job.test` a server-owned execution flag before Graph work starts, preserves it in projections and rejects stored execution-mode mismatches. Independent targeted execution passed both affected cases, 2/2 with zero skips: test fixtures are visibly test-labeled through creative review and release, while production-mode missing-source jobs explicitly remain `test: false`. Transcript: `WEB003-independent-test-mode-projection.txt`.

The following updated identities supersede the two earlier identities above; all other verified worker identities remain unchanged:

- `server/execution.mjs`: `68a426821b9b2e180ddbaf849b5e7843addac0bb7b66a2cb2ecb99201b9c58a8`
- `tests/web-execution.test.mjs`: `4c1009239adc0dd2b7569261d21826a056e6049e077a3746379b928ea0616b41`
