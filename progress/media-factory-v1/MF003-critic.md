# MF003 Critic / Red Team

## Findings

1. The first secret-field rule incorrectly treated semantic `sources[].authorization` as browser credentials. Fixed by allowing that field only in the declared source-record path.
2. A generic `authorization` field outside `sources[]` could otherwise be ambiguous. Fixed by rejecting it everywhere except the semantic source record.
3. Isolation needed positive proof, not only collision failures. Added a two-tenant success case with independent tenant IDs, runtime namespaces, browser-context refs, and sources.

## Final conclusion

PASS. Tenant profiles contain only reusable metadata and explicit source authority. Browser/session secrets are rejected, namespace/context collisions fail closed, and public-affairs profiles are hard-limited to general-audience mode with sensitive-trait targeting and voter microtargeting disabled.
