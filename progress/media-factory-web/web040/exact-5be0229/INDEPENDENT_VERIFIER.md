# Independent verifier — WEB040 V12 release

Exact deployed SHA: `5be0229f08dc280036c7379116ba3ced61eee744`.

Pre-deploy detached verification:
- clean detached worktree at exact SHA;
- V12 contract/API/UI: 4/4 PASS;
- real FFmpeg/Graph V12 execution: 3/3 PASS;
- build/typecheck/contracts/audit PASS;
- FIRMES 19.750 s golden reference PASS;
- browser E2E PASS with the packaged production runtime and `--require-clean`.

Repository-wide exact-SHA verification: 235 tests discovered, 234 PASS, 0 FAIL, 1 pre-existing SKIP.

Post-deploy verification:
- host reconciler converged on the exact SHA;
- internal public health result `PASS_HTTP_200`;
- process recovery `PASS`;
- external login HTTP 200;
- private job/audio and user API routes remain edge-protected at HTTP 401 anonymously.
