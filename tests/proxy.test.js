import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { forwardNoroff } from '../api/noroff.js'

const originalFetch = globalThis.fetch
const key = 'test-only-not-a-real-key'
after(() => { globalThis.fetch = originalFetch })

function request(path, method = 'GET', body) {
  return new Request('https://loop.example/api/noroff?path=' + encodeURIComponent(path), {
    method,
    headers: {
      Authorization: 'Bearer test-user-token',
      ...(body && { 'Content-Type': 'application/json' }),
    },
    ...(body && { body: JSON.stringify(body) }),
  })
}

test('keeps API key on server, forwards authorization and query parameters', async () => {
  let called = 0
  globalThis.fetch = async (url, options) => {
    called++
    assert.equal(url.toString(), 'https://v2.api.noroff.dev/auction/profiles/alex?_listings=true')
    assert.equal(options.headers.get('X-Noroff-API-Key'), key)
    assert.equal(options.headers.get('Authorization'), 'Bearer test-user-token')
    return Response.json({ data: { name: 'alex' } })
  }
  const response = await forwardNoroff(request('/auction/profiles/alex?_listings=true'), { apiKey: key })
  assert.equal(response.status, 200)
  assert.equal(called, 1)
  assert.doesNotMatch(await response.text(), /test-only-not-a-real-key/)
})

test('supports JSON mutations and 204 deletes', async () => {
  globalThis.fetch = async (_, options) => {
    assert.equal(options.method, 'POST')
    assert.deepEqual(JSON.parse(options.body), { amount: 42 })
    return new Response(null, { status: 204 })
  }
  const response = await forwardNoroff(request('/auction/listings/uuid-123/bids', 'POST', { amount: 42 }), { apiKey: key })
  assert.equal(response.status, 204)
})

test('rejects arbitrary endpoints and external URLs before contacting upstream', async () => {
  globalThis.fetch = () => { throw new Error('Should not fetch') }
  for (const path of ['/auth/create-api-key', 'https://evil.example/auction/profiles/alex', '/auction/listings/uuid/bids/anything', '/auction/profiles/alex/../other']) {
    const response = await forwardNoroff(request(path), { apiKey: key })
    assert.equal(response.status, 404)
  }
})

test('requires user login and configured server key', async () => {
  const noToken = new Request('https://loop.example/api/noroff?path=%2Fauction%2Fprofiles%2Falex')
  assert.equal((await forwardNoroff(noToken, { apiKey: key })).status, 401)
  assert.equal((await forwardNoroff(request('/auction/profiles/alex'), { apiKey: '' })).status, 503)
})
