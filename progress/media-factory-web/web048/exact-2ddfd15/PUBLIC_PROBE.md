# Public probe

Public URL: `https://media-factory.textilesdemedellin.com`
Exact deployed SHA: `2ddfd159e3f4f585b2c4b88162701adf2a179c49`

Host reconciler result: `DEPLOYED`
- L1_RELEASE: PASS
- L2_RUNTIME: PASS
- L2_EDGE_NETWORK: PASS
- L3_LOCAL_HEALTH: PASS
- L3_RECOVERY: PASS
- L4_CADDY: PASS
- L6_TUNNEL: PASS
- L7_DNS_L8_TLS_L9_PUBLIC: PASS
- L9_SECURITY: PASS
- L9_AUTHORIZATION: PASS

Independent HTTP probes:
- `/login` -> 200
- `/robots.txt` -> 200
- `/sitemap.xml` -> 200
- `/llms.txt` -> 200
- anonymous `/health` -> 401 at the edge
- anonymous `/api/v1/me` -> 401

Registry: `reconciliation_state=converged`, `public_health=PASS_HTTP_200`, `process_recovery=PASS`, `last_error=null`.
