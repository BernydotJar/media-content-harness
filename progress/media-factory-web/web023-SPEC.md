# WEB023 — Mascot Avatar System v1

## Goal

Replace the current “mascot as sticker/reference image” behavior with a reusable tenant-scoped avatar system that preserves the approved Caballito FIRMES identity while allowing contextual outfits, accessories, motion and environments for both image and video workflows.

The approved product architecture follows the source design: `BrandAsset -> BrandCharacter -> AvatarIdentityPack -> Motion Profile -> Outfit/Add-on System -> Prompt Compiler + Identity Lock -> Photo/Video Render`. fileciteturn1file0

## Product contracts

### Identity invariants
The character must preserve:
- white horse head/fur;
- red mane;
- recognizable face, eyes and muzzle;
- approved mascot proportions and friendly FIRMES personality;
- at least one visible FIRMES brand marker in every branded render;
- tenant-scoped provenance and immutable reference hashes.

### Contextual variables
The user may vary:
- outfit;
- accessories;
- scene/environment;
- pose/action;
- motion preset;
- lighting/camera/style;
- image vs video output.

### V1 catalog
Outfits: base, construction, beach, formal, space.
Accessories: sunglasses, flip-flops, hard hat, clipboard, microphone, backpack, cap, FIRMES chest badge, FIRMES sleeve patch, space helmet.
Motion: idle, walk, wave, point, present, nod, turn, talk-to-camera.
Scene packs: beach, space, Antigua, office, stadium/community.

## Architecture

1. `AvatarIdentityPack`
   - references approved character source;
   - identity invariants + forbidden drift;
   - canonical-view slots with explicit completeness status;
   - brand-marker policy;
   - no invented turnaround assets when they do not exist.

2. `AvatarOutfitDefinition` / `AvatarAccessoryDefinition`
   - slot-based compatibility;
   - required/optional items;
   - conflict rules;
   - brand marker remains mandatory.

3. `AvatarMotionPreset`
   - semantic action, duration range, intensity, compatibility tags;
   - drives generative image-to-video in V1; does not falsely claim a 3D rig.

4. `AvatarScenePack`
   - environment defaults and constraints.

5. `Avatar Compiler`
   - deterministic, content-addressed selection contract;
   - semantic reference roles remain authoritative;
   - emits identity-lock, outfit, add-on, motion and brand-marker sections;
   - operator overrides stay lower priority.

6. `Avatar Critic`
   - identity preservation;
   - FIRMES marker visible;
   - requested add-ons present;
   - outfit/motion/environment match;
   - forbidden drift absent;
   - exact candidate hash remains bound to review.

7. MCP-ready tool contract
   - `avatar.catalog`
   - `avatar.compile`
   - `avatar.critic_plan`
   - transport-neutral handlers reuse the same deterministic product authority; no fake external MCP integration.

8. Product UI
   - Scene Builder exposes Avatar, Look, Accessories, Motion and Scene packs only when a reusable avatar exists;
   - defaults remain simple for non-technical users;
   - current manual/external/provider pipeline remains unchanged.

## V1 truth boundary

V1 is a **generative reusable avatar system**, not a true skeletal 3D rig. Motion presets are structured generation contracts. A future 2.5D/3D rig may be attached without changing the public character identity contract.

## Acceptance

- Existing generic tenants continue to work without any avatar.
- FIRMES gets a default reusable avatar catalog automatically.
- Beach example compiles Caballito + beach outfit + sunglasses + flip-flops + walk/wave with visible FIRMES marker.
- Space example compiles Caballito + space suit + space helmet + floating/presenting with visible FIRMES marker.
- Incompatible accessories fail closed.
- Cross-tenant avatar IDs fail closed.
- Missing identity-pack views are represented as missing, never fabricated.
- Critic rubric contains identity, brand-marker, outfit, accessory, motion, environment and technical checks.
- External package and immutable release provenance include the avatar contract and hashes.
- Browser E2E verifies selection UI and generated prompt sections.
- Full suite, typecheck, build, audit and non-test FIRMES flow pass.
- Release target remains `https://media-factory.textilesdemedellin.com`.
