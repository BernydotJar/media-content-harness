from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent

spec = importlib.util.spec_from_file_location("critic_keyring", ROOT / "critic_keyring.py")
keyring = importlib.util.module_from_spec(spec)
assert spec.loader
spec.loader.exec_module(keyring)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class CriticKeyringUnitTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.legacy = self.root / "critic_public_key.pem"
        shutil.copy2(
            ROOT / "trusted" / "b61542031a4c61e9ccc270aac3ee2adb464508012d0b979eb40575da43d13e9e.pem",
            self.legacy,
        )
        self.keydir = self.root / "critic_public_keys"
        self.keydir.mkdir()
        self.successor = self.keydir / "eef80f5fd016b7deb7a2f31710ea3b1b814cfb12e6e2e9c90b2ab84febbaa173.pem"
        shutil.copy2(ROOT / "trusted" / self.successor.name, self.successor)

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_legacy_key_remains_trusted(self) -> None:
        found = keyring.resolve_trusted_public_key(legacy_public_key=self.legacy, expected_sha256=sha(self.legacy))
        self.assertEqual(found, self.legacy)

    def test_successor_key_is_selected_by_exact_hash(self) -> None:
        found = keyring.resolve_trusted_public_key(legacy_public_key=self.legacy, expected_sha256=sha(self.successor))
        self.assertEqual(found, self.successor)

    def test_unknown_hash_fails_closed(self) -> None:
        with self.assertRaises(keyring.KeyringError):
            keyring.resolve_trusted_public_key(legacy_public_key=self.legacy, expected_sha256="0" * 64)

    def test_tampered_successor_fails_closed(self) -> None:
        self.successor.write_text("tampered\n")
        with self.assertRaises(keyring.KeyringError):
            keyring.resolve_trusted_public_key(
                legacy_public_key=self.legacy,
                expected_sha256="eef80f5fd016b7deb7a2f31710ea3b1b814cfb12e6e2e9c90b2ab84febbaa173",
            )

    def test_symlinked_successor_fails_closed(self) -> None:
        target = self.root / "target.pem"
        target.write_bytes(self.successor.read_bytes())
        self.successor.unlink()
        self.successor.symlink_to(target)
        with self.assertRaises(keyring.KeyringError):
            keyring.resolve_trusted_public_key(
                legacy_public_key=self.legacy,
                expected_sha256=sha(target),
            )


    def test_group_writable_successor_fails_closed(self) -> None:
        self.successor.chmod(0o664)
        with self.assertRaises(keyring.KeyringError):
            keyring.resolve_trusted_public_key(
                legacy_public_key=self.legacy,
                expected_sha256=sha(self.successor),
            )

    def test_group_writable_keyring_fails_closed(self) -> None:
        self.keydir.chmod(0o775)
        with self.assertRaises(keyring.KeyringError):
            keyring.resolve_trusted_public_key(
                legacy_public_key=self.legacy,
                expected_sha256=sha(self.successor),
            )

    def test_symlinked_keyring_fails_closed(self) -> None:
        external = self.root / "external"
        self.keydir.rename(external)
        self.keydir.symlink_to(external, target_is_directory=True)
        with self.assertRaises(keyring.KeyringError):
            keyring.resolve_trusted_public_key(legacy_public_key=self.legacy, expected_sha256=sha(external / self.successor.name))


class HostVerifierIntegrationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.host_dir = self.root / "host-reconciler"
        self.host_dir.mkdir()
        shutil.copy2(ROOT / "critic_keyring.py", self.host_dir / "critic_keyring.py")

        promote_spec = importlib.util.spec_from_file_location("keyring_promote", ROOT / "promote.py")
        promote = importlib.util.module_from_spec(promote_spec)
        assert promote_spec.loader
        promote_spec.loader.exec_module(promote)
        canonical = Path("/shared-auth/deployment/host-reconciler/host_reconciler.py")
        if not canonical.is_file():
            self.skipTest("canonical shared host reconciler unavailable")
        patched = promote.materialize_host(canonical.read_bytes())
        (self.host_dir / "host_reconciler.py").write_bytes(patched)

        self.private = self.root / "private.pem"
        self.public = self.root / "public.pem"
        subprocess.run(["openssl", "genpkey", "-algorithm", "RSA", "-pkeyopt", "rsa_keygen_bits:2048", "-out", str(self.private)], check=True, capture_output=True)
        subprocess.run(["openssl", "pkey", "-in", str(self.private), "-pubout", "-out", str(self.public)], check=True, capture_output=True)
        self.public_hash = sha(self.public)
        keydir = self.host_dir / "critic_public_keys"
        keydir.mkdir()
        shutil.copy2(self.public, keydir / f"{self.public_hash}.pem")
        shutil.copy2(ROOT / "trusted" / "b61542031a4c61e9ccc270aac3ee2adb464508012d0b979eb40575da43d13e9e.pem", self.host_dir / "critic_public_key.pem")

        sys.path.insert(0, str(self.host_dir))
        host_spec = importlib.util.spec_from_file_location("keyring_host_reconciler", self.host_dir / "host_reconciler.py")
        self.host = importlib.util.module_from_spec(host_spec)
        assert host_spec.loader
        host_spec.loader.exec_module(self.host)

    def tearDown(self) -> None:
        if str(getattr(self, "host_dir", "")) in sys.path:
            sys.path.remove(str(self.host_dir))
        self.tmp.cleanup()

    def _valid_product(self) -> dict[str, object]:
        receipt_rel = Path("receipts/test.json")
        signature_rel = Path("receipts/test.sig")
        receipt_path = self.root / receipt_rel
        signature_path = self.root / signature_rel
        receipt_path.parent.mkdir(parents=True, exist_ok=True)
        release_sha = "1" * 40
        finalizer_sha = "2" * 64
        receipt = {
            "reviewed_sha": release_sha,
            "verdict": "PASS",
            "model": "ibm/granite3.3:2b",
            "critic_workspace": "3b915109-6200-4890-a21b-78fc23fb471c",
            "material_findings_open": 0,
            "signature_algorithm": "rsa-pkcs1v15-sha256",
            "critic_public_key_sha256": self.public_hash,
            "critic_finalizer_sha256": finalizer_sha,
            "raw_response_sha256": "3" * 64,
            "risk_raw_response_sha256": "4" * 64,
            "risk_decision_sha256": "5" * 64,
            "rubric_raw_response_sha256": "6" * 64,
            "rubric_decision_sha256": "7" * 64,
            "rubric": {category: "PASS" for category in self.host.CRITIC_RUBRIC_CATEGORIES},
        }
        receipt_path.write_text(json.dumps(receipt, sort_keys=True) + "\n")
        subprocess.run(["openssl", "dgst", "-sha256", "-sign", str(self.private), "-out", str(signature_path), str(receipt_path)], check=True, capture_output=True)
        return {
            "desired_release_sha": release_sha,
            "critic_receipt": str(receipt_rel),
            "critic_receipt_sha256": sha(receipt_path),
            "critic_signature": str(signature_rel),
            "critic_signature_sha256": sha(signature_path),
            "critic_public_key_sha256": self.public_hash,
            "critic_finalizer_sha256": finalizer_sha,
            "critic_model": "ibm/granite3.3:2b",
            "critic_workspace": "3b915109-6200-4890-a21b-78fc23fb471c",
        }

    def test_new_keyring_signature_verifies(self) -> None:
        product = self._valid_product()
        self.host.verify_critic_signature(product, self.root, self.host_dir / "critic_public_key.pem")

    def test_unknown_key_hash_fails_before_signature_acceptance(self) -> None:
        product = self._valid_product()
        product["critic_public_key_sha256"] = "f" * 64
        with self.assertRaises(self.host.ReconcileError) as ctx:
            self.host.verify_critic_signature(product, self.root, self.host_dir / "critic_public_key.pem")
        self.assertEqual(ctx.exception.layer, "L1_RELEASE")

    def test_signature_key_swap_fails(self) -> None:
        product = self._valid_product()
        other_private = self.root / "other.pem"
        subprocess.run(["openssl", "genpkey", "-algorithm", "RSA", "-pkeyopt", "rsa_keygen_bits:2048", "-out", str(other_private)], check=True, capture_output=True)
        receipt = self.root / str(product["critic_receipt"])
        signature = self.root / str(product["critic_signature"])
        subprocess.run(["openssl", "dgst", "-sha256", "-sign", str(other_private), "-out", str(signature), str(receipt)], check=True, capture_output=True)
        product["critic_signature_sha256"] = sha(signature)
        with self.assertRaises(self.host.ReconcileError):
            self.host.verify_critic_signature(product, self.root, self.host_dir / "critic_public_key.pem")


