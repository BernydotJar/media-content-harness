#!/usr/bin/env python3
"""Promote a backwards-compatible critic trust-root keyring.

This is a narrow control-plane migration. It preserves the historical public
key, adds one content-addressed successor public key, and patches the host
reconciler so each signed release selects its exact trusted key by SHA-256.
The private signing key is never copied into the deployment root or repository.
"""

from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import shutil
import tempfile
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE_HOST_SHA256 = "aa40a01781d11f1857382b37037e6806bda6c5dd1235253ad9bafc45868716eb"
EXPECTED_AFTER_HOST_SHA256 = "c0d99f7049cbed4e0ebf5f970d70a0828c35f1603b82e6f69688d6f0d5581bc7"
LEGACY_PUBLIC_KEY_SHA256 = "b61542031a4c61e9ccc270aac3ee2adb464508012d0b979eb40575da43d13e9e"
SUCCESSOR_PUBLIC_KEY_SHA256 = "eef80f5fd016b7deb7a2f31710ea3b1b814cfb12e6e2e9c90b2ab84febbaa173"
PREVIOUS_KEYRING_MODULE_SHA256 = "22b4ef5c78a3ed089f436121b4229eec70cf54a78da04a71a9a2e57900477afe"

IMPORT_NEEDLE = "from uuid import UUID\n"
IMPORT_REPLACEMENT = "from uuid import UUID\n\nfrom critic_keyring import KeyringError, resolve_trusted_public_key\n"
VERIFY_NEEDLE = '''def verify_critic_signature(\n    product: dict[str, Any],\n    deployment_root: Path,\n    public_key: Path,\n) -> None:\n    require(public_key.is_file(), "L1_RELEASE", "critic public key missing")\n'''
VERIFY_REPLACEMENT = '''def verify_critic_signature(\n    product: dict[str, Any],\n    deployment_root: Path,\n    public_key: Path,\n) -> None:\n    try:\n        public_key = resolve_trusted_public_key(\n            legacy_public_key=public_key,\n            expected_sha256=str(product["critic_public_key_sha256"]),\n        )\n    except KeyringError as exc:\n        raise ReconcileError("L1_RELEASE", f"critic trust root rejected: {exc}") from exc\n    require(public_key.is_file(), "L1_RELEASE", "critic public key missing")\n'''


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def utcstamp() -> str:
    return datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")


def materialize_host(source: bytes, *, check_expected: bool = True) -> bytes:
    if sha256_bytes(source) != BASE_HOST_SHA256:
        raise RuntimeError("installed host reconciler baseline hash mismatch")
    text = source.decode("utf-8")
    if text.count(IMPORT_NEEDLE) != 1:
        raise RuntimeError("host reconciler import anchor mismatch")
    if text.count(VERIFY_NEEDLE) != 1:
        raise RuntimeError("host reconciler verifier anchor mismatch")
    text = text.replace(IMPORT_NEEDLE, IMPORT_REPLACEMENT, 1)
    text = text.replace(VERIFY_NEEDLE, VERIFY_REPLACEMENT, 1)
    result = text.encode("utf-8")
    if check_expected and EXPECTED_AFTER_HOST_SHA256 != "TO_BE_FILLED":
        if sha256_bytes(result) != EXPECTED_AFTER_HOST_SHA256:
            raise RuntimeError("materialized host reconciler hash mismatch")
    return result


def dematerialize_host(source: bytes) -> bytes:
    """Recover the exact reviewed baseline from either supported host state."""

    digest = sha256_bytes(source)
    if digest == BASE_HOST_SHA256:
        return source
    if digest != EXPECTED_AFTER_HOST_SHA256:
        raise RuntimeError("installed host reconciler is not a reviewed keyring state")
    text = source.decode("utf-8")
    if text.count(IMPORT_REPLACEMENT) != 1:
        raise RuntimeError("promoted host reconciler import anchor mismatch")
    if text.count(VERIFY_REPLACEMENT) != 1:
        raise RuntimeError("promoted host reconciler verifier anchor mismatch")
    text = text.replace(IMPORT_REPLACEMENT, IMPORT_NEEDLE, 1)
    text = text.replace(VERIFY_REPLACEMENT, VERIFY_NEEDLE, 1)
    result = text.encode("utf-8")
    if sha256_bytes(result) != BASE_HOST_SHA256:
        raise RuntimeError("dematerialized host reconciler hash mismatch")
    return result


