# WEB005 — independent controller promotion review

Verdict: **PASS of reviewed source and isolated tests**. No unresolved blocking finding remains in the exact helper package identified below. This report does not claim the helper was applied, a Mac preflight passed, the independent model signed this candidate, or any public endpoint became available.

Reviewer: graph_engineer_recovery. Producer/Fixer: deployment_recovery. All mutation tests used disposable directories in the Cloud Sandbox, never canonical shared files. Review date: 2026-09-12.

Reviewed proposal digest: `cc2967edaaf00d356c5eaafd3757865bd6d5c6d297fb541069b20ae1582e5e42`. This is `promote.package_digest`: the ordered, name-bound SHA256 digest of manifest, both patches, materialize.py and promote.py. Use the recorded digest when invoking the reviewed helper; recomputing a new value after changes is not review approval.

## Findings and independent repair checks

1. **Closed: changed parent could redirect writes and produce false rollback success.** Against initial helper SHA256 `e311960378f8b0cbb7676be3e36c7c67625f95e956ed510a3a450ab07e3e391b`, an isolated after-first-replace probe renamed the host-reconciler directory outside the fixture deployment root and left a symlink. The next write and two rollback writes followed it; the journal said AUTO_ROLLED_BACK. The corrected helper walks every directory component with O_NOFOLLOW, opens files relative to directory descriptors, pins target parents by device/inode, and performs atomic replacements via dir_fd. The independent regression now observes no later write through the changed parent and RECOVERY_REQUIRED. Producer tests also cover substitution by a new real directory.

2. **Closed: changing patch and claimed after hash could evade review identity.** Against the initial helper, changing a harmless literal in the proposed patch and updating its manifest hash was accepted as APPLIED in a disposable fixture. The corrected CLI requires the externally recorded reviewed proposal digest. Apply/rollback check it under both existing locks; apply checks it again after reconstruction, and captured payload hashes must match all captured manifest entries. The independent probe captures the original digest, changes both patch and manifest, and now confirms rejection before backup creation or target mutation. The probe does not provide the new computed digest as authority.

## Safety and compatibility review

The read-only default creates no backup or replacement. The CLI requires Darwin, an explicit non-root host UID matching the actual effective UID and configured home, the canonical host deployment path, and the installed daemon label/arguments/watch/interval contract. It does not sudo, restart a daemon or change a LaunchDaemon. The Mac preflight is still a separate real-host check; Linux fixtures do not establish Mac ownership or permissions.

Both existing execution and registry locks are opened read-only, without following a final or ancestor symlink, and acquired nonblocking in the same execution-before-registry order used by the reconciler. Lock contention fails without waiting. Existing lock files and contents are not replaced. Read-only lock modes are supported. Canonical file ownership, mode, regular-file type, single link count, source hashes and source/active dispatcher equality are checked before backup or replacement. Every target's bytes/inode/metadata are rechecked before its replacement.

The manifest fixes the three target paths and original hashes; exact patch reconstruction rejects mismatched context, offsets, counts, targets or output hashes. Dispatcher source and active dispatcher both receive the same captured bytes. Target permissions and UID/GID are preserved. Backups have private directories and 0600 files, retain original metadata and a recovery journal, and are created before live replacements. The three replacements are atomic individually and serialized under locks; they are **not an indivisible multi-file filesystem transaction**. Host code is replaced first and the active dispatcher last. Ordinary injected failure after the first or second replacement restores all original bytes; simulated process interruption leaves a journal that blocks another apply until explicit recovery. Unexpected path/source drift produces RECOVERY_REQUIRED rather than claiming successful recovery.

Explicit rollback verifies journal, backup content and current before/after hashes, preserves permissions, and refuses while registry desired state still requests public discovery. It reverses the dispatcher-first order and verifies the final originals. The helper contains no Caddy, tunnel, registry-update, finalizer, signing-key or credential mutation and no daemon restart command. It does not cryptographically verify a model signature: that remains the existing separate model/candidate release gate. This digest is integrity evidence and must be associated with the reviewed exact candidate; it does not replace that gate.

## Executed evidence

`python3 -m unittest -v test_public_discovery.py test_adversarial.py test_promote.py test_promotion_adversarial.py` in `deploy/public-discovery`: **31/31 PASS** after the final fixes (6 controller tests, 8 independent controller probes including 326 valid permutations, 15 producer promotion tests and 2 independent promotion regressions). Full output is persisted as `WEB005-discovery-promotion-independent.log` beside this report.

`test_adversarial.py` also independently applies the patches with GNU patch at zero fuzz/no offset and compares the resulting bytes with the custom reconstruct implementation. The package reconstructs from externally retained exact originals; it does not vendor complete shared control-plane source. After installation, PUBLIC_DISCOVERY_CANONICAL_ROOT must refer to the verified pre-promotion backup to rerun this source review.

Final live canonical read-only SHA checks still matched: host `074cfea8afb469c112c87724e892862ffd8dfb2e52863d160349eb8509ee69bd`; source and active dispatcher `f282304749348053bec91fc9607dd1b06f844cb0c9c1c2fc05e475ab5cb8ab69`. No canonical source was changed by this reviewer.

| Reviewed artifact | SHA256 |
| --- | --- |
| promote.py | `04711cac0ad68b75f22bb20d53a8a8310dbf60ef0e01fb4d2bf1af8d4fccc1b7` |
| materialize.py | `f76aaad201cf6ee9f005a76548e8661be30a5432447ae8609e854f4cf555b7b0` |
| manifest.json | `325acc79c194d560c28ff7571a5eb9fc735f3dd35ac5657630ad5d35f1c19771` |
| host_reconciler.patch | `e329a40f74cc28fd9274f9f27b2b270a1660c40b0b89e0f1ad1976492e2fd899` |
| productctl.patch | `842a405ffcbe84dc8cb444dcc11bc54802d111fdcc646e831404e7c11be8fe28` |
| test_public_discovery.py | `08825e3b68fc1cba7a2444d05acd7bf07db2bf2bba815fe1064c393dd6a362b8` |
| test_adversarial.py | `9ba696798cdc26aa0aa47b8e01a84b70edd97f9b904b8315946ab4c8fa56f3b5` |
| test_promote.py | `8bda15743da674bff816f3a1c06f856c7f6a1091b98106f72eb628cdede061e1` |
| test_promotion_adversarial.py | `e752326e79f1aebe84baa8b1c249c43de9af7cfe69b4d9e9617fd4e2ad71ba11` |
