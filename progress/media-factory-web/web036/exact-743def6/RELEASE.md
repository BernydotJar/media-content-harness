# WEB036 revision 1 — Local departmental access V11 release

Exact deployed SHA: `743def614d157c4d7bcef83441e88ee69b5b2263`

Public URL: `https://media-factory.textilesdemedellin.com`

This release supersedes `2e5eeb7607dd09697f0120c9791c330a4314e5a1` after the public post-deploy verifier found that Caddy forward authentication blocked the two anonymous client API calls used by registration.

The repair preserves the existing fail-closed edge policy: municipality data is server-rendered into `/login`, and registration reuses the bounded public `/api/preview/login` POST channel. No new anonymous Caddy route was added.

Host reconciliation converged on the exact repair SHA with public health `PASS_HTTP_200`, process recovery `PASS`, no failing layer, and no last error. Public smoke confirms login rendering, registration routing, TLS validation, and continued 401 protection of direct private APIs.
