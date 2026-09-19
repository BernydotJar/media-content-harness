# WEB033 Departmental Access V10 — Implementation

Exact product SHA: `9e4b5089dec3ab4619ae15964d1900db60bf76f7`.

## Product model

V10 keeps the departmental access model intentionally small:

- `owner` → **Propietario**. Owns the tenant, manages non-owner team access and remains local break-glass/system operator.
- `reviewer` → **Coordinador municipal**. Owns content/CRITIC review and concept approval.
- `admin` → **IT / Aprobación técnica**. Owns independent technical verification, final release, provider spend authority inherited from existing admin policy, and non-owner team administration.
- legacy `editor` and `viewer` remain compatible but are not primary V10 invitation choices.

The existing execution kernel remains authoritative for reviewer independence. Role labels do not bypass producer-vs-reviewer or Critic-vs-Independent-Verifier separation.

## Google sign-in

Google is identity only. Media Factory remains authoritative for admission, tenant membership and role.

- confidential authorization-code flow;
- PKCE S256;
- server-persisted one-time state with 10-minute expiry and bounded cardinality;
- OIDC nonce;
- state additionally bound to a short-lived HttpOnly SameSite=Lax browser-flow cookie;
- token exchange only at Google's token endpoint;
- RS256/JWKS verification;
- issuer, audience, `azp` for multi-audience, expiry, issued-at, nonce, `email_verified` and authoritative Gmail/Workspace email checks;
- Google `sub` is the durable external identity;
- no Google access/refresh token is persisted.

A first Google login is admitted only when a live invitation matches the verified email. Invitation acceptance and membership creation occur atomically.

## Persistent encrypted Google configuration

A release-readiness finding identified that the host reconciler intentionally rewrites its runtime env and does not preserve arbitrary new environment keys. V10 therefore does not depend on persistent env injection for Google.

The current system operator can configure the Web OAuth Client ID/Secret from **Equipo**. The secret is stored in `private-google-auth` using the same product-private storage boundary pattern as other integrations:

- AES-256-GCM;
- client ID bound as AAD;
- dedicated 0600 owner-checked key file;
- secret is never returned by product APIs;
- corrupted ciphertext fails closed and cannot be silently overwritten;
- config replacement changes the OAuth config hash, invalidating flows that began under the prior config.

Environment variables remain an optional bootstrap fallback.

## Team administration

Owner and IT/admin can:

- create a 14-day invitation by email;
- choose Coordinador municipal or IT responsibility;
- change a non-owner member between those roles;
- remove a non-owner member;
- revoke a pending invitation.

The tenant owner is immutable from this UI. Coordinators cannot administer memberships. Cross-tenant access is denied server-side.

## UI

The tenant **Equipo** surface presents three plain-language responsibilities, a collapsed Google-access setup card after configuration, a minimal invitation form, active members, pending invitations, and role-specific approval copy. Password login remains visible as local administrative contingency.
