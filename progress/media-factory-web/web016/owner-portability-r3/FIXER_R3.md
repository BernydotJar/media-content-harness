# WEB016 Fixer R3 — cross-platform trust-root ownership

## Failure reproduced

The already-promoted host reconciler rejected the successor-signed Media Factory deployment on the macOS host with `legacy critic public key must be root-owned`. The product candidate was not applied; public production remained on the prior known-good release.

## Root cause

`critic_keyring.py` treated numeric uid `0` as the trust invariant. That is valid inside the Linux sandbox but not on the macOS control-plane host, where the persistent deployment directory is owned by the dedicated local administrator account. The security property required by the release controller is ownership consistency with the trusted control-plane directory, not a platform-specific uid value.

## Repair

1. Added `require_trust_anchor()` to validate the `host-reconciler` directory as a real, non-symlink, non-group/world-writable directory and derive its owner uid.
2. Legacy key, keyring directory and selected content-addressed key must all match that trusted owner uid.
3. Unknown hashes, symlinks, ownership mismatches, writable trust material and content hash mismatches still fail closed.
4. Added adversarial coverage for a simulated macOS-style nonzero owner uid, mismatched owners and a writable trust anchor.
5. Added archive-stable host fixture handling so tests work before or after the initial keyring promotion.
6. Added an audited `--update-resolver` path that changes only `critic_keyring.py` on the exact already-promoted host. It requires the reviewed predecessor module hash, exact host hash, exact legacy/successor key hashes, existing host locks, a backup and atomic replacement. No trust key or host reconciler mutation is required.
7. Preserved the previous resolver as a public test fixture only; no private signing material is versioned.

## Fixer verification

`python3 deploy/critic-keyring/test_critic_keyring.py` => 22/22 PASS.

Key hashes before commit:
- repaired resolver: `3034d6fc5275a04d43bbafdf1b8d828b255974ce38ccb8ffe348945cd4c82889`
- promotion/update controller: `92f8f4373b2394fae710bfcbea0e665bfdc27e6240db83a150dd812102326615`
- tests: `073510be8253a39366794a17808309466cdb1079dd796ca1718610751452a700`
- reviewed predecessor fixture: `22b4ef5c78a3ed089f436121b4229eec70cf54a78da04a71a9a2e57900477afe`

The repair does not modify the Media Factory product candidate `20418c13e51cf07d2f068ba5144affd69f2a91b0`, the historical trust root `b615420...`, the successor trust root `eef80f...`, or the already-promoted host reconciler hash `c0d99f...`.
