import assert from 'node:assert/strict'
import test from 'node:test'

import {
  MediaBrowserPolicyError,
  apply,
  authorizeBrowserSource,
  resolveBrowserPolicy,
  sanitizeBrowserObservation,
} from '../plugins/media-browser-policy.mjs'

const PAGE = 'https://www.facebook.com/people/Firmes-Izabal/61593278846959/'
const AUTH = {
  id: 'firmes-izabal-reference',
  locator: PAGE,
  match: 'exact',
  purpose: 'reference',
}

test('requires fail-closed read-only policy', () => {
  assert.throws(() => resolveBrowserPolicy({ readOnly: true }), /failClosed=true/)
  assert.throws(() => resolveBrowserPolicy({ failClosed: true }), /readOnly=true/)
  const policy = resolveBrowserPolicy({ failClosed: true, readOnly: true })
  assert.equal(policy.readOnly, true)
  assert.ok(policy.deniedOperations.includes('publish'))
  assert.ok(policy.deniedOperations.includes('message'))
  assert.ok(policy.deniedOperations.includes('evaluate-script'))
})

test('authorizes only the explicit source scope', () => {
  const policy = resolveBrowserPolicy({ failClosed: true, readOnly: true })
  const granted = authorizeBrowserSource({
    locator: PAGE,
    authorization: AUTH,
    operation: 'inspect-main-content',
  }, policy)
  assert.equal(granted.authorizationId, AUTH.id)
  assert.equal(granted.locator, PAGE)
  assert.equal(granted.readOnly, true)

  assert.throws(() => authorizeBrowserSource({
    locator: 'https://www.facebook.com/messages/',
    authorization: AUTH,
    operation: 'inspect-main-content',
  }, policy), /outside explicit authorization scope/)
})

test('rejects browser mutation and credential-bearing locators', () => {
  const policy = resolveBrowserPolicy({ failClosed: true, readOnly: true })
  for (const operation of ['navigate', 'click', 'type', 'message', 'comment', 'react', 'publish']) {
    assert.throws(() => authorizeBrowserSource({ locator: PAGE, authorization: AUTH, operation }, policy), /not allowed|explicitly denied/)
  }
  assert.throws(() => authorizeBrowserSource({
    locator: 'https://user:secret@example.com/',
    authorization: { ...AUTH, locator: 'https://user:secret@example.com/' },
    operation: 'inspect-main-content',
  }, policy), /without credentials/)
})

test('sanitizes observations to bounded public evidence fields', () => {
  const result = sanitizeBrowserObservation({
    authorizationId: AUTH.id,
    locator: PAGE,
    text: 'x'.repeat(25000),
    articles: Array.from({ length: 40 }, (_, index) => ({ text: `article-${index}-` + 'y'.repeat(5000), private: 'drop-me' })),
    evidenceSha256: 'a'.repeat(64),
    cookies: ['must-not-survive'],
    webSocketDebuggerUrl: 'ws://must-not-survive',
  })
  assert.equal(result.text.length, 20000)
  assert.equal(result.articles.length, 30)
  assert.ok(result.articles.every(item => Object.keys(item).join(',') === 'text'))
  assert.equal(JSON.stringify(result).includes('cookies'), false)
  assert.equal(JSON.stringify(result).includes('webSocketDebuggerUrl'), false)
  assert.equal(result.evidenceSha256, 'a'.repeat(64))
})

test('registers mediaBrowserPolicy through Cordis provide', () => {
  let provided
  apply({ provide(key, value) { provided = { key, value } } }, { failClosed: true, readOnly: true })
  assert.equal(provided.key, 'mediaBrowserPolicy')
  assert.equal(provided.value.readOnly, true)
  assert.ok(MediaBrowserPolicyError)
})

test('configuration may narrow but never widen the read-only allowlist', () => {
  assert.throws(() => resolveBrowserPolicy({
    failClosed: true,
    readOnly: true,
    allowedOperations: ['inspect-main-content', 'publish-later'],
    deniedOperations: [],
  }), /only narrow/)
  const narrowed = resolveBrowserPolicy({
    failClosed: true,
    readOnly: true,
    allowedOperations: ['inspect-main-content'],
    deniedOperations: [],
  })
  assert.ok(narrowed.deniedOperations.includes('publish'))
  assert.ok(narrowed.deniedOperations.includes('message'))
})

test('prefix authorization is path-bounded and sensitive locators are rejected', () => {
  const policy = resolveBrowserPolicy({ failClosed: true, readOnly: true })
  const prefixAuth = { id: 'folder-scope', locator: 'https://example.com/reference', match: 'prefix', purpose: 'reference' }
  const granted = authorizeBrowserSource({ locator: 'https://example.com/reference/item-1', authorization: prefixAuth, operation: 'inspect-main-content' }, policy)
  assert.equal(granted.locator, 'https://example.com/reference/item-1')
  assert.throws(() => authorizeBrowserSource({ locator: 'https://example.com/reference-evil', authorization: prefixAuth, operation: 'inspect-main-content' }, policy), /outside explicit authorization scope/)
  assert.throws(() => authorizeBrowserSource({ locator: 'https://example.com/reference?access_token=secret', authorization: { ...prefixAuth, locator: 'https://example.com/reference?access_token=secret' }, operation: 'inspect-main-content' }, policy), /sensitive query parameter/)
  assert.throws(() => authorizeBrowserSource({ locator: PAGE, authorization: { ...AUTH, purpose: 'voter-targeting' }, operation: 'inspect-main-content' }, policy), /purpose must be reference or source/)
})
