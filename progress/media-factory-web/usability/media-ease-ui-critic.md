# Independent UI Critic — ease of creation

Status: CHANGES REQUIRED. Source review only; no browser flow, existing suite, media worker tests, deployment smoke or credentials used. Root is preparing the single changed-flow browser verification. Findings below are code-derived, not reported as dynamically reproduced.

## P1 — Removing a profile silently restores it on save

Location: components/planner.tsx:20 (save), :39 (opening saved stories), :43 (selection handlers); server/services.mjs:36.

Open a saved plan whose story has creative_context.character/place, choose “Sin personaje” or “Sin ficha de lugar”, and save a changed draft. The control sets character_id/place_id to null, but save maps `story.character_id || creative_context?.character?.id || null` (same for place). This reattaches the original profile. For character, normalizedStories also returns mascot:true because the resurrected ID exists, despite the user's unchecked mascot flag. The saved/approved plan can contradict the visible choice. Normalize legacy IDs once when opening; subsequent save must preserve explicit null and discard stale context fallback.

## P1 — New principal profile is disconnected from Free Mode

Location: components/CreativeProfiles.tsx:6; components/planner.tsx:19,28,30; server/services.mjs:57; server/intent.mjs:21.

The new screen saves the Firmes horse into creative_profiles and declares it principal, but freeDraft calls interpretDraft with only tenant and DNA. The interpreter still requires tenant.brand.mascot_asset_key and never sees the profile. A workspace configured exclusively through the new character flow receives “Configure an authorized mascot asset…” for the caballito request. Selecting that profile afterward in StoryEditor does not clear clarifications; save stays disabled while clarifications.length>0. Bridge the principal authorized profile into Free interpretation/snapshot resolution, while keeping render-unavailable truth and explicit human approval.

## P2 — Late profile fetch can overwrite a draft already being edited

Location: components/planner.tsx:13.

The query-seeding effect waits for profiles but then unconditionally calls setStories with one new story. It does not check whether the user typed, added stories or opened a saved plan while profiles were loading. A slow profile response can replace that work. Seed before exposing the editor, or only while untouched and invalidate seeding once the user edits/opens another plan.

## P2 — The new stepper bypasses the validation it communicates

Location: components/planner.tsx:15,18,30,37.

Every numbered step calls go(i) directly. The material/DNA/story validation exists only in advanceStep, so clicking “Aprobación” or “Producción” from the first page bypasses it and marks all earlier steps complete with checks based solely on i<step. This does not bypass server approval, but gives a false completion signal and contradicts the requested field-before-advance guidance. Route forward navigation through prerequisite validation; completed styling should reflect prerequisites or durable states. Empty/non-Monday week also has no contextual client validation before leaving Contexto; the required date is outside a form and the server error appears only at save.

## P2 — Progress CTA can start a fresh plan while referring to an existing one

Location: server/creation-support.mjs:15 (journey); components/CreationGuide.tsx:5; components/planner.tsx:39.

For an existing DRAFT or APPROVED plan, next.href is only /workspace/id/weekly. That opens an empty Contexto wizard rather than the plan the label promises to review/produce; the saved plan must be found farther down and opened manually. For active or released jobs with no attention blocker, next retains “Crear mi primera historia”. The heading can say work is active while the main directional CTA describes a first story. Include a specific plan ID in the deep link and recover it explicitly, or label the generic destination truthfully. Active/released states should point to the actual job/delivery or “Crear otra historia”.

## P2 — Budget reference cannot be cleared, and successful save can show the old value

Location: components/Integrations.tsx:5; server/integration-vault.mjs:11.

Blanking the budget input sends budget_reference:null, but the vault applies `budget_reference ?? prior.budget_reference ?? null`, preserving the previous value. The UI nevertheless says configuration saved. Separately, form.reset() restores the old defaultValue before reload; the same mounted uncontrolled form can continue showing the old budget until remount. Define null as explicit clear and undefined as preserve, and sync the displayed value to the returned persisted setting after successful save.

## P2 — In-flight plan save can acknowledge content different from the editor

Location: components/planner.tsx:20-21,43.

Only action buttons use busy; story fields remain editable. If the user changes a title/profile while save awaits the server, updateStories clears saved, but the older save response then sets saved to the prior content. The editor shows the new content while the approval button targets the older saved plan (approve submits only IDs). Disable editing during save or bind responses to an editor revision and refuse to expose approval for a different visible revision. This behavior existed for story fields before this addendum but also affects the newly introduced profile choices and remains a data-integrity risk in the changed flow.

## Operational claims reviewed without a blocking finding

- Integration UI explicitly distinguishes stored credentials, unverified connections and unavailable adapters; budget text does not claim a spend cap or approval.
- API administration visibility uses manage_integrations; backend independently resolves the current actor and denies tenant-owner-only access.
- Character/place forms identify fictional reference and user-sourced facts; saved profile is explicitly not a generated render.
- Job/release UI preserves explicit human approval, test-artifact labels, actual job identifiers and absence of an invented render percentage.
- No source edit or graph mutation was made by this reviewer.

## Source snapshot

Recorded UTC: 2026-09-12T22:26:48.472292+00:00

- `specs/media-factory-web/EASE_OF_CREATION.md`: `bed3d93809da08d202ae47f4269dbaed4932a5a39b25c33d876177c2460ffa26`
- `components/CreationGuide.tsx`: `fdecc35a0f4d832a4c88332e79d1c992218b41cf3c61dcebbd1eff183be58143`
- `components/CreativeProfiles.tsx`: `a5da958af42d9b37061b36e9fd5b25bbd62efddf400bb8246b508cbb35e6bd12`
- `components/Integrations.tsx`: `b3db9a2050551c90c261750a2db4e2181b4f3573a6f09131b3acd2f3cbccdeda`
- `components/planner.tsx`: `ff46ef0cd09d52af867c8e1a9c31e01db5e410a73cd44b64e03f83a25fdc9d52`
- `components/jobs.tsx`: `1782933a2c34935840cdc07af6b493b4528141677ab56a4e927695f2e03b16a8`
- `components/workspace.tsx`: `444a503dc4e6293680af4a36faa068181ead256335a74da1419f5906cabac024`
- `components/studio.tsx`: `c4c0e5730ef75a134830dd8c98f317b7648aae34400634979eb8f4c3b3ccde1d`
- `components/ui.tsx`: `e38286b3795975b11ddc167831a498b6b515f4d42a01c6c27f60448da730b433`
- `app/globals.css`: `8bc3424bf3ad9c0a67443886bd9b73775da30128d42a135ad6025753cb30366a`
- `server/creation-support.mjs`: `1f5624ab6c318fd0427ce2e196886b9bd5a03a6a8595a502769d07ef1c96208a`
- `server/integration-vault.mjs`: `d08b5f65cd2522981aa99e377e03fc4c46f0170168de8c1f6b8669d3260d2146`
- `server/services.mjs`: `d0f11ece6930d659ac50860219ac73235e6bb7ca69fd4dbc2385db21a684cc67`
- `server/intent.mjs`: `5a2b72336bbed8e693a4c76fb71afad7786a7f9b1e524f97704c411f1a1a2323`
