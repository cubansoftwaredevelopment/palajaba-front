import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'

import { buildMarketplaceVisitPayload, recordMarketplaceVisit } from '../../src/lib/marketplaceVisit.js'

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test('recordMarketplaceVisit no llama fetch sin ubicación', () => {
  let called = false
  globalThis.fetch = async () => {
    called = true
    return { ok: true }
  }

  recordMarketplaceVisit({ provinceId: 'la-habana' })
  assert.equal(called, false)
})

test('recordMarketplaceVisit envía POST keepalive con payload', async () => {
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    return { ok: true, json: async () => ({ recorded: true }) }
  }

  const payload = buildMarketplaceVisitPayload({
    provinceId: 'matanzas',
    municipalityId: 'matanzas',
    sessionId: 'integration_session_01',
  })

  recordMarketplaceVisit({
    provinceId: payload.province_id,
    municipalityId: payload.municipality_id,
  })

  // recordMarketplaceVisit genera su propio session_id; validamos fetch shape
  assert.equal(calls.length, 1)
  assert.match(String(calls[0].url), /\/api\/marketplace\/visits$/)
  assert.equal(calls[0].options.method, 'POST')
  assert.equal(calls[0].options.keepalive, true)
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json')

  const body = JSON.parse(calls[0].options.body)
  assert.equal(body.page, 'marketplace')
  assert.equal(body.province_id, 'matanzas')
  assert.equal(body.municipality_id, 'matanzas')
  assert.ok(body.session_id.length >= 8)
})
