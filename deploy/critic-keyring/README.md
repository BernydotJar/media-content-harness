# Critic trust-root keyring rotation

This repair is an owner-authorized, backwards-compatible rotation of the shared release-signing trust root used by the host reconciler.

The historical `critic_public_key.pem` remains unchanged so existing CampaignOS and Media Factory receipts and rollback candidates continue to verify. A successor public key is installed as `critic_public_keys/<sha256>.pem`. `host_reconciler.py` resolves the exact key requested by `critic_public_key_sha256`; unknown hashes, symlinks, ownership mismatches and content-address mismatches fail closed. Ownership is anchored to the trusted `host-reconciler` directory owner rather than assuming Linux uid 0, so the same invariant works on the macOS host. There is no latest-key fallback.

Only public verification material is versioned here. The private signer stays in persistent private state and is never copied into the repository, deployment registry, evidence, or release bundle.

`promote.py` targets the exact installed host-controller SHA after the already-reviewed public-discovery promotion. It acquires the existing execution and registry locks, verifies the historical trust root, creates a control-plane backup, and atomically installs the resolver, successor public key and exact patched host controller. Dry-run is the default; `--apply` performs the authorized promotion. After the initial promotion, `--update-resolver` is the only supported narrow mutation for a reviewed resolver repair: it requires the exact promoted host SHA, exact historical/successor key hashes, the exact reviewed predecessor module hash, both existing host locks, a control-plane backup, and an atomic replacement of only `critic_keyring.py`.

Validation:

```sh
python3 deploy/critic-keyring/test_critic_keyring.py
python3 deploy/critic-keyring/promote.py --deployment-root /shared-auth/deployment
python3 deploy/critic-keyring/promote.py --deployment-root /shared-auth/deployment --update-resolver
```

After promotion, verify both a historical `b615...` receipt and a new `eef80f...` receipt before issuing a deployment request.
