# Critic trust-root keyring rotation

This repair is an owner-authorized, backwards-compatible rotation of the shared release-signing trust root used by the host reconciler.

The historical `critic_public_key.pem` remains unchanged so existing CampaignOS and Media Factory receipts and rollback candidates continue to verify. A successor public key is installed as `critic_public_keys/<sha256>.pem`. `host_reconciler.py` resolves the exact key requested by `critic_public_key_sha256`; unknown hashes, symlinks and content-address mismatches fail closed. There is no latest-key fallback.

Only public verification material is versioned here. The private signer stays in persistent private state and is never copied into the repository, deployment registry, evidence, or release bundle.

`promote.py` targets the exact installed host-controller SHA after the already-reviewed public-discovery promotion. It acquires the existing execution and registry locks, verifies the historical trust root, creates a control-plane backup, and atomically installs the resolver, successor public key and exact patched host controller. Dry-run is the default; `--apply` performs the authorized promotion.

Validation:

```sh
python3 deploy/critic-keyring/test_critic_keyring.py
python3 deploy/critic-keyring/promote.py --deployment-root /shared-auth/deployment
```

After promotion, verify both a historical `b615...` receipt and a new `eef80f...` receipt before issuing a deployment request.
