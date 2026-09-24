# WEB055 — Character Video Generation + Explicit Sticker Mode V20

## Product intent

Close the gap between having a reusable Caballito identity system and actually producing a video in which that character is generated as part of the scene.

V20 makes two operations explicit and separate:

1. **Generate with character** — create a synthetic video in which the approved character reference guides the generated subject.
2. **Add as sticker** — deterministically composite the approved character artwork over existing real footage.

The product must never describe a deterministic overlay as model-generated character video.

## Evidence entering scope

Repository inspection on the merged V19 baseline shows:

- the Scene Builder already carries BrandCharacter, AvatarContract, wardrobe, accessories, motion, environment and prompt compilation;
- the current FFmpeg path scales the mascot image and overlays it in the lower-right corner, which is sticker composition rather than generated embodiment;
- the current Higgsfield adapter is text-to-video only and rejects character-reference jobs;
- the existing manual-external path prepares character references and accepts uploaded results, but does not execute generation in-product;
- Gemini is declared but has no executable adapter.

Current Google Gemini API documentation for Veo 3.1 exposes reference-image video generation using inline image bytes, up to three references, without requiring the reference asset to be publicly hosted. Reference-image generation requires an 8-second output and supports 9:16 or 16:9.

## Architecture

### Generate with character

```text
Scene Builder
  -> BrandCharacter + AvatarContract
  -> hash-bound approved character reference bytes
  -> compiled scene prompt
  -> Gemini / Veo 3.1 Fast provider adapter
  -> explicit spend approval
  -> async long-running generation
  -> downloaded MP4
  -> provenance binds prompt + character reference SHA
  -> existing Critic / Independent Verifier / Release flow
```

### Add as sticker

```text
Authorized real footage
  -> approved Caballito artwork
  -> deterministic FFmpeg overlay
  -> MP4
  -> provenance explicitly says STICKER_OVERLAY
```

No silent fallback is permitted between these modes.

## Provider contract

V20 introduces a server-side Gemini/Veo adapter under the existing `gemini` integration ID.

Required behavior:

- model: `veo-3.1-fast-generate-preview`;
- credential remains server-side in the existing encrypted integration vault;
- direct REST requests use `predictLongRunning`;
- character reference is sent as inline image bytes and `referenceType=asset`;
- at most three approved references are sent;
- character-reference video requires exactly 8 seconds;
- V20 uses the 720p Fast catalog rate checked on 2026-09-24 (USD 0.10 / second), so one reference-video request is estimated at USD 0.80 before the existing GTQ budget policy is applied;
- supported reference-video aspect ratios are 9:16 and 16:9;
- generated video is downloaded immediately after completion because provider retention is temporary;
- no automatic publication;
- existing provider-spend approval remains mandatory;
- submission ambiguity fails closed and never auto-resubmits;
- provider operation ID is persisted before polling;
- output provenance binds the exact character asset SHA and prompt SHA.

## Product UX

Scene Builder must make the distinction visible before creation:

### Crear video con personaje

- defaults to Video;
- keeps the Caballito as the selected subject when available;
- when Gemini/Veo is configured, selects the reference-video route;
- visibly explains that the character will be generated as part of the scene;
- forces the provider-compatible 8-second duration;
- prevents 1:1 for this provider.

### Agregar como sticker

- clearly labels the result as an overlay on real footage;
- never claims that the character was generated into the scene;
- existing deterministic FFmpeg behavior may be reused.

The generic provider picker remains available as advanced disclosure.

## Acceptance criteria

1. A configured Gemini integration is reported as an executable provider.
2. A character-led Guided Scene can select `provider:gemini`.
3. The adapter sends the exact approved character image bytes as a Veo reference image.
4. The adapter rejects missing or changed character reference material.
5. Reference-image jobs require an 8-second video and reject unsupported 1:1 output.
6. Existing explicit paid-provider approval executes before any provider submission.
7. Async provider polling and collection work through the generic provider lifecycle without provider-specific status text leakage.
8. Collected MP4 provenance includes the exact character asset SHA, prompt SHA, model ID and synthetic=true.
9. Deterministic FFmpeg character overlay is labeled `STICKER_OVERLAY` in production note/provenance and UI copy.
10. Scene Builder exposes a clear Generate-with-character path and a separate Sticker explanation.
11. No generation path silently falls back from generated character to sticker, or from sticker to generated character.
12. Unit tests cover request shape, 8-second reference constraint, polling, collection, provenance, spend-gate behavior and mode semantics.
13. Existing full suite, TypeScript, browser E2E and production build remain green.

## Release acceptance

A release cannot be called character-video ready from mocks alone. WEB056 must prove one authorized reference-video job reaches the provider path on the deployed controlled preview. If no funded/configured Gemini API credential is available, WEB055 may be implementation-complete but WEB056 remains blocked rather than fabricating provider evidence.

## Non-goals

- no political-message generation logic;
- no audience targeting or voter profiling;
- no automatic social publication;
- no face replacement or identity inference;
- no attempt to classify a rendered character as a real person;
- no hidden use of browser credentials or consumer Gemini sessions.
