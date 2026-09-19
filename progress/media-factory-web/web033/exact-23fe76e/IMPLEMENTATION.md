# WEB033 revision 1 — Departmental Access V10 authorization hotfix

Exact product SHA: `23fe76e9b1c1751ab08ccca92598e49587f627f1`

This revision repairs three post-release findings discovered while auditing the V10 candidate lineage:

1. A previously known Google external identity could be matched by a stored email during invitation and receive a new tenant membership without a fresh Google identity verification.
2. The approved non-owner RBAC model includes `reviewer`, `admin`, `editor`, and `viewer`, but the invitation path exposed only the municipal coordinator/reviewer and IT/admin mappings.
3. Team-management authority was checked before the repository transaction rather than against the same transactional snapshot, leaving a revocation TOCTOU window.

The hotfix centralizes tenant team authority in `server/team-access.mjs`. Invitations stay PENDING until a fresh Google OAuth callback verifies the invited email. Google `sub` remains the immutable provider identity. Existing memberships are never overwritten by an invitation. The role allowlist uses own-property checks and cannot assign `owner`. Local administrative identities and owner memberships remain immutable from Team. Role changes and removals revoke stale pending invitations, and owner/admin authority is revalidated inside the AtomicRepository transaction.

The existing encrypted `GoogleAuthVault` remains authoritative. No plaintext OAuth configuration mechanism replaces it. The parent release fix that renders Google availability server-side on `/login` is preserved.

The Team UI exposes Coordinador municipal, IT / Aprobación técnica, Editor, and Consulta. After registering an invitation it states that no email was sent and presents a shareable `/login` link.

No new npm dependency was added.
