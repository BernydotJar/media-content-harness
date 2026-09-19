# WEB034 revision 1 — Departmental Access V10 authorization hotfix release

Product SHA: `23fe76e9b1c1751ab08ccca92598e49587f627f1`

Public URL: `https://media-factory.textilesdemedellin.com`

This release supersedes deployed parent `662c5dbde18df3fa3637d317a3e399429510a856` after a post-release authorization audit found stale stored-email admission, incomplete editor/viewer invitation mappings, and a team-management authorization TOCTOU.

The exact hotfix was built, tested, independently verified, reviewed by IBM Granite, cryptographically finalized, and reconciled through the existing host-reconciler path.

The product registry is converged on the exact hotfix SHA with public health and process recovery PASS.

Google remains intentionally unavailable until the owner supplies a real Google OAuth Web client and registers the exact callback URI documented by the product. No additional application deployment is required after that external setup because OAuth configuration is stored in the encrypted persistent vault.
