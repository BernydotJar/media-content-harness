# WEB034 — Departmental Access V10 release

Product SHA: `662c5dbde18df3fa3637d317a3e399429510a856`

Public URL: `https://media-factory.textilesdemedellin.com`

The exact signed V10 release converged on the persistent host after a release-edge bootstrap repair. The login page now resolves Google availability server-side, while the Google configuration API remains protected by the existing edge authorization boundary.

Public verification:

- `/login`: HTTP 200 with verified TLS;
- discovery routes and favicon: HTTP 200;
- favicon bytes: exact match with the signed candidate;
- anonymous `/api/v1/auth/google/config`: 401 by design;
- anonymous `/api/v1/me`, `/api/v1/providers`, `/health`: 401;
- public health: PASS_HTTP_200;
- process recovery: PASS;
- reconciliation: converged;
- no failing layer or last error.

Google is intentionally not yet active because no real Google OAuth Web client has been supplied. The owner can configure it after deploy from **Equipo**, using the exact callback URI documented in the product. No application redeploy is required after that configuration.
