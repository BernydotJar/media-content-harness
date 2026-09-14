# WEB015 — Operational Creation Layer

## Authority

User-directed product-completion scope: operationalize scene creation rather than add another visual-only improvement. This node implements the missing creation layer around the already authorized brand mascot and existing Media Factory job lifecycle.

## Required product contract

1. **Default Brand Mascot is domain state, not a PNG shortcut.**
   - `BrandAsset` stores the exact authorized master asset and SHA.
   - `BrandCharacter` identifies the fictional character and its continuity rules.
   - `TenantBrandProfile.default_mascot_character_id` selects the default for the tenant.
   - No FIRMES-specific character ID may be required by a generic tenant.

2. **Reference roles are semantic and fail closed.**
   - `CHARACTER_IDENTITY_ONLY` may influence character identity only.
   - `ENVIRONMENT_ONLY` may influence the location/environment only.
   - `STYLE_ONLY` may influence visual language only.
   - Character-reference background, props, PPE, industrial context, and accidental wardrobe are not transferable to the environment.
   - Cross-tenant assets, changed hashes, unauthorized rights state, or unknown roles reject execution.

3. **Prompt compilation is structured and deterministic.**
   - A structured scene request is the source of truth.
   - Compilation records request SHA, compiler version, base prompt SHA, optional operator override provenance, final prompt SHA, and resolved reference roles/hashes.
   - The product must preserve the separation between application authority and provider prompt text.

4. **CapCut / Seedance manual operation is a formal provider path.**
   - `manual-external` is an executable operational adapter contract, not a fake API integration.
   - Media Factory prepares the exact prompt/reference package, records a generation attempt, waits for the external result, validates/reimports it into the same job, and resumes the Graph.
   - Seedance, Higgsfield, CapCut, Gemini or other named services may be reported as `INTEGRATION_REQUIRED` unless a real executable adapter is configured.
   - A future automated provider adapter must consume the same scene/prompt/reference/result contract without redesigning the product.

5. **Video is image-first for mascot continuity.**
   - When the requested final medium is video, generate/import a hero image first.
   - The hero image is reviewed before animation.
   - The approved hero-image SHA becomes an explicit input to the video generation package.
   - Final release must bind to the final video, not merely the hero image.

6. **Critic / repair is same-job and verifiable.**
   - Critic evaluates identity, required environment, forbidden elements, composition, output dimensions/ratio and relevant technical constraints.
   - A failed Critic produces an explicit finding and re-enters provider generation on the same job/revision chain.
   - Retry provenance includes `retry_of`; no hidden replacement job may be created.
   - Producer, Critic, Independent Verifier and Release remain separate gated stages in production.

7. **Evidence and provenance are immutable at release.**
   - Generation attempt, prompt/request/compiler hashes, input asset roles/hashes, output SHA, provider/manual execution marker, review candidate, critic/verifier approvals and release artifact are traceable.
   - Paid execution and automatic social publication are not authorized by this node.

## UX acceptance

- Workspace navigation exposes **Escena guiada**.
- FIRMES users can enter scene creation with the Caballito already resolved as default; they do not need to recreate a legacy character profile.
- User can choose no character when desired.
- Scene form exposes environment, action, required/forbidden elements, medium/aspect ratio, and relevant movement/camera controls.
- External generation panel lets an authorized operator copy/use the compiled package and upload the resulting image/video to the same job.
- Critic UI exposes a structured rubric and can request a concrete regeneration finding.

## Verification required before DONE

- Graph/project validation.
- Focused operational-creation tests.
- Full repository tests.
- Typecheck and production build.
- Contract/example validation and production dependency audit.
- Production-mode browser E2E that creates the scene, verifies reference-role separation, enters `WAITING_EXTERNAL_GENERATION`, imports a real bounded artifact, proves same-job retry, proves image-first video sequencing, reaches Critic, independent verifier and release, and validates immutable release provenance.
- Independent Critic/Red Team and Independent Verifier evidence with zero material findings.

## Release boundary

WEB015 completes implementation and exact candidate verification only. WEB016 performs clean-SHA commit/push, signed Granite release authorization, host reconciliation, recovery, public HTTPS verification and terminal evidence.
