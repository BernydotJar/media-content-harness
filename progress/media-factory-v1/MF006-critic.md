# MF006 Release Critic / Red Team

Candidate: `a09c0728f94b82d5efc2b5ee83ccdfbb0584d2d1`

## Release review

- The verified candidate contains the reusable Media Factory v1 control plane rather than claiming an embedded editor.
- The real pinned Graph Harness integration executes in tests; it is not silently skipped.
- Tenant runtime namespaces and browser-context references are isolated.
- Browser/session credentials are not product state; the repository owns only a fail-closed read-only policy and sanitized observation contract.
- Reference observations retain provenance while Content DNA retains abstractions; direct text reuse, shot-for-shot copying, and source-audio reuse are disabled.
- Weekly jobs require authorized production sources, human approval, and enter the existing graph at `BRIEF`.
- Weekly planning has `publication_action: none`; social publication is not an implicit side effect.
- Public-affairs support remains general-audience only; sensitive-trait targeting and voter microtargeting are disabled by contract.
- The release verifier ran against the exact candidate SHA with a clean worktree and passed all deterministic checks.

## Final conclusion

PASS. No material release blocker remains in the verified Media Factory v1 control-plane scope. Chrome, Gemini, CapCut, Seedance, and platform-side publication remain explicit external execution surfaces and are not overclaimed as part of this release.
