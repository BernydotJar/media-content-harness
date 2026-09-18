# WEB023 — Mascot Avatar System v1

Exact candidate: `8faa041ad66d23fce6aa141c9104847bdb72fd4b`

Media Factory now treats the FIRMES Caballito as a reusable tenant-scoped avatar instead of a sticker/reference-only asset.

Implemented:
- `AvatarIdentityPack` with explicit invariants, forbidden drift, brand-marker policy, canonical primary reference and honest `PARTIAL` turnaround status.
- Five outfits: classic, construction, beach, formal and space.
- Ten add-ons including sunglasses, flip-flops, safety helmet, clipboard, microphone, backpack, cap, FIRMES badge/patch and space helmet.
- Eight generative motion presets and five reusable scene packs.
- Deterministic `avatar_contract` and `avatar_authority_sha256` bindings.
- `mascot-scene-compiler.v2` sections for identity lock, outfit, add-ons, FIRMES marker policy and motion.
- `scene-critic-rubric.v2` with identity/marker/outfit/accessory/motion/drift checks.
- Avatar contract and hash in external-generation package and immutable release provenance.
- Worker freshness check before execution.
- Tenant membership-bound avatar catalog/API.
- Transport-neutral MCP-ready contract: `avatar.catalog`, `avatar.compile`, `avatar.critic_plan`.
- Scene Builder controls for Look, Accessories, Movement and quick Scene Packs.

V1 does **not** claim a skeletal 2.5D/3D rig. `rig_profile` is null and mobility is explicitly `GENERATIVE_MOTION`. Missing turnaround views are null and listed as missing rather than fabricated.
