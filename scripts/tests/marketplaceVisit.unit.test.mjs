import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildMarketplaceVisitPayload } from '../../src/lib/marketplaceVisit.js'

test('buildMarketplaceVisitPayload requiere provincia y municipio', () => {
  assert.equal(buildMarketplaceVisitPayload({ provinceId: 'la-habana' }), null)
  assert.equal(buildMarketplaceVisitPayload({ municipalityId: 'plaza' }), null)
})

test('buildMarketplaceVisitPayload arma el cuerpo esperado', () => {
  const payload = buildMarketplaceVisitPayload({
    provinceId: 'la-habana',
    municipalityId: 'plaza-de-la-revolucion',
    sessionId: 'sess12345678',
  })

  assert.deepEqual(payload, {
    session_id: 'sess12345678',
    page: 'marketplace',
    province_id: 'la-habana',
    municipality_id: 'plaza-de-la-revolucion',
  })
})
