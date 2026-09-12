# Public discovery controller helper — Producer and Fixer evidence

Scope: bounded shared-controller proposal and a host-only promotion helper, not an installed control-plane change. Producer: deployment_recovery. Independent Critic: graph_engineer_recovery, recorded separately in WEB005-discovery-controller-critic.md and its final helper review. No live promotion, daemon interruption, registry write, Caddy/tunnel change, credential read, finalizer change or signing action was performed by this producer.

## Final implementation

The exact five-path GET/HEAD opt-in is scoped to media-factory + form_session_single_operator and defaults closed. Reviewed patches reconstruct existing pinned controller/dispatcher bytes with exact hunks and output hashes; inherited controller source is not duplicated in the repository. Both canonical and active dispatcher updates use the same reviewed bytes.

The Mac-only helper accepts the real physical --deployment-root and --proposal-dir, requires actual uid501 and verified installed LaunchDaemon contract, and opens existing execution/registry locks read-only with nonblocking host-local flock in canonical order. It preserves owners/groups/modes and code backups, journals multi-file updates, uses per-file atomic replacement through directory file descriptors, and compares parent device/inode before reading/writing. This is not an indivisible multi-file filesystem transaction. Ordinary failures reverse known bytes; crashes/parent changes preserve evidence and require explicit recovery. No restart is necessary: the existing next 60-second tick loads the changed source.

The required reviewed proposal digest binds manifest, patches, materializer and helper:

`cc2967edaaf00d356c5eaafd3757865bd6d5c6d297fb541069b20ae1582e5e42`

Integrity is separate from authorization. Independent review, the local model Critic and signed exact-candidate release evidence must precede --apply and associate the candidate with this digest. The helper does not fabricate or issue these gates. README contains the exact Mac preflight command; preflight omits --apply, promotion adds it only after those external gates.

## Closed independent findings

- Parent-directory TOCTOU: the first helper could follow a directory exchanged for a symlink between replacements. Fixed by walking every directory with O_NOFOLLOW, anchored dir_fd open/replace/unlink, and expected device/inode checks. Independent regression confirms external destinations remain unchanged and journal becomes RECOVERY_REQUIRED.
- Post-review patch/manifest drift: the first helper accepted coordinated patch and after-hash edits. Fixed by requiring an externally captured reviewed-proposal digest at both apply and rollback and checking it under the locks. Independent regression rejects the changed package before creating backups or mutating targets.

## Existing evidence and freeze

Producer aggregate run and independent final recheck both report 31/31 PASS, zero skips: 6 allowlist tests, 8 independent controller adversarial tests, 15 promotion tests and 2 independent promotion regressions. Coverage includes first/second replacement failures, process interruption/recovery, all-target drift, both locks, readonly locks, mode preservation, backup integrity, registry opt-in rollback refusal, UID/host rejection, symlinks, replaced parent identities and changed proposal digests. Producer aggregate log: /tmp/media-discovery-proposal-tests-final.log. These isolated fixture results are not public deployment evidence.

No further tests were run after the user requested stopping repetition. Only documentation was finalized after the approved 31-test checkpoint. Code is frozen for exact-candidate commit and external review.

## Final proposal files

| File | SHA256 |
| --- | --- |
| deploy/public-discovery/README.md | 32f8877bb7a2cae3db18e6cf3a75a15367ca2abd975a7c8842ac2b87e2e2430a |
| deploy/public-discovery/host_reconciler.patch | e329a40f74cc28fd9274f9f27b2b270a1660c40b0b89e0f1ad1976492e2fd899 |
| deploy/public-discovery/manifest.json | 325acc79c194d560c28ff7571a5eb9fc735f3dd35ac5657630ad5d35f1c19771 |
| deploy/public-discovery/materialize.py | f76aaad201cf6ee9f005a76548e8661be30a5432447ae8609e854f4cf555b7b0 |
| deploy/public-discovery/productctl.patch | 842a405ffcbe84dc8cb444dcc11bc54802d111fdcc646e831404e7c11be8fe28 |
| deploy/public-discovery/promote.py | 04711cac0ad68b75f22bb20d53a8a8310dbf60ef0e01fb4d2bf1af8d4fccc1b7 |
| deploy/public-discovery/test_adversarial.py | 9ba696798cdc26aa0aa47b8e01a84b70edd97f9b904b8315946ab4c8fa56f3b5 |
| deploy/public-discovery/test_promote.py | 8bda15743da674bff816f3a1c06f856c7f6a1091b98106f72eb628cdede061e1 |
| deploy/public-discovery/test_promotion_adversarial.py | e752326e79f1aebe84baa8b1c249c43de9af7cfe69b4d9e9617fd4e2ad71ba11 |
| deploy/public-discovery/test_public_discovery.py | 08825e3b68fc1cba7a2444d05acd7bf07db2bf2bba815fe1064c393dd6a362b8 |
