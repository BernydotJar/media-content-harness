# WEB033 revision 1 — Fixer

Exact repaired SHA: `23fe76e9b1c1751ab08ccca92598e49587f627f1`

## Repair mapping

- **Stale stored-email admission** → invitation creation never grants a membership. Admission occurs only when Google freshly verifies the invited email in the OAuth callback.
- **Incomplete role surface** → explicit mappings now support `reviewer`, `admin`, `editor`, and `viewer`; `owner` is not assignable.
- **Authorization TOCTOU** → owner/admin authority is resolved again against the repository snapshot inside each mutation transaction.
- **Pending invitation overwrite** → existing memberships retain their current role when a matching invitation is accepted.
- **Stale invitations after change/removal** → matching pending invitations are revoked.
- **OIDC hardening** → bounded JSON reads, strict JWT/JWK validation, and controlled JWKS refresh for Google key rotation.
- **Invitation UX** → the product records the invitation, explicitly says no email was sent, and provides a copyable login link.

The encrypted Google OAuth vault, tenant isolation, Graph review kernel, provider spend controls, and publication gates are unchanged.
