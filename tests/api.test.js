import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AUTH_URL, LISTINGS_URL, PROFILES_URL, privateApiUrl } from '../src/api.js'

test('public API endpoints stay on the Noroff origin', () => {
  assert.equal(AUTH_URL, 'https://v2.api.noroff.dev/auth')
  assert.equal(LISTINGS_URL, 'https://v2.api.noroff.dev/auction/listings')
  assert.equal(PROFILES_URL, 'https://v2.api.noroff.dev/auction/profiles')
})

test('authenticated requests preserve path and query parameters', () => {
  assert.equal(
    privateApiUrl(PROFILES_URL + '/student?_listings=true'),
    '/api/noroff?path=%2Fauction%2Fprofiles%2Fstudent%3F_listings%3Dtrue',
  )
})

test('authenticated requests reject unrelated API origins', () => {
  assert.throws(() => privateApiUrl('https://example.com/auction/profiles/student'), /Unexpected API origin/)
})
