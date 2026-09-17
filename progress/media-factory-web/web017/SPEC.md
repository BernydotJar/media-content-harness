# WEB017 — Same-job creative repair, real-media acceptance and FIRMES favicon

## Problem

A reviewer can request an edit that the current local production stack already knows how to perform (for example, “necesitamos agregar al caballito”), yet the generic repair classifier treats the request as unsupported and blocks the job behind `MANUAL_REPAIR_REQUIRED`. The product then asks the operator to withdraw the requested change or edit the story instead of applying the narrow supported change.

The public product also has no first-class FIRMES favicon/app icon.

## Required behavior

1. Preserve one job and one Graph lineage when a reviewer requests a supported FIRMES mascot edit.
2. Recognize only narrow explicit add/remove-mascot language in Spanish or English; do not pretend arbitrary creative prose is automatically executable.
3. Adding the mascot must require the exact authorized Caballito FIRMES asset and must fail closed if that asset is unavailable or changed.
4. The requested add/remove change must invalidate and re-run the minimum truthful upstream scope needed to bind the new treatment and artifact.
5. The reviewer’s explicit change request may authorize the deterministic creative-gate delta for this narrow repair, but the newly produced media must still return to Critic and the remaining independent/release stages normally.
6. Unsupported creative edits must continue to fail closed as manual rather than being silently claimed as applied.
7. Exercise the repair with real, non-generated source footage available in the repository and produce a playable 9:16 MP4 using the exact authorized Caballito asset. Record the output SHA and media metadata.
8. If the user-named `/Users/.../Downloads` assets are not mounted in Cloud Sandbox, record that fact instead of fabricating access; continue with an authorized repository source for acceptance.
9. Add a FIRMES favicon using the exact authorized white Caballito on a rich red/burgundy background. Provide standard Next.js icon discovery (`app/icon.png`, `app/favicon.ico`, and Apple icon) and test it.
10. Run focused tests, full regression/typecheck/build, production-mode browser acceptance, Critic, Independent Verifier, then release through the existing signed host control plane in WEB018.
11. The end-user production screen must be non-technical by default: compress the 13-node internal graph into four understandable steps (Prepare, Create, Review, Deliver), keep job IDs/hashes/providers/evidence collapsed under optional technical details, and make the next human action visually dominant.
12. A supported mascot repair must read like a direct product action (for example, “Agregar Caballito”), not an infrastructure warning. Secondary/destructive options belong under a quieter “Otras opciones” affordance.
13. FIRMES-facing brand copy should say what the user can do, not expose implementation/versioning language.

## Non-goals

- No arbitrary natural-language video editing claims.
- No new paid provider integration.
- No automatic social publication.
- No mutation of the authorized Caballito source asset.
