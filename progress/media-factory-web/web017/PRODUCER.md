# WEB017 Producer

Scope: repair-loop usability, real-media acceptance, and FIRMES favicon.

Implemented:
- Narrow same-job add/remove mascot repair recognition for authenticated reviewer change requests; arbitrary creative prose remains fail-closed/manual.
- Exact phrase from the reported blocked flow, `no, necesitamos agregar al caballito.`, now re-runs from Director Treatment, binds the authorized FIRMES Caballito, produces a fresh artifact, and returns to Critic on the same job.
- Existing `MANUAL_REPAIR_REQUIRED` jobs can use `APPLY_SUPPORTED_CHANGE`; the server reclassifies the stored request and remains authoritative. This allows the already-blocked job shown by the operator to be repaired without withdrawing the requested change.
- First-class tenant brand profile/character/asset fallback for legacy real-footage jobs, hash-bound to `config/brand-assets/firmes-caballito.png` SHA-256 `b17c55ffb0eec46bfa719128ee68a9f18475c45afb90d6d73ce9d82567938397`.
- Specific UI confirmation for supported mascot changes and a direct “Aplicar este cambio en la misma producción” action for legacy compatible blockers.
- Favicon/app-icon family created from the exact authorized Caballito source on burgundy/red background without modifying the source asset.
- Real playable acceptance MP4 created with the production FFmpeg adapter from repository-authorized footage plus the exact Caballito asset: 1080x1920, 8 s, audio present, output SHA-256 `3d25fb6e67074e38c21510ea93cd6f855dc1677e34dbfe24bef6aacb179e8d26`.

Host asset boundary:
The user-named Downloads files are not mounted inside Cloud Sandbox. This is recorded explicitly in `acceptance/requested-host-assets.txt`; no access was fabricated. The real-media acceptance therefore used an authorized repository source.

Verification before exact-candidate Critic:
- focused repair cases PASS, including current exact phrase, legacy blocked-state upgrade, arbitrary-edit fail-closed behavior, and negated add language;
- full Node suite: 150/150 PASS;
- examples/contracts: 13/13 valid;
- TypeScript: PASS;
- production build: PASS;
- production dependency audit: no known vulnerabilities;
- app icon/static routes present in build;
- generic browser suite reached unrelated Radix quick-create keyboard-focus behavior; the test was hardened to accept the standards-compliant ArrowDown focus transition before exact clean rerun.
