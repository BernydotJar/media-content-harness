# WEB033 — Departmental Access V10

## Objective

Make Media Factory simple enough for a departmental team while preserving tenant isolation, human control and the current local owner account.

The product model is deliberately small:

- **Propietario** — current owner. Manages the team and may approve both review gates.
- **Coordinador municipal** — creative/content approver. Internally uses the existing `reviewer` role.
- **IT / Aprobación técnica** — technical/release approver. Internally uses the existing `admin` role.
- Existing `editor` and `viewer` continue to work for compatibility but are not the primary V10 onboarding choices.

V9 remains immutable and deployed. V10 is a new scope.

## Approval sequence

The existing production lifecycle remains authoritative; V10 only narrows who may act at each human review point.

1. **Creative review / CRITIC**
   - may approve/request changes/reject: `owner` or `reviewer`;
   - UI label for `reviewer`: **Coordinador municipal**.
2. **Final release / RELEASE**
   - may approve/request changes/reject: `owner` or `admin`;
   - UI label for `admin`: **IT / Aprobación técnica**.
3. **Owner override**
   - the tenant owner may act at either gate so the product is usable immediately even when only the owner account exists.
4. Editors/viewers cannot approve either gate.

No automatic approval, publication or provider spend authority is added.

## Team administration

Only the tenant owner may manage V10 team access.

Tenant page `Equipo` supports:

- list active members;
- list pending invitations;
- invite an email as **Coordinador municipal** or **IT / Aprobación técnica**;
- change a non-owner member between those two roles;
- remove a non-owner member;
- revoke a pending invitation.

The owner cannot remove or demote the tenant's only owner through this V10 UI.

## Google sign-in

Google is the primary departmental sign-in path when configured; the existing username/password path remains as owner break-glass access.

### Configuration

Server-only environment variables:

- `MEDIA_FACTORY_GOOGLE_CLIENT_ID`
- `MEDIA_FACTORY_GOOGLE_CLIENT_SECRET`

Redirect URI is derived from the trusted `MEDIA_FACTORY_PUBLIC_ORIGIN` as:

`https://<host>/api/v1/auth/google/callback`

### Flow

- authorization-code flow for a confidential web server client;
- scopes: `openid email profile` only;
- one-time random `state` persisted server-side with expiry;
- PKCE S256 verifier/challenge;
- OIDC `nonce`;
- callback exchanges the code at Google's token endpoint;
- ID token signature verified against Google's JWKS;
- verify issuer, audience, expiry, issued-at, nonce and `email_verified`;
- Google `sub` is the stable user identifier;
- no Google access or refresh token is persisted because Media Factory needs identity only.

### Invitation-only admission

A Google account does **not** create access merely because it authenticates successfully.

A first Google sign-in succeeds only when:

- a non-expired pending invitation exists for the verified email; or
- the same Google `sub` already belongs to a previously admitted Media Factory account.

Accepted invitations are converted atomically into tenant memberships. Google email is used only to match the pre-authorized invitation; the durable external identity is Google `sub`.

## Data model

Repository V1 is extended compatibly with default-empty collections:

- `external_users`
- `invitations`
- `oauth_states`

Existing tenant/job/release data is untouched.

Pending invitation fields include:

- `id`
- `tenant_id`
- lowercase `email`
- role (`reviewer` or `admin`)
- `status`
- `invited_by`
- `created_at`
- `expires_at`
- optional acceptance/revocation metadata

External user fields contain provider, Google `sub`, verified email, display name and timestamps; no OAuth access token is retained.

## Fail-closed behavior

- Google button hidden/disabled when configuration is absent.
- callback rejects missing/expired/replayed state.
- state is one-time-use.
- token exchange/JWKS/claim verification failures return authentication failure without creating a user.
- uninvited first-time Google account returns `ACCESS_NOT_INVITED`.
- invitation email mismatch does not grant access.
- tenant owner is the only team manager.
- role change/removal cannot target the tenant owner in V10.
- municipal coordinator cannot approve RELEASE.
- IT cannot approve CRITIC.
- owner may approve both.
- local username/password sign-in remains available as break-glass access.

## UX

Login:

- primary button: **Continuar con Google** when Google is configured;
- divider: `o acceso administrativo`;
- existing password form remains below for owner/emergency use;
- if Google is not configured, the password form remains fully usable and no fake Google availability is shown.

Team page:

- concise explanation of the three responsibilities;
- no generic IAM terminology;
- invitation form asks only email + responsibility;
- pending and active users are visually distinct;
- approval responsibility is shown in plain Spanish.

Review page:

- CRITIC microcopy says `Aprobación de contenido · Coordinación municipal`;
- RELEASE microcopy says `Aprobación técnica · IT`;
- owner sees `Puedes aprobar como propietario` where appropriate.

## Verification

Required before DONE:

- repository backward-compatibility tests;
- local password login regression;
- Google configuration availability tests;
- OAuth start state/PKCE/nonce tests;
- callback state replay/expiry rejection;
- ID token issuer/audience/expiry/nonce/email verification tests using fake JWKS/token transport;
- invitation-only first-login tests;
- atomic invitation→membership acceptance tests;
- tenant isolation tests for team management;
- owner-only invite/change/remove tests;
- stage-specific municipal/IT approval authorization tests;
- owner override tests;
- browser E2E for simple login surface, team invite surface and role-specific review copy;
- full suite, typecheck, production build, contract examples, production audit and existing FIRMES/browser journeys remain green.

## Release behavior

WEB034 may deploy with Google OAuth unconfigured. In that state the existing local owner login remains available and Google is truthfully unavailable. The departmental Google flow becomes active only after the server-side client ID and secret are configured and the authorized redirect URI is registered with Google.
