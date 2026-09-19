# WEB031 — Provider Execution Gateway V9

## Objective

Make Media Factory capable of executing a real asynchronous paid generative-media provider without weakening Graph Harness, human review, spend control, provenance, fail-closed behavior, or truthful Creation Room progress.

This is a new scope. V7/V8 remain immutable completed releases.

## Current product truth

- `manual-external` and local `ffmpeg` are operational today.
- `seedance`, `higgsfield`, `capcut`, and `gemini` must never be presented as connected unless executable adapter code exists and required server-side credentials are configured.
- The current Cloud Sandbox runtime has no Higgsfield/Seedance/CapCut credential environment variable configured.
- The user's ChatGPT Higgsfield plugin connection is useful for interactive creation in ChatGPT, but it does not expose or transfer the user's API secret into the Media Factory server. Product execution therefore continues to require an explicit Media Factory server-side Higgsfield API credential.

## Provider target for V9

Primary real provider path: **Higgsfield API → Seedance 2.5**.

Official Higgsfield references checked on 2026-09-18:

- Seedance 2.5 Reference-to-Video model ID: `bytedance/seedance-2.5/reference-to-video`.
- Seedance 2.5 Text-to-Video model ID: `bytedance/seedance-2.5/text-to-video`.
- API base: `https://api.higgsfield.ai`.
- Authentication: `Authorization: Key KEY_ID:KEY_SECRET`, server-side only.
- Queue lifecycle: `queued`, `in_progress`, `completed`, `failed`, `nsfw`; a submit response includes `request_id` and `status_url`.
- Status read: `GET /requests/{request_id}/status`.
- Seedance 2.5 supports 4–30 seconds, 480p/720p, and aspect ratios including 9:16.
- Official provider UI describes current Seedance 2.5 pricing as token-metered with a displayed range of approximately USD 0.144–0.3236/sec depending on configuration. This is a catalog estimate, not a contractual live quote.

Reference pages:
- https://open.higgsfield.ai/models/bytedance/seedance-2.5/reference-to-video/api-reference
- https://open.higgsfield.ai/models/bytedance/seedance-2.5/text-to-video/api-reference
- https://github.com/higgsfield-ai/higgsfield-js

## V9 executable slice

V9 ships the provider gateway and a production-capable **Seedance 2.5 text-to-video** path first.

Why text-to-video first:
- the API accepts the hash-bound compiled prompt directly;
- it avoids falsely exposing authenticated/private Media Factory assets as public URLs;
- it allows the async request ID, spend gate, recovery, telemetry, output collection and provenance system to be proven end-to-end before adding a media-upload bridge.

Reference-to-video remains an explicit next adapter capability. A scene that requires the Caballito, a hero image, or another reference asset must fail closed with `PROVIDER_REFERENCE_UPLOAD_REQUIRED` until a reviewed provider-media upload transport is implemented. It must not silently degrade into text-only generation.

## Provider gateway contract

The existing provider-neutral contract remains:

`capabilities → estimate → prepare → generate → poll → collect → provenance`

V9 adds durable asynchronous execution around it.

### Durable generation attempt

Every paid provider attempt persists:

- `attempt_id`
- `job_id`
- `job_revision`
- `adapter_id`
- `provider`
- `provider_model`
- `request_sha256`
- `prompt_sha256`
- exact input asset SHA-256 values
- exact estimate / currency / estimate kind / catalog timestamp
- human spend approval ID and scope hash
- `provider_request_id`
- provider status
- provider telemetry observations
- output URL only while collection is pending
- output SHA-256 after collection
- cost/credits only when authoritatively returned
- failure code/detail
- retry lineage

A recovered worker with an existing `provider_request_id` must poll that same request. It must never submit another paid request merely because the worker/process restarted.

## Human spend gate

No credit-bearing request may be submitted before explicit authenticated human approval.

Approval scope binds:

`job_id + job_revision + provider + model + request_sha256 + prompt_sha256 + estimate + exact input hashes`

