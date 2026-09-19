# Local departmental access V11

## Purpose

V11 adds self-service account requests for departmental users without weakening tenant authorization. Creating an account is not the same as receiving access.

## User flow

1. On `/login`, the person chooses **Crear cuenta**.
2. They provide name, municipality, email, Guatemalan DPI, and a password of at least 12 characters.
3. The request is stored as `PENDING_APPROVAL` with no tenant membership.
4. `owner` or `admin` opens **Equipo** inside that municipality and sees only that municipality's pending requests.
5. The manager approves the request and assigns one of the existing non-owner responsibilities: municipal coordinator (`reviewer`), IT (`admin`), editor, or viewer; or rejects the request.
6. Only after approval can the person sign in by email or DPI plus password for that municipality.

Selecting a municipality at login is context selection, not authorization. The server rechecks the approved membership before creating the session and again while resolving the session.

## DPI handling

The product performs **format validation only**: after spaces and hyphens are removed, a DPI must contain exactly 13 digits. Media Factory does not query RENAP and does not claim government identity verification.

The plaintext DPI is never written to `state.json`, events, Team responses, or the browser after registration. The server stores:

- a keyed HMAC-SHA256 lookup value;
- only the final four digits for administrator disambiguation.

The HMAC key is generated as a 32-byte private file at `<MEDIA_FACTORY_DATA_ROOT>/.local-account-pepper` with mode `0600`. This file is part of durable authentication state and must be preserved with the data volume during host migrations. Losing it does not reveal a DPI, but it prevents DPI lookup until restored; email login remains available.

Passwords are stored only as salted scrypt verifiers. Local configured/break-glass identities remain separate and continue to work.

## Authorization invariants

- registration never creates a membership;
- the public registration response is deliberately generic (`REQUEST_RECEIVED`) whether the email/DPI is new or already known, preventing account/DPI enumeration;
- pending registration state is bounded to 500 requests globally and 100 per municipality, in addition to the in-process request rate limit;
- pending or rejected accounts cannot obtain a product session;
- a valid password is checked before a pending/rejected status is disclosed;
- a self-service login requires an explicitly selected municipality;
- the selected municipality must have a current membership;
- `owner` cannot be self-assigned through registration approval;
- Team management remains restricted to `owner` and `admin` and is revalidated inside the repository transaction;
- removal of the selected municipality membership invalidates an existing self-service session on the next request;
- Team/API output never returns password verifiers or DPI lookup material.

## Municipality catalog

`GET /api/v1/auth/municipalities` is intentionally public because it is needed before login. It returns only:

- `tenant_id`
- `municipality`
- `organization`

No membership, user, source, production, or private tenant data is included.

## API additions

- `GET /api/v1/auth/municipalities`
- `POST /api/v1/auth/register`
- `POST /api/v1/tenants/:tenantId/team/registrations/:userId` with `action=approve|reject`

The existing login endpoint accepts `identifier` (email or DPI), `password`, and `tenant_id`; legacy configured-operator login remains backwards-compatible.
