# WEB034 revision 1 — Independent Verifier

Exact deployed SHA: `23fe76e9b1c1751ab08ccca92598e49587f627f1`

Verdict: **PASS**.

The host reconciler reports:

- reconciliation state: `converged`;
- last result: `DEPLOYED_CONTROLLED_SINGLE_OPERATOR_PREVIEW`;
- last commit: exact SHA `23fe76e9b1c1751ab08ccca92598e49587f627f1`;
- public health: `PASS_HTTP_200`;
- process recovery: `PASS`;
- first failing layer: none;
- last error: none.

Public verification after reconciliation:

- `/login`: HTTP 200, TLS verification result 0;
- `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llm.txt`, and `/favicon.ico`: HTTP 200 with verified TLS;
- anonymous `/api/v1/auth/google/config`: 401;
- anonymous `/api/v1/me`: 401;
- anonymous `/health`: 401;
- Google sign-in button: absent as expected because no real OAuth client is configured.

The exact browser and FIRMES E2E results are preserved in this directory. No live Google-account smoke is claimed.
