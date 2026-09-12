# MF002 Critic / Red Team

Final review scope: browser policy, source authorization boundary, observation sanitization, Cordis wiring, live authorized-page discovery evidence.

## Material findings and repairs

1. **Configurable allowlist could be widened** — repaired by a canonical read-only allowlist; configuration may only narrow it.
2. **Canonical deny list could be replaced** — repaired by always unioning the immutable deny list with optional extra denies.
3. **Prefix matching used raw string prefix semantics** — repaired with same-origin, path-boundary semantics.
4. **Potential credential-like query data could be persisted in locators** — repaired by rejecting sensitive query-parameter names.
5. **Authorization purpose was not constrained** — repaired to `reference` or `source` only.
6. **Initial generated test/plugin files were truncated by a patch hunk-count error** — repaired before gate evaluation; syntax and tests now pass.

## Final conclusion

PASS. The repository owns only the fail-closed policy and sanitized evidence contract. The authenticated Chrome/CDP session remains an external ephemeral adapter. Mutation, messaging, comments, reactions, publishing, cookies, storage, generic script evaluation, and navigation remain outside the product contract.