class PromotionRollbackTests(unittest.TestCase):
    def setUp(self) -> None:
        promote_spec = importlib.util.spec_from_file_location("rotation_promote", ROOT / "promote.py")
        self.promote = importlib.util.module_from_spec(promote_spec)
        assert promote_spec.loader
        promote_spec.loader.exec_module(self.promote)
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name) / "deployment"
        host_dir = self.root / "host-reconciler"
        host_dir.mkdir(parents=True)
        shutil.copy2("/shared-auth/deployment/host-reconciler/host_reconciler.py", host_dir / "host_reconciler.py")
        shutil.copy2(ROOT / "trusted" / "b61542031a4c61e9ccc270aac3ee2adb464508012d0b979eb40575da43d13e9e.pem", host_dir / "critic_public_key.pem")
        (self.root / "control-plane-backups").mkdir()
        (self.root / "host-reconciler.execution.lock").write_text("")
        (self.root / "registry.lock").write_text("")
        (self.root / "registry.json").write_text(json.dumps({"products": {}}))

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_promote_then_rollback_restores_exact_baseline(self) -> None:
        result = self.promote.promote(self.root, apply=True)
        self.assertEqual(result["result"], "PROMOTED")
        self.assertEqual(sha(self.root / "host-reconciler/host_reconciler.py"), self.promote.EXPECTED_AFTER_HOST_SHA256)
        rolled = self.promote.rollback(self.root, Path(result["backup"]))
        self.assertEqual(rolled["result"], "ROLLED_BACK")
        self.assertEqual(sha(self.root / "host-reconciler/host_reconciler.py"), self.promote.BASE_HOST_SHA256)

    def test_rollback_refuses_while_active_product_uses_successor(self) -> None:
        result = self.promote.promote(self.root, apply=True)
        (self.root / "registry.json").write_text(json.dumps({"products": {"media-factory": {"desired_public_state": "active", "critic_public_key_sha256": self.promote.SUCCESSOR_PUBLIC_KEY_SHA256}}}))
        with self.assertRaises(RuntimeError):
            self.promote.rollback(self.root, Path(result["backup"]))

    def test_rollback_refuses_after_historical_successor_receipt_even_when_registry_no_longer_uses_key(self) -> None:
        result = self.promote.promote(self.root, apply=True)
        receipt = self.root / "critic-receipts" / "media-factory" / "historical.json"
        receipt.parent.mkdir(parents=True)
        receipt.write_text(json.dumps({
            "reviewed_sha": "a" * 40,
            "signature_algorithm": "rsa-pkcs1v15-sha256",
            "critic_public_key_sha256": self.promote.SUCCESSOR_PUBLIC_KEY_SHA256,
        }))
        with self.assertRaises(RuntimeError):
            self.promote.rollback(self.root, Path(result["backup"]))


if __name__ == "__main__":
    unittest.main(verbosity=2)
