# WEB016 — Operational Creation Release

## Candidate authority

Release the exact operational-creation candidate `20418c13e51cf07d2f068ba5144affd69f2a91b0`, which passed WEB015 exact-clean verification. Product source SHA-256: `dda83de709e3208758d9c2a437a3541e804750405052a3b3dcba0666c1b99644`.

## Required release lifecycle

1. Preserve the exact committed source; do not amend or rebuild the candidate from a dirty tree.
2. Produce a Git archive for that SHA and bind it by SHA-256.
3. Run the independent IBM Granite 3.3 2B release risk review and 10-category enterprise rubric against the exact candidate dossier.
4. Accept only `P/NONE`, all ten rubric categories `P`, model stop completion, and zero material findings.
5. Produce the detached signed Critic receipt using the established trusted finalizer/private authority; the host receives only the trusted public key and verifies receipt/signature hashes.
6. Request deployment through the existing shared `productctl` / host reconciler. Do not create a new tunnel, reverse proxy or paid infrastructure.
7. Require host reconciliation PASS for release, runtime, edge network, local health, restart recovery, Caddy, existing tunnel, DNS/TLS/public HTTPS, security and authorization.
8. Verify the public URL and authenticated product boundary after deployment. Anonymous private API/health access must remain denied while intended public discovery routes remain available.
9. Persist Critic, Independent Verifier, deployment and public-smoke evidence against the exact release SHA.
10. Close the Graph only if the deployed SHA is exactly the signed candidate and there are zero open material findings.

## Release invariants

- `manual-external` remains a truthful manual operational path; no named provider is claimed configured without a real adapter.
- No paid provider execution is authorized by this release.
- No automatic social publication is authorized.
- Durable product state is preserved across software reconciliation/restart.
- Rollback continues through the existing signed immutable release mechanism.

## Terminal acceptance

WEB016 may transition to DONE only when the signed exact candidate is pushed, host reconciliation converges, public health/security evidence passes, the final Graph validates, and every project node is DONE with no READY/repair-required work remaining.