Changing any bound input invalidates approval.

The UI shows a conservative **catalog upper-bound estimate** before approval. For the initial Seedance 2.5 configuration, the estimate uses the provider's currently published upper displayed rate of USD 0.3236/sec, records the catalog check date, and labels the amount as an estimate rather than an exact provider quote.

The product must never label that estimate as final cost.

## Authoritative telemetry contract

Provider telemetry is distinct from Graph workflow completion.

Canonical observation:

```json
{
  "source": "provider",
  "provider": "higgsfield",
  "request_id": "...",
  "status": "queued|in_progress|completed|failed|nsfw",
  "kind": "status",
  "percent": null,
  "observed_at": "..."
}
```

Rules:

1. `percent` may be non-null only when the provider returns a documented authoritative numeric percentage.
2. Higgsfield currently documents lifecycle status, not numeric render percentage. V9 therefore stores `percent: null` for Higgsfield.
3. Creation Room keeps the existing Graph verified-stage percentage.
4. When provider telemetry exists, Creation Room adds a separate provider label: `Higgsfield · En cola`, `Higgsfield · Generando`, etc.
5. Provider status must never overwrite or masquerade as Graph node completion.

## Error / moderation semantics

- `queued` → durable pending provider execution.
- `in_progress` → durable running provider execution.
- `completed` → collect exact media bytes, hash them, technical QA, then Critic.
- `failed` → fail closed with actionable provider blocker; no silent paid retry.
- `nsfw` → fail closed as moderation rejection; no automatic prompt weakening or retry.
- network/5xx during status reads → bounded retry / later recovery.
- request submission must not be automatically retried after an ambiguous response unless idempotence can be proven. If submission outcome is unknown and no request ID is available, fail closed for human resolution rather than risk double spend.

## Availability / credentials

- Adapter code present but no Higgsfield credential → `/providers` reports `CREDENTIAL_REQUIRED`; Higgsfield is not selectable in normal UI.
- Credential can be supplied through the existing encrypted Media Factory integration vault.
- Credentials never return through `/providers`, job JSON, logs, evidence or browser state.
- Invalid credential → adapter request fails closed with `PROVIDER_CREDENTIAL_INVALID`.
- No automatic social publication is granted.

## Output collection

- Only HTTPS provider output URLs are accepted.
- Provider output is downloaded server-side with size and timeout bounds.
- Collected bytes must be playable media and stay under the existing artifact limit.
- Exact SHA-256 becomes the immutable Media Factory artifact identity.
- Provider output remains synthetic and must pass existing Critic / Independent Verifier / release review.

## Verification requirements

Before WEB031 can be DONE:

- configured/unconfigured provider registry tests;
- encrypted-vault credential path tests without returning secret material;
- Seedance request mapping tests;
- human spend approval hash-binding tests;
- stale estimate/input approval invalidation tests;
- async `queued → in_progress → completed` lifecycle tests with fake HTTP transport;
- crash/recovery test proving the same `provider_request_id` is reused and no duplicate generation is submitted;
- `failed` and `nsfw` fail-closed tests;
- ambiguous submit response fails closed without blind retry;
- output download bounds and HTTPS validation tests;
- reference-required scenes fail closed rather than degrading to text-only;
- Creation Room browser/static tests proving provider status is separate from Graph percentage and no fabricated render percentage appears;
- full suite, typecheck, production build, contracts, production audit, browser E2E and existing FIRMES/scene E2E remain green.

## Release scope

WEB032 may deploy the gateway even if no customer API key is configured, provided:

- the adapter is shipped and independently verified;
- production reports Higgsfield as `CREDENTIAL_REQUIRED` rather than connected;
- no paid request has been made during validation;
- existing production remains healthy;
- signed release/recovery/public verification pass.

A live paid provider smoke test is a separate gated operation requiring an actual API credential plus explicit human spend approval. It is not implied by code deployment.
