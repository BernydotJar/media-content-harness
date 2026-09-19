# WEB034 — Departmental Access V10 Release

## Exact product candidate

`662c5dbde18df3fa3637d317a3e399429510a856`

This supersedes the predecessor `9e4b5089dec3ab4619ae15964d1900db60bf76f7` for release only. WEB033 implementation evidence for `9e4b508...` remains immutable; `662c5db...` is a narrow release repair that removes the login page's dependency on an anonymous auth-config API call.

## Public destination

`https://media-factory.textilesdemedellin.com`

## Release scope

Deploy the exact repaired candidate while preserving:

- current local owner/password break-glass access;
- tenant-scoped membership enforcement;
- simple departmental roles: Propietario, Coordinador municipal, IT / Aprobación técnica;
- owner/IT management of non-owner tenant access;
- invitation-only Google identity admission;
- encrypted persistent Google OAuth configuration in product private storage;
- existing Graph independent-review rules;
- provider spend and publication gates unchanged.

## Edge bootstrap repair

A real deployment of the predecessor showed that the host correctly keeps `/api/v1/auth/google/config` behind forward authentication. The public login page had attempted to call that API anonymously, so it could never discover that Google had been configured.

The repaired candidate keeps the API private. `/login` now resolves Google availability inside the trusted server component and passes only a boolean to the client. No auth API is added to the public edge allowlist.

## Google rollout truthfulness

A real Google OAuth Web client is not available in the current environment and no live Google account smoke is authorized or claimed by this release.

Immediately after deploy Google is expected to remain unavailable until the current system owner configures Google from **Equipo** and registers the exact callback URI:

`https://media-factory.textilesdemedellin.com/api/v1/auth/google/callback`

No second application release is required after that setup because the credential is encrypted in the persistent Media Factory data volume.

## Public verification

Required:

- host reconciles to exact product SHA `662c5db...`;
- `/login` returns 200 over verified TLS;
- public discovery routes remain 200;
- anonymous private APIs, including `/api/v1/auth/google/config`, remain 401 at the edge;
- login HTML renders without requiring an anonymous Google-config request;
- favicon is byte-exact with candidate;
- public health and process recovery remain PASS;
- no temporary trycloudflare hostname is introduced.
