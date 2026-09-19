# Departmental Access V10

Media Factory keeps departmental access intentionally small.

## Responsibilities

| Product responsibility | Internal role | Human gate |
| --- | --- | --- |
| Propietario | `owner` | Owns the tenant, manages team access, may act at human gates when the independent-review kernel permits it |
| Coordinador municipal | `reviewer` | Content / Critic review |
| IT / Aprobación técnica | `admin` | Independent technical verification and final release |

Existing `editor` and `viewer` roles remain compatible, but they are not the primary V10 invitation choices.

The production kernel still enforces reviewer independence. Departmental role labels do not create a bypass around hash-bound Critic, Independent Verifier, or Release rules.

## Google sign-in

Google is invitation-only. Authentication proves identity; Media Factory remains authoritative for tenant membership and role.

Required server settings:

```text
MEDIA_FACTORY_GOOGLE_CLIENT_ID
MEDIA_FACTORY_GOOGLE_CLIENT_SECRET
```

For the production hostname, register this exact authorized redirect URI in the Google OAuth Web application:

```text
https://media-factory.textilesdemedellin.com/api/v1/auth/google/callback
```

The client must be a confidential **Web application** OAuth client. Media Factory requests only:

```text
openid email profile
```

It does not request Gmail, Drive, Calendar, or offline delegated access. Google access and refresh tokens are not persisted.

The server uses authorization code + PKCE + nonce. OAuth state is one-time, persisted with expiry, and additionally bound to a short-lived HttpOnly SameSite=Lax browser-flow cookie so another browser cannot replay a valid state into the user's session.

## Admission

1. The tenant owner opens **Equipo**.
2. The owner enters the person's email and chooses either **Coordinador municipal** or **IT / Aprobación técnica**.
3. Media Factory records a 14-day pending invitation. It does not claim to send an email.
4. The person opens Media Factory and chooses **Continuar con Google**.
5. Google verifies the identity.
6. Media Factory accepts the account only when the verified email matches a current invitation, then atomically converts that invitation to a tenant membership.
7. Future sign-ins use Google's immutable `sub` as the external identity key.

A valid Google account without an invitation receives no tenant access.

## Break-glass access

The existing local operator username/password remains available below Google sign-in. It is the owner/emergency path and should not become the normal departmental credential model.

## Operational rollout

The code can be deployed with Google unconfigured. In that state the Google button is hidden and local access continues normally. Departmental Google access is considered operational only after the client ID/secret are installed server-side and the exact redirect URI is registered with Google.
