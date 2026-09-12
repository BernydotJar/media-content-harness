# Exact candidate independent verification — PASS

Verifier: baseline_audit independent agent. Candidate: `e37805e09e52ff9e8a4928d0be8a01bff57e0838`. Scope: WEB001-SERVICES, WEB002-STUDIO, WEB003-EXECUTION as integrated in this immutable software candidate. This is evidence for the first three implementation nodes; deployment and final product completion require their own gates.

## Identity and immutability

- Git HEAD before and after independent browser execution: `e37805e09e52ff9e8a4928d0be8a01bff57e0838`.
- Worktree clean before the run, during the harness clean checks, and after test process termination. No tracked files were modified until all verification had completed. Only then was this evidence added.
- `scripts/test-e2e.mjs --require-clean` verified current production source hash against the recorded build before execution and rechecked commit, source hash, worktree and BUILD_ID after the walkthrough.
- Build ID: `e7P4kIPneUesMAMfJK5AP`.
- Production source SHA-256: `e6034954c0d2707a6f23da1c25e1a5e793e54811ca6f72af9f7101928f40849d`.
- Configured health release identity matched the same candidate; health confirmed isolated test deployment mode.

## Independent browser execution

Command actually executed by this verifier:

```sh
GRAPH_HARNESS_RUNTIME_ROOT=/home/agent/.cache/media-content-harness/graph-harness-sdlc node scripts/test-e2e.mjs --require-clean
```

Result: PASS, 15/15 checks, 13604 ms. Test flows were authored by the root and reviewed by the UI agent; this verifier executed them against the exact clean candidate. Evidence: `e37805e/independent-browser-e2e.json` and `e37805e/browser-checks.json`.

1. exact health identity.
2. anonymous API denied.
3. login and honest empty dashboard.
4. workspace onboarding and authority-separated sources.
5. reference proof upload and Content DNA.
6. explicit tenant mascot source binding.
7. Guided draft through shared contracts without approval side effects.
8. exact four-video natural-language request strategies.
9. asynchronous real pinned Graph reaches creative human gate.
10. SSE progression and visibly marked deterministic provider fixture.
11. hash-bound release and authenticated downloadable artifact.
12. release library.
13. tenant switching keeps plans separate.
14. responsive mobile navigation and no horizontal overflow.
15. no uncaught browser errors.

The complete actual Graph sequence exercised in-browser was draft -> explicit concept approval -> queued asynchronous job -> creative human gate -> visible test provider fixture -> release human gate -> release library and authenticated download. The test adapter was explicitly labeled; this was not paid provider generation or customer production.

## Release and download integrity

- Media release candidate: `52b3e21b17a57f5034f12e87402f8c31f14df73664e7220947adb44f82281c12`.
- Browser-computed downloaded artifact SHA-256: `0fe5ea45fda5a9cadb8ce1e623c0db288ca849b1d53415539fd8aa4d682c9af1`.
- This verifier separately hashed the stored artifact bytes and confirmed the exact same SHA-256: `0fe5ea45fda5a9cadb8ce1e623c0db288ca849b1d53415539fd8aa4d682c9af1`.
- Persisted release candidate matched the reviewed job candidate, and persisted release artifact hash matched both byte checks.
- Evidence copies deliberately omit identity configuration, sessions, raw product storage and credentials. Safe screenshots and the sanitized server log are included.

## Candidate checks inspected

The root executed these on the same candidate. This verifier inspected their actual logs and copied them into the persistent evidence directory:

- Full pinned-runtime check: 88 tests PASS, 0 failed, 0 skipped; 13 example/contracts valid (`e37805e/candidate-check.log`).
- TypeScript check: PASS (`e37805e/candidate-typecheck.log`).
- Production build: PASS (`e37805e/candidate-build.log`).
- Production dependency audit: no known vulnerabilities (`e37805e/candidate-audit.log`).

These supplement the independent WEB003 runtime, recovery, candidate-equality and test-mode verifications already persisted in `WEB003-independent-verifier.md`. They are identified as inspected root-run checks, not falsely attributed to this verifier's execution.

## Node-level conclusion

- WEB001-SERVICES: PASS for implemented authenticated, tenant-scoped contracts/API, evidence, plan gates and failure behavior. Browser execution independently confirmed sign-in, anonymous 401, source authorization separation, uploaded reference proof, Content DNA, mode convergence, approvals and isolated tenants. Full security/concurrency/service regressions are included in the 88-test candidate run.
- WEB002-STUDIO: PASS for the exercised desktop and mobile flows. Guided and exact Spanish four-video Free planning passed; job review, release library, mobile navigation and no horizontal overflow passed; no uncaught browser errors.
- WEB003-EXECUTION: PASS for implemented actual pinned Graph jobs, SSE projections, authenticated review and hash-bound fixture release/download. Earlier independent production-path fixture confirmed distinct critic/verifier identities and identical verifier/release candidate hashes. Crash/recovery and cost/unsupported-production guards were separately verified.

## Product limits retained

This PASS does not claim executable Seedance/Higgsfield/CapCut integrations, paid generation, mascot compositing, arbitrary automatic creative repair, public deployment, or real customer final-media approvals. Unsupported work must remain visibly blocked. The exact mixed request was verified as four draft contracts; it does not imply all four production strategies can currently render. No social publication was performed.

Evidence file hashes: `e37805e/evidence-sha256.json`. Software release gating must continue to name candidate `e37805e09e52ff9e8a4928d0be8a01bff57e0838`, rather than the later evidence-only commit.
