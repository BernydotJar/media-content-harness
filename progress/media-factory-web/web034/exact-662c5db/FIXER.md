# WEB034 Release Fixer

The predecessor candidate `9e4b5089dec3ab4619ae15964d1900db60bf76f7` successfully reconciled to the production host, but public probing exposed a release-edge integration defect: `/api/v1/auth/google/config` remained correctly protected by the existing host forward-auth policy, while the public login client tried to call it anonymously. Therefore Google sign-in could never become visible through the production edge even after secure configuration.

The attempted solution to add that API to the edge public-discovery allowlist was rejected by the reviewed deployment policy. No shared trust-root or edge allowlist was modified.

The product was repaired instead. Exact candidate `662c5dbde18df3fa3637d317a3e399429510a856` resolves Google availability inside the trusted `/login` server component and passes only a boolean to the client. The Google config API remains private. Browser E2E explicitly verifies that the public login no longer depends on an anonymous auth-config request.
