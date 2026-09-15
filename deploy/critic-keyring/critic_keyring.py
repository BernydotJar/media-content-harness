#!/usr/bin/env python3
"""Fail-closed critic public-key resolution for host release verification.

The historical ``critic_public_key.pem`` remains a compatibility trust root.
Additional trusted public keys live in ``critic_public_keys/<sha256>.pem``.
The release request selects the exact trusted key by SHA-256; no key is chosen
by recency, filename aliases, or fallback order.
"""

from __future__ import annotations

import hashlib
import re
import stat
from pathlib import Path

HASH_RE = re.compile(r"^[0-9a-f]{64}$")
KEYRING_DIR_NAME = "critic_public_keys"


class KeyringError(RuntimeError):
    """Raised when the requested release-signing key is not exactly trusted."""


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def require_regular_file(path: Path, label: str) -> None:
    try:
        info = path.lstat()
    except FileNotFoundError as exc:
        raise KeyringError(f"{label} missing") from exc
    if stat.S_ISLNK(info.st_mode):
        raise KeyringError(f"{label} must not be a symlink")
    if not stat.S_ISREG(info.st_mode):
        raise KeyringError(f"{label} must be a regular file")


def require_directory(path: Path, label: str) -> None:
    try:
        info = path.lstat()
    except FileNotFoundError as exc:
        raise KeyringError(f"{label} missing") from exc
    if stat.S_ISLNK(info.st_mode):
        raise KeyringError(f"{label} must not be a symlink")
    if not stat.S_ISDIR(info.st_mode):
        raise KeyringError(f"{label} must be a directory")


def resolve_trusted_public_key(*, legacy_public_key: Path, expected_sha256: str) -> Path:
    """Return the exact trusted public key selected by ``expected_sha256``.

    Historical releases keep working through the legacy single-key path. New
    keys must be explicitly provisioned under a content-addressed keyring. An
    unknown hash, tampered key, or symlink fails closed.
    """

    if not HASH_RE.fullmatch(expected_sha256):
        raise KeyringError("critic public key hash is invalid")

    require_regular_file(legacy_public_key, "legacy critic public key")
    if file_sha256(legacy_public_key) == expected_sha256:
        return legacy_public_key

    keyring = legacy_public_key.parent / KEYRING_DIR_NAME
    require_directory(keyring, "critic public keyring")
    candidate = keyring / f"{expected_sha256}.pem"
    require_regular_file(candidate, "requested critic public key")
    if file_sha256(candidate) != expected_sha256:
        raise KeyringError("requested critic public key hash mismatch")
    return candidate
