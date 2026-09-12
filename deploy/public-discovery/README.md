# Reviewed public discovery extension — not installed by this repository

This bounded controller patch allows explicit anonymous GET/HEAD for only `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llm.txt` and `/opengraph-image`, and only for product `media-factory` using `form_session_single_operator`. The dispatcher field defaults to empty and the host independently validates it. Select four text routes when OG already uses the existing public `/_next/static/media/` asset. Omission on a subsequent desired-state request clears the opt-in; include each desired route again. Private APIs, session forward-auth, blocked-path precedence, health Basic Auth and POST login/logout behavior do not widen.

`host_reconciler.patch` and `productctl.patch` reconstruct exact reviewed bytes from exact existing source SHA256 values in `manifest.json`. `materialize.py` rejects changed baseline bytes, changed context, offsets, paths, hunk lengths or unexpected resulting hashes. Full inherited controller copies are deliberately not tracked. Source and active dispatcher payload hashes must agree.

## Ownership and actual host contract

Installed source: `/Users/eduardosacahui/.cloud-sandbox-mcp-data/shared-auth/deployment/host-reconciler/host_reconciler.py` and `host-reconciler/productctl.py`. Active dispatcher: the same deployment root's `productctl.py`. Direct Mac stat confirmed uid501/gid20, modes0644/0644/0755 respectively. The Linux bind mount presents virtual uid0; it is not an authorization fact for the Mac host.

`/Library/LaunchDaemons/com.cloud-sandbox.host-deployment-reconciler.plist` invokes `/opt/anaconda3/bin/python3`, that installed host script and `--user-home /Users/eduardosacahui`. It runs as root (no UserName override), every60seconds and when registry.json changes. Existing execution lock is root-owned0644; registry lock belongs to uid501. Both are opened read-only and flocked locally on the Mac, in canonical execution-then-registry order. Contention aborts immediately without interrupting work. Do not acquire a Linux bind-mount lock as a substitute for the host lock.

The documented installer is `host-reconciler/install_host_reconciler.sh`. It rewrites/restarts the LaunchDaemon and is unnecessary for this source-only change: a subsequent existing tick loads the new script. The helper never invokes sudo, launchctl, Docker, Caddy, Cloudflare, credentials, finalizer or signing tools. It writes only the three manifest targets and its private code backup/journal directory. Product publication remains a separate existing signed release request.

## Review and promotion

The helper defaults to a read-only check. `--apply` is an explicit mutation, and must only follow independent Critic acceptance of these exact changes and authorization through the existing release program. It does not issue its own review verdict or signature. The local model Critic and signed exact-candidate release evidence are external gates required before applying; their review scope must associate this proposal digest with the candidate. The helper verifies integrity and does not validate or replace that external signature/authority. The externally approved `--reviewed-proposal-sha256` binds the manifest, both patches, materializer and helper; preserve the literal digest from the independent review. Do not recompute a changed proposal's digest at apply time and treat that as review.

Current producer proposal digest (must match final independent report): `cc2967edaaf00d356c5eaafd3757865bd6d5c6d297fb541069b20ae1582e5e42`.

On the actual Mac host, with the reviewed checkout/archive's physical path:

```sh
/opt/anaconda3/bin/python3 /Users/eduardosacahui/.cloud-sandbox-mcp-data/workspaces/3b915109-6200-4890-a21b-78fc23fb471c/repo/deploy/public-discovery/promote.py \
  --deployment-root /Users/eduardosacahui/.cloud-sandbox-mcp-data/shared-auth/deployment \
  --proposal-dir /Users/eduardosacahui/.cloud-sandbox-mcp-data/workspaces/3b915109-6200-4890-a21b-78fc23fb471c/repo/deploy/public-discovery \
  --expected-uid 501 \
  --reviewed-proposal-sha256 cc2967edaaf00d356c5eaafd3757865bd6d5c6d297fb541069b20ae1582e5e42
```

Only after review, add `--apply` to that exact command. The helper validates Darwin, the actual passwd home/current UID, physical deployment root and installed daemon contract. Under both nonblocking existing locks it rechecks original file ownership/modes/hashes, materializes reviewed bytes, preserves backups, then uses per-file atomic `os.replace` with directory file descriptors. Every parent component rejects symlinks and target parents must retain the original device/inode. File owner/group/mode are retained. Source/active dispatcher are checked for exact agreement.

This is a journaled multi-file operation under cooperative locks, **not an indivisible three-file filesystem transaction**. Host source changes first and active dispatcher last. Ordinary replacement failures reverse already-known before/after bytes while the locks remain held. A process crash or changed parent directory is fail-closed: retain backup/journal and require explicit recovery. Never follow a changed parent to write a rollback. `PREPARED`/`APPLYING`/`RECOVERY_REQUIRED` journals block a subsequent apply. An interrupted backup preparation that has no complete journal requires operator inspection; no target replacement begins before the complete PREPARED journal is durable.

Successful output reports the backup path under `<deployment-root>/control-plane-backups/media-discovery-.../`. To restore, use the same reviewed command with `--rollback <that exact backup path>` instead of `--apply`. Backups, journal identity, current before/after hashes and metadata are validated. Rollback refuses if any registry product still requests public_get_paths; first submit and reconcile a closing desired-state request through productctl. If a crash occurred before any opt-in request, the original sources can be restored immediately. No generated edge configuration is manually restored by this helper.

After promotion, independently check installed hashes/modes and the normal next daemon tick. Add the desired `--public-get-path` flags to the existing exact-SHA `productctl request-deploy` sequence; keep all signed receipt, immutable bundle, release identity, restart and authorization gates. Verify public HTTPS statuses/MIME, preview robots disallow-all, empty sitemap, generic llms/llm, actual social image bytes, and continued denial of anonymous private APIs/workspaces/jobs. Anonymous unknown URLs remain gated; this does not claim a public edge404.

## Isolated tests

Set `PUBLIC_DISCOVERY_CANONICAL_ROOT` to the verified source directory. Before promotion, the Linux default is `/shared-auth/deployment/host-reconciler`; on Mac use the physical installed `.../deployment/host-reconciler`. After promotion, use the retained original backup's `host-reconciler` directory. Every baseline hash is verified before importing any fixture source.

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s deploy/public-discovery -p 'test_*.py' -v
```

Tests cover exact/default allowlist, legacy output equality, adversarial paths/product/policy/methods, differential zero-fuzz patch reconstruction, read-only default, modes and both locks, all-target drift, failures after first/second replacement, journal recovery, backup alteration, registry rollback constraints, wrong UID/host, symlinks and replaced parent directory identity, and proposal changes after review. All mutation tests use temporary fixture directories. These tests neither promote live infrastructure nor establish public deployment success.
