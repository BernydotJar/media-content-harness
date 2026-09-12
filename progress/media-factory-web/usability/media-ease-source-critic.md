# WEB007-EASE — independent backend source Critic

Verdict at the reviewed checkpoint: **CHANGES_REQUESTED**. One P1 and three bounded P2 findings below require fixes. No P0 finding identified. This is read-only adversarial source review, not a rerun of the producer tests. The existing /tmp/media-ease-tests.log reports9/9 PASS; its coverage was read and is credited only for the cases actually present.

## P1 — queued administrative writes retain revoked authority

Location: server/creation-support.mjs updateIntegration and server/integration-vault.mjs set.

updateIntegration resolves admin once, then passes only user.id to vault.set. The vault operation enters AtomicRepository's asynchronous queue. If an administrator loses system_admin or the session is revoked while waiting, the queued callback still writes credentials/preferences and emits an audit entry. AuthService.resolve correctly checks current identity on normal requests, but no second resolution occurs after this queue boundary.

Fix: pass a server-owned authorization callback/session context into set and resolve current permission inside the serialized transaction immediately before the mutation; derive the audit actor from that fresh result. A caller-provided actor id must not replace that authority. Add a new focused case that holds the vault queue, enqueues a mutation, revokes the identity, then releases the queue and expects denial with unchanged vault/audit. The existing revocation test revokes before entering updateIntegration and does not cover this interleaving.

## P2 — clearing a budget silently preserves the previous value

Location: server/integration-vault.mjs set, entry.budget_reference.

The API accepts explicit null, and IntegrationCard sends null when the administrator clears the numeric field. The storage expression `budget_reference ?? prior.budget_reference ?? null` treats null like omission, retaining the old budget while returning saved:true. This is observable incorrect behavior, even though the budget is correctly only an administrative reference.

Fix: distinguish undefined (preserve) from null (clear), e.g. `budget_reference === undefined ? prior.budget_reference ?? null : budget_reference`. Cover number→null and omitted-field preservation with a small new case.

## P2 — the existing-ciphertext key path can still create a replacement key

Location: server/integration-vault.mjs key(hasCiphertext).

key(true) first lstats the existing key, then still enters open(keyPath,'wx'). If the key disappears between the existence observation and the exclusive open, this branch writes a fresh key even though ciphertext already exists. Decryption subsequently fails, but the invariant that missing-key recovery never regenerates/overwrites key material has already been broken.

Fix: when hasCiphertext is true, never execute the creation branch. Open only the existing key using O_NOFOLLOW and validate its owner/mode/length. Missing/unreadable keys must immediately fail closed. The current missing-key test deletes before key(true) begins, so it exercises the initial lstat guard rather than this branch.

## P2 — validate the authenticated-encryption envelope explicitly

Location: server/integration-vault.mjs credential.

Encryption generates12-byte IVs and the full GCM tag, but decryption accepts whatever Buffer.from decodes from stored iv/tag/value and does not fix authTagLength. There is no explicit envelope/version or required IV/tag-length validation. This leaves acceptance of altered encoding and shorter GCM tags to Node's permissive/default behavior, rather than enforcing the generated contract.

Fix: declare the envelope version; require canonical bounded base64 fields, exactly12 decoded IV bytes and16 tag bytes, and createDecipheriv(...,{authTagLength:16}). Keep the provider AAD binding. Return the existing generic VAULT_UNAVAILABLE error for malformed envelopes, with no ciphertext overwrite. Add only focused malformed/truncated-envelope cases; do not rerun unrelated worker/media tests.

## Confirmed correct boundaries

- AuthService returns manage_integrations only for literal system_admin=true. The host fallback is generated only when identityFile is absent; a configured identity named host-operator without the explicit boolean does not gain this power. Tenant owner/admin and can_create_tenants do not confer it. The provisioner adds a separate explicit --system-admin flag, preserving existing identities and avoiding implicit upgrades.
- Management HTTP routes remain under /api/v1/admin/integrations. Existing same-origin CSRF, strict fields, no-store responses, bounded request reading and generic error logging are retained. Unknown providers, deterministic-test, FFmpeg credentials and generic endpoint fields are rejected.
- Vault ciphertext and its bounded redacted audit are in a separate private-integrations repository, not tenant state/job snapshots/events. Responses return status/budget/time, not API keys or cryptographic material. ProviderRegistry availability is unchanged by saved credentials. Connection status remains NOT_CHECKED, the UI explicitly says saving does not activate an adapter or authorize spending, and no provider/network call is added.
- Missing/wrong keys, broad key permissions, a key symlink and provider-swapped ciphertext are covered by the existing producer tests and fail closed in the inspected paths. Ciphertext and its audit share one atomic vault transaction; concurrent set calls share the same repository queue. The remaining queue-authorization and key-creation interleavings are the specific findings above.
- Creative profile reads/saves check tenant membership. Only character/place kinds are accepted, rights_confirmed must be true, reference URLs pass the existing public-locator policy and associated source ids must belong to that tenant. No reference is fetched by these endpoints. Place information is labeled USER_SOURCED_NOT_INDEPENDENTLY_VERIFIED, and characters are represented as declared fictional references.
- Profile revisions/content hashes are computed on the server; request fields cannot inject them. Updating a principal character demotes the prior principal with a new revision/hash. normalizedStories copies the selected tenant-scoped profiles into creative_context, includes that context in definition_sha, and launchPlan deep-copies it again into the job. Later profile edits preserve prior plan/job snapshots rather than silently changing an approved story. Legacy contracts strip only the added transport fields before validation, while the new immutable plan still retains them.
- A selected character forces mascot=true server-side. DIRECTOR_TREATMENT now records the character/place context and clearly marks character composition as requiring an adapter. That treatment reaches the normal human gate. PROVIDER_PRODUCTION still rejects mascot jobs with MASCOT_RENDER_UNAVAILABLE before any adapter prepare/generate call, including test mode; it cannot silently substitute ordinary footage or paid generation. The production worker's existing source, spend, artifact and review guards otherwise remain intact. The parent is handling the one justified changed-stage worker case separately.
- Journey status derives source uploads, plans and actual jobs; it distinguishes a stored link from uploaded bytes and does not infer provider render percentages. Profile snapshots and creative context are visible only through existing tenant-authorized plans/jobs.

## Limits and checkpoint identity

These conclusions apply to the source hashes below, before any subsequent Fixer edits. The nine existing tests are not represented as coverage of the four newly identified cases. No application data, real credential, graph or infrastructure was read or modified by this source review. No test, browser flow, model evaluation or provider request was executed.

| Reviewed source | SHA256 |
| --- | --- |
| server/integration-vault.mjs | d08b5f65cd2522981aa99e377e03fc4c46f0170168de8c1f6b8669d3260d2146 |
| server/creation-support.mjs | 1f5624ab6c318fd0427ce2e196886b9bd5a03a6a8595a502769d07ef1c96208a |
| server/auth.mjs | ffa218153b6e82db6fa772a8c464f823772a5bf71b98371967d986209c64e4a4 |
| server/services.mjs | d0f11ece6930d659ac50860219ac73235e6bb7ca69fd4dbc2385db21a684cc67 |
| server/http.mjs | c686c503d9b445f35aba04439469903655963532f47b872bfc0c7f5ef9bfd1e9 |
| server/execution.mjs | f808dba2d1d09a7ae26d87f51f8ab0fd64081380234eca41cc6fc74e964ab6f5 |
| scripts/provision-operator.py | 0e99bcbdcac7ce4b114e26b37e759409329457a9d34a4c8668745f315924300e |
