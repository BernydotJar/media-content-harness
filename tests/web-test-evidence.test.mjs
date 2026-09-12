import test from 'node:test'
import assert from 'node:assert/strict'
import { redactTestOutput } from '../scripts/redact-test-output.mjs'
test('browser exception call logs redact fixture passwords before reporting',()=>{const password='isolated-fixture-secret';const raw='locator.fill failed value="'+password+'"\nPassword: '+password;assert.equal(redactTestOutput(raw,password).includes(password),false);assert.equal(redactTestOutput(raw,password).split('[redacted]').length,3)})
