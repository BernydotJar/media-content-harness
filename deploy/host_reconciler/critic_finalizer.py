#!/usr/bin/env python3
"""Versioned policy engine for final IBM Granite release receipts.

The private key is supplied only by the central Critic workspace. This module
contains no secret material. It signs only raw Ollama `/api/chat` responses
that prove the exact release risk verdict and all ten enterprise rubric gates
passed for the SHA named inside each model decision. Unbound legacy decisions
and decisions from another release are rejected before output creation.
The finalizer's own SHA-256 is embedded in the receipt so requester and
host can bind release authority to the reviewed policy implementation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

MODEL = "ibm/granite3.3:2b"
CRITIC_WORKSPACE = "3b915109-6200-4890-a21b-78fc23fb471c"
SIGNATURE_ALGORITHM = "rsa-pkcs1v15-sha256"
SHA_RE = re.compile(r"^[0-9a-f]{40}$")
RUBRIC_CATEGORIES = (
    "architecture",
    "security_privacy",
    "supply_chain",
    "agent_tool_governance",
    "state_concurrency",
    "evidence_release_integrity",
    "fail_closed_behavior",
    "testing",
    "operations_recovery",
    "portability",
)


class FinalizerError(RuntimeError):
    """Fail-closed finalizer policy error."""


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def bytes_sha256(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonical_sha256(value: object) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return bytes_sha256(encoded)


def read_json_object(path: Path, label: str) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as exc:
        raise FinalizerError(f"{label} is not valid JSON") from exc
    if not isinstance(value, dict):
        raise FinalizerError(f"{label} must be a JSON object")
    return value


def raw_chat_content(path: Path, label: str) -> dict[str, Any]:
    outer = read_json_object(path, f"{label} raw response")
    if outer.get("model") != MODEL:
        raise FinalizerError(f"{label} raw response model mismatch")
    if outer.get("done") is not True or outer.get("done_reason") != "stop":
        raise FinalizerError(f"{label} raw response is incomplete")
    message = outer.get("message")
    if not isinstance(message, dict) or message.get("role") != "assistant":
        raise FinalizerError(f"{label} raw response message is invalid")
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise FinalizerError(f"{label} raw response content is missing")
    try:
        decision = json.loads(content)
    except json.JSONDecodeError as exc:
        raise FinalizerError(f"{label} model content is not valid JSON") from exc
    if not isinstance(decision, dict):
        raise FinalizerError(f"{label} model content must be a JSON object")
    return decision


def verify_risk(path: Path, *, expected_sha: str) -> dict[str, Any]:
    decision = raw_chat_content(path, "risk")
    if set(decision) != {"reviewed_sha", "v", "f"}:
        raise FinalizerError("risk decision fields mismatch")
    if decision["reviewed_sha"] != expected_sha:
        raise FinalizerError("risk reviewed SHA mismatch")
    if decision["v"] != "P" or decision["f"] != "NONE":
        raise FinalizerError("risk verdict is not PASS with zero material findings")
    return decision


def verify_rubric(path: Path, *, expected_sha: str) -> dict[str, Any]:
    decision = raw_chat_content(path, "rubric")
    if set(decision) != {"reviewed_sha", *RUBRIC_CATEGORIES}:
        raise FinalizerError("rubric categories mismatch")
    if decision["reviewed_sha"] != expected_sha:
        raise FinalizerError("rubric reviewed SHA mismatch")
    if any(decision[category] != "P" for category in RUBRIC_CATEGORIES):
        raise FinalizerError("rubric contains non-PASS category")
    return decision


def verify_keypair(private_key: Path, public_key: Path) -> str:
    if not private_key.is_file():
        raise FinalizerError("private signing key missing")
    if private_key.stat().st_mode & 0o077:
        raise FinalizerError("private signing key permissions are too broad")
    if private_key.stat().st_uid != os.geteuid():
        raise FinalizerError("private signing key owner mismatch")
    if not public_key.is_file():
        raise FinalizerError("critic public key missing")
    openssl = shutil.which("openssl")
    if not openssl:
        raise FinalizerError("openssl is required")
    derived = subprocess.run(  # noqa: S603 - resolved OpenSSL executable, fixed arguments.
        [openssl, "pkey", "-in", str(private_key), "-pubout"],
        capture_output=True,
        check=False,
    )
    if derived.returncode != 0:
        raise FinalizerError("private signing key could not derive a public key")
    if bytes_sha256(derived.stdout) != file_sha256(public_key):
        raise FinalizerError("private/public key mismatch")
    return openssl


def finalize(
    *,
    sha: str,
    risk_raw: Path,
    rubric_raw: Path,
    private_key: Path,
    public_key: Path,
    output_root: Path,
) -> tuple[Path, Path, dict[str, Any]]:
    if not SHA_RE.fullmatch(sha):
        raise FinalizerError("invalid exact release SHA")
    openssl = verify_keypair(private_key, public_key)
    risk = verify_risk(risk_raw, expected_sha=sha)
    rubric = verify_rubric(rubric_raw, expected_sha=sha)
    finalizer_hash = file_sha256(Path(__file__).resolve())
    risk_raw_hash = file_sha256(risk_raw)
    rubric_raw_hash = file_sha256(rubric_raw)
    response_manifest = {
        "risk_raw_response_sha256": risk_raw_hash,
        "risk_decision_sha256": canonical_sha256(risk),
        "rubric_raw_response_sha256": rubric_raw_hash,
        "rubric_decision_sha256": canonical_sha256(rubric),
    }
    receipt: dict[str, Any] = {
        "reviewed_sha": sha,
        "verdict": "PASS",
        "model": MODEL,
        "critic_workspace": CRITIC_WORKSPACE,
        "material_findings_open": 0,
        "signature_algorithm": SIGNATURE_ALGORITHM,
        "critic_public_key_sha256": file_sha256(public_key),
        "critic_finalizer_sha256": finalizer_hash,
        "raw_response_sha256": canonical_sha256(response_manifest),
        **response_manifest,
        "rubric": {category: "PASS" for category in RUBRIC_CATEGORIES},
        "recorded_at": datetime.now(UTC).isoformat(),
    }
    output_root.mkdir(parents=True, exist_ok=True)
    receipt_path = output_root / f"campaignos-{sha}-final.json"
    signature_path = output_root / f"campaignos-{sha}-final.sig"
    lock_path = output_root / f".campaignos-{sha}-final.lock"
    if receipt_path.exists() or signature_path.exists():
        raise FinalizerError("immutable final receipt already exists")
    try:
        lock_fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError as exc:
        raise FinalizerError("final receipt is already being created") from exc
    os.close(lock_fd)
    temp_receipt: Path | None = None
    temp_signature: Path | None = None
    try:
        fd, receipt_name = tempfile.mkstemp(
            prefix=f"campaignos-{sha}.", suffix=".json.tmp", dir=output_root
        )
        os.close(fd)
        temp_receipt = Path(receipt_name)
        temp_receipt.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")
        os.chmod(temp_receipt, 0o644)
        fd, signature_name = tempfile.mkstemp(
            prefix=f"campaignos-{sha}.", suffix=".sig.tmp", dir=output_root
        )
        os.close(fd)
        temp_signature = Path(signature_name)
        result = subprocess.run(  # noqa: S603 - resolved OpenSSL executable, fixed arguments.
            [
                openssl,
                "dgst",
                "-sha256",
                "-sign",
                str(private_key),
                "-out",
                str(temp_signature),
                str(temp_receipt),
            ],
            capture_output=True,
            check=False,
        )
        if result.returncode != 0:
            raise FinalizerError("receipt signing failed")
        verify = subprocess.run(  # noqa: S603 - resolved OpenSSL executable, fixed arguments.
            [
                openssl,
                "dgst",
                "-sha256",
                "-verify",
                str(public_key),
                "-signature",
                str(temp_signature),
                str(temp_receipt),
            ],
            capture_output=True,
            check=False,
        )
        if verify.returncode != 0:
            raise FinalizerError("post-sign verification failed")
        os.chmod(temp_signature, 0o644)
        os.replace(temp_signature, signature_path)
        temp_signature = None
        os.replace(temp_receipt, receipt_path)
        temp_receipt = None
    finally:
        lock_path.unlink(missing_ok=True)
        if temp_receipt is not None:
            temp_receipt.unlink(missing_ok=True)
        if temp_signature is not None:
            temp_signature.unlink(missing_ok=True)
    return receipt_path, signature_path, receipt


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sha", required=True)
    parser.add_argument("--risk-raw", type=Path, required=True)
    parser.add_argument("--rubric-raw", type=Path, required=True)
    parser.add_argument("--private-key", type=Path, required=True)
    parser.add_argument("--public-key", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    args = parser.parse_args()
    try:
        receipt, signature, body = finalize(
            sha=args.sha,
            risk_raw=args.risk_raw.resolve(),
            rubric_raw=args.rubric_raw.resolve(),
            private_key=args.private_key.resolve(),
            public_key=args.public_key.resolve(),
            output_root=args.output_root.resolve(),
        )
    except FinalizerError as exc:
        parser.error(str(exc))
    print(
        json.dumps(
            {
                "receipt": str(receipt),
                "receipt_sha256": file_sha256(receipt),
                "signature": str(signature),
                "signature_sha256": file_sha256(signature),
                "critic_public_key_sha256": body["critic_public_key_sha256"],
                "critic_finalizer_sha256": body["critic_finalizer_sha256"],
            },
            sort_keys=True,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
