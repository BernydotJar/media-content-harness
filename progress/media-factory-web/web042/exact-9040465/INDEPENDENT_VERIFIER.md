# Independent verifier — WEB042 V13 release

Exact deployed SHA: `9040465de55b2a9924e6d8699fbe3a47059d4d0b`.

Pre-deploy exact-SHA verification:
- 238 tests discovered, 237 PASS, 0 FAIL, 1 pre-existing SKIP;
- V13 policy boundary tests 4/4 PASS;
- typecheck/build/contracts/audit PASS;
- exact browser E2E PASS;
- detached clean worktree policy tests/build/browser PASS.

Post-deploy verification:
- host reconciler converged on the exact SHA;
- internal health `PASS_HTTP_200`;
- process recovery `PASS`;
- public login HTTP 200;
- private user/job approval APIs remain anonymous-deny at HTTP 401.
