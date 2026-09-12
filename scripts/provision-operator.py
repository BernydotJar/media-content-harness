#!/usr/bin/env python3
"""Provision an explicit local operator identity; never prints password material."""
import argparse
import getpass
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--identity-file', type=Path, required=True)
    parser.add_argument('--id', required=True)
    parser.add_argument('--email', required=True)
    parser.add_argument('--name', required=True)
    parser.add_argument('--tenant', action='append', default=[], help='Explicit existing tenant membership (owner)')
    parser.add_argument('--can-create-tenants', action='store_true')
    args = parser.parse_args()
    if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_-]{1,127}', args.id):
        parser.error('invalid user id')
    if len(args.email) > 200 or not args.email.strip() or len(args.name) > 200 or not args.name.strip():
        parser.error('invalid identity fields')
    if any(not re.fullmatch(r'[a-z0-9][a-z0-9-]{1,63}', t) for t in args.tenant):
        parser.error('invalid tenant id')
    identifier = args.email.strip().casefold()
    path = args.identity_file.absolute()
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    if path.is_symlink():
        parser.error('identity file must not be a symlink')
    lock = path.with_name(path.name + '.provision.lock')
    try:
        descriptor = os.open(lock, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    except FileExistsError:
        parser.error('another provisioning operation holds the lock')
    os.close(descriptor)
    temporary = None
    try:
        existing = json.loads(path.read_text()) if path.exists() else {'users': []}
        if not isinstance(existing, dict) or not isinstance(existing.get('users'), list):
            parser.error('invalid existing identity document')
        if any(u.get('id') == args.id or str(u.get('email') or u.get('username') or '').strip().casefold() == identifier for u in existing['users']):
            parser.error('identity already exists; preserve it and perform an explicit credential rotation separately')
        password = getpass.getpass('New operator password (hidden): ')
        if len(password) < 14 or len(password) > 256:
            parser.error('password must be 14–256 characters')
        if getpass.getpass('Repeat password (hidden): ') != password:
            parser.error('passwords do not match')
        salt = secrets.token_bytes(24)
        derived = hashlib.scrypt(password.encode(), salt=salt, n=16384, r=8, p=1, dklen=64, maxmem=64 * 1024 * 1024)
        existing['users'].append({'id': args.id, 'email': identifier, 'name': args.name.strip(), 'password': {'salt': salt.hex(), 'hash': derived.hex()}, 'memberships': [{'tenant_id': t, 'role': 'owner'} for t in sorted(set(args.tenant))], 'can_create_tenants': args.can_create_tenants})
        fd, temporary = tempfile.mkstemp(prefix=path.name + '.', dir=path.parent)
        with os.fdopen(fd, 'w') as output:
            os.fchmod(output.fileno(), 0o600)
            json.dump(existing, output, indent=2)
            output.write('\n')
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, path)
        temporary = None
        print('Operator identity created. Configure MEDIA_FACTORY_IDENTITY_FILE on the server.')
    finally:
        if temporary:
            os.unlink(temporary)
        lock.unlink()


if __name__ == '__main__':
    main()
