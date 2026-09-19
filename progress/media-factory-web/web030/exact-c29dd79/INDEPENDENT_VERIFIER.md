# WEB030 Release Independent Verifier

## Verdict: PASS

The authorized host control plane converged on the exact signed V8 candidate:

- `desired_release_sha == last_commit == c29dd79cac99e15371d8344868f62a8b1b670112`;
- reconciliation state = `converged`;
- result = `DEPLOYED_CONTROLLED_SINGLE_OPERATOR_PREVIEW`;
- public health = `PASS_HTTP_200`;
- process recovery = `PASS`;
- no first failing layer;
- no last error.

Public verification confirms TLS success and preserves private boundaries:

- `/login`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llm.txt`, `/favicon.ico` return 200;
- anonymous `/api/v1/me` returns 401;
- anonymous `/api/v1/me/onboarding` returns 401;
- anonymous `/health` returns 401;
- the public favicon is byte-exact with the signed candidate.

The authenticated onboarding UX was verified before signing against this same exact SHA by the source-bound browser E2E, including desktop and 390px mobile first-run screens, tenant creation into `/workspace/:id/start`, manual `Guía rápida` access and no horizontal overflow. Host reconciliation binds those assertions to the public deployed source candidate.
