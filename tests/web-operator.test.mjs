import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, statSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { scryptSync } from 'node:crypto'
import { spawnSync } from 'node:child_process'

test('operator provisioning uses interoperable private verifiers and preserves an existing identity', () => {
  const directory = mkdtempSync(join(tmpdir(), 'media-operator-test-'))
  try {
    const target = join(directory, 'identities.json')
    const script = `import getpass,runpy,sys\ntarget=sys.argv[1]\ngetpass.getpass=lambda prompt:'isolated-test-password-only'\nsys.argv=['scripts/provision-operator.py','--identity-file',target,'--id','test-operator','--email','operator@example.invalid','--name','Test','--can-create-tenants']\nrunpy.run_path('scripts/provision-operator.py',run_name='__main__')`
    const run = () => spawnSync('/usr/bin/python3', ['-c', script, target], { encoding: 'utf8' })
    const created = run()
    assert.equal(created.status, 0, created.stderr)
    assert.equal(created.stdout.includes('isolated-test-password-only'), false)
    const before = readFileSync(target, 'utf8')
    const user = JSON.parse(before).users[0]
    assert.equal(scryptSync('isolated-test-password-only', Buffer.from(user.password.salt, 'hex'), 64).toString('hex'), user.password.hash)
    assert.equal(statSync(target).mode & 0o777, 0o600)
    assert.equal(user.can_create_tenants, true)
    assert.deepEqual(user.memberships, [])
    assert.notEqual(run().status, 0)
    assert.equal(readFileSync(target, 'utf8'), before)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