@contextmanager
def locked(path: Path):
    if not path.is_file():
        raise RuntimeError(f"required host lock missing: {path}")
    with path.open("r") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def atomic_write(path: Path, body: bytes, mode: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(body)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(temp_name, mode)
        os.replace(temp_name, path)
        directory_fd = os.open(path.parent, os.O_RDONLY | getattr(os, "O_DIRECTORY", 0))
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def verify_inputs(deployment_root: Path) -> tuple[Path, Path, Path, bytes]:
    host_dir = deployment_root / "host-reconciler"
    host = host_dir / "host_reconciler.py"
    legacy = host_dir / "critic_public_key.pem"
    successor = ROOT / "trusted" / f"{SUCCESSOR_PUBLIC_KEY_SHA256}.pem"
    module = ROOT / "critic_keyring.py"
    if sha256_file(host) != BASE_HOST_SHA256:
        raise RuntimeError("installed host reconciler is not the reviewed baseline")
    if sha256_file(legacy) != LEGACY_PUBLIC_KEY_SHA256:
        raise RuntimeError("historical critic public key changed")
    if sha256_file(successor) != SUCCESSOR_PUBLIC_KEY_SHA256:
        raise RuntimeError("successor critic public key does not match its content address")
    if not module.is_file():
        raise RuntimeError("versioned keyring resolver module missing")
    proposed = materialize_host(host.read_bytes())
    return host, legacy, successor, proposed


def promote(deployment_root: Path, *, apply: bool) -> dict[str, object]:
    host, legacy, successor, proposed = verify_inputs(deployment_root)
    host_dir = host.parent
    module_target = host_dir / "critic_keyring.py"
    keyring_dir = host_dir / "critic_public_keys"
    successor_target = keyring_dir / f"{SUCCESSOR_PUBLIC_KEY_SHA256}.pem"
    plan = {
        "operation": "critic_trust_root_keyring_rotation",
        "baseline_host_sha256": BASE_HOST_SHA256,
        "proposed_host_sha256": sha256_bytes(proposed),
        "legacy_public_key_sha256": sha256_file(legacy),
        "successor_public_key_sha256": sha256_file(successor),
        "apply": apply,
    }
    if not apply:
        return plan

    backup = deployment_root / "control-plane-backups" / f"critic-keyring-{utcstamp()}-{os.getpid()}"
    backup.mkdir(parents=True, mode=0o700)
    shutil.copy2(host, backup / "host_reconciler.py")
    shutil.copy2(legacy, backup / "critic_public_key.pem")
    if module_target.exists():
        shutil.copy2(module_target, backup / "critic_keyring.py")
    if successor_target.exists():
        shutil.copy2(successor_target, backup / successor_target.name)

    keyring_dir.mkdir(parents=True, exist_ok=True)
    os.chmod(keyring_dir, 0o755)
    atomic_write(module_target, (ROOT / "critic_keyring.py").read_bytes(), 0o644)
    atomic_write(successor_target, successor.read_bytes(), 0o644)
    atomic_write(host, proposed, host.stat().st_mode & 0o777)

    if sha256_file(host) != sha256_bytes(proposed):
        raise RuntimeError("installed patched host hash mismatch")
    if sha256_file(successor_target) != SUCCESSOR_PUBLIC_KEY_SHA256:
        raise RuntimeError("installed successor key hash mismatch")
    if sha256_file(legacy) != LEGACY_PUBLIC_KEY_SHA256:
        raise RuntimeError("legacy trust root changed during promotion")

    plan.update(
        {
            "backup": str(backup),
            "installed_keyring_module_sha256": sha256_file(module_target),
            "installed_successor_path": str(successor_target),
            "result": "PROMOTED",
        }
    )
    return plan



def update_resolver(deployment_root: Path) -> dict[str, object]:
    """Atomically update only the keyring resolver on an already-promoted host."""

    host_dir = deployment_root / "host-reconciler"
    host = host_dir / "host_reconciler.py"
    legacy = host_dir / "critic_public_key.pem"
    keyring_dir = host_dir / "critic_public_keys"
    successor_target = keyring_dir / f"{SUCCESSOR_PUBLIC_KEY_SHA256}.pem"
    module_target = host_dir / "critic_keyring.py"
    desired_module = ROOT / "critic_keyring.py"

    if sha256_file(host) != EXPECTED_AFTER_HOST_SHA256:
        raise RuntimeError("installed host reconciler is not the reviewed promoted version")
    if sha256_file(legacy) != LEGACY_PUBLIC_KEY_SHA256:
        raise RuntimeError("historical critic public key changed")
    if keyring_dir.is_symlink() or not keyring_dir.is_dir():
        raise RuntimeError("installed critic keyring directory is invalid")
    if successor_target.is_symlink() or sha256_file(successor_target) != SUCCESSOR_PUBLIC_KEY_SHA256:
        raise RuntimeError("installed successor public key changed")
    if module_target.is_symlink() or not module_target.is_file():
        raise RuntimeError("installed keyring resolver is invalid")

    current_hash = sha256_file(module_target)
    desired_hash = sha256_file(desired_module)
    if current_hash == desired_hash:
        return {
            "operation": "critic_keyring_resolver_update",
            "previous_module_sha256": current_hash,
            "installed_module_sha256": desired_hash,
            "result": "ALREADY_UPDATED",
        }
    if current_hash != PREVIOUS_KEYRING_MODULE_SHA256:
        raise RuntimeError("installed keyring resolver is not the reviewed predecessor")

    backup = deployment_root / "control-plane-backups" / f"critic-keyring-resolver-{utcstamp()}-{os.getpid()}"
    backup.mkdir(parents=True, mode=0o700)
    shutil.copy2(module_target, backup / "critic_keyring.py")
    atomic_write(module_target, desired_module.read_bytes(), 0o644)
    if sha256_file(module_target) != desired_hash:
        raise RuntimeError("installed keyring resolver hash mismatch")

    return {
        "operation": "critic_keyring_resolver_update",
        "backup": str(backup),
        "previous_module_sha256": current_hash,
        "installed_module_sha256": desired_hash,
        "result": "UPDATED",
    }


def successor_receipt_references(deployment_root: Path) -> list[str]:
    """Return signed receipt-like JSON files that bind the successor trust root.

    Trust roots are append-only once used. This deliberately scans all JSON
    below the deployment root (excluding control-plane backups) so a future
    product cannot make a successor-signed historical receipt invisible merely
    by moving it to a new product-specific directory. Malformed/unrelated JSON
    is ignored; a receipt-like object naming the successor key is sufficient to
    block trust-root removal.
    """

    refs: list[str] = []
    backup_root = (deployment_root / "control-plane-backups").resolve()
    for path in deployment_root.rglob("*.json"):
        try:
            resolved = path.resolve()
        except OSError:
            continue
        if resolved == backup_root or backup_root in resolved.parents:
            continue
        try:
            value = json.loads(path.read_text())
        except (OSError, UnicodeDecodeError, json.JSONDecodeError):
            continue
        if not isinstance(value, dict):
            continue
        if value.get("critic_public_key_sha256") != SUCCESSOR_PUBLIC_KEY_SHA256:
            continue
        if value.get("signature_algorithm") != "rsa-pkcs1v15-sha256":
            continue
        if not isinstance(value.get("reviewed_sha"), str):
            continue
        refs.append(str(path.relative_to(deployment_root)))
    return sorted(refs)


def rollback(deployment_root: Path, backup: Path) -> dict[str, object]:
    backup_root = (deployment_root / "control-plane-backups").resolve()
    backup = backup.resolve()
    if backup.parent != backup_root or not backup.name.startswith("critic-keyring-"):
        raise RuntimeError("rollback backup is outside the critic-keyring backup root")
    if backup.is_symlink() or not backup.is_dir():
        raise RuntimeError("rollback backup must be a real directory")

    registry = json.loads((deployment_root / "registry.json").read_text())
    users = [
        key
        for key, product in registry.get("products", {}).items()
        if isinstance(product, dict)
        and product.get("critic_public_key_sha256") == SUCCESSOR_PUBLIC_KEY_SHA256
        and product.get("desired_public_state") == "active"
    ]
    if users:
        raise RuntimeError(
            "cannot roll back critic keyring while active products depend on successor key: "
            + ",".join(sorted(users))
        )
    historical_receipts = successor_receipt_references(deployment_root)
    if historical_receipts:
        raise RuntimeError(
            "cannot roll back a trust root after a signed receipt has used it: "
            + ",".join(historical_receipts)
        )

    host_dir = deployment_root / "host-reconciler"
    host = host_dir / "host_reconciler.py"
    legacy = host_dir / "critic_public_key.pem"
    module_target = host_dir / "critic_keyring.py"
    successor_target = host_dir / "critic_public_keys" / f"{SUCCESSOR_PUBLIC_KEY_SHA256}.pem"
    backup_host = backup / "host_reconciler.py"

    if sha256_file(host) != EXPECTED_AFTER_HOST_SHA256:
        raise RuntimeError("current host reconciler is not the promoted keyring version")
    if sha256_file(backup_host) != BASE_HOST_SHA256:
        raise RuntimeError("backup host reconciler hash mismatch")
    if sha256_file(legacy) != LEGACY_PUBLIC_KEY_SHA256:
        raise RuntimeError("historical critic public key changed")
    if module_target.is_file() and sha256_file(module_target) != sha256_file(ROOT / "critic_keyring.py"):
        raise RuntimeError("installed keyring module changed; refusing rollback")
    if successor_target.is_file() and sha256_file(successor_target) != SUCCESSOR_PUBLIC_KEY_SHA256:
        raise RuntimeError("installed successor public key changed; refusing rollback")

    atomic_write(host, backup_host.read_bytes(), host.stat().st_mode & 0o777)
    if module_target.exists():
        module_target.unlink()
    if successor_target.exists():
        successor_target.unlink()
    keydir = host_dir / "critic_public_keys"
    if keydir.is_dir() and not any(keydir.iterdir()):
        keydir.rmdir()

    if sha256_file(host) != BASE_HOST_SHA256:
        raise RuntimeError("rollback host hash mismatch")
    return {
        "operation": "critic_trust_root_keyring_rollback",
        "backup": str(backup),
        "restored_host_sha256": sha256_file(host),
        "legacy_public_key_sha256": sha256_file(legacy),
        "result": "ROLLED_BACK",
    }

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--deployment-root", type=Path, default=Path("/shared-auth/deployment"))
    action = parser.add_mutually_exclusive_group()
    action.add_argument("--apply", action="store_true")
    action.add_argument("--update-resolver", action="store_true")
    action.add_argument("--rollback", type=Path)
    args = parser.parse_args()
    root = args.deployment_root.resolve()
    with locked(root / "host-reconciler.execution.lock"):
        with locked(root / "registry.lock"):
            if args.rollback:
                result = rollback(root, args.rollback)
            elif args.update_resolver:
                result = update_resolver(root)
            else:
                result = promote(root, apply=args.apply)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
