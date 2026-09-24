# WEB054 — public and host reconciliation probe

Exact product SHA: `859586d3bd7c65443c43dd7034f3688519611913`.

## Host reconciler

The existing deployment controller converged this exact SHA at `2026-09-24T15:02:19Z` with:

- L1 release: PASS
- L2 runtime: PASS
- L2 edge network: PASS
- L3 local health: PASS
- L3 recovery: PASS
- L4 Caddy: PASS
- L6 tunnel: PASS
- L7 DNS / L8 TLS / L9 public: PASS
- L9 security: PASS
- L9 authorization: PASS
- reconciler result: `DEPLOYED`
- product status: `public_health=PASS_HTTP_200`, `process_recovery=PASS`

The reconciler's anonymous authorization check correctly returns 401 and its authenticated form-session workspace probe returns 200.

## Independent public observations from this workspace

- anonymous `/health`: HTTP 401 (expected to be protected by the form-session preview boundary)
- public `/login`: HTTP 200

## Authenticated Mac bridge

The authorized Chrome tab was present, but deployment invalidated the previous session and redirected it to `/login`. No credentials, cookies, browser storage, or unrelated tabs were inspected. The V19-specific authenticated bridge assertions therefore remain pending until the operator signs in again.
