import assert from 'node:assert/strict'
import { test } from 'node:test'

import { notificationAudienceDisplay } from '../../src/constants/admin.js'
import { matchesStoreQuery } from '../../src/lib/adminNotificationStores.js'

test('notificationAudienceDisplay muestra tienda en envíos single', () => {
  assert.equal(
    notificationAudienceDisplay({
      audience: 'single',
      target_store_name: 'Los Reyes',
    }),
    'Tienda: Los Reyes',
  )
})

test('notificationAudienceDisplay usa label de audiencia normal', () => {
  assert.equal(
    notificationAudienceDisplay({ audience: 'premium_monthly' }),
    'Premium · Mensual',
  )
})

test('matchesStoreQuery filtra por nombre y teléfono', () => {
  const store = {
    store_name: 'Tienda Pepe',
    phone: '51234567',
    transfer_id: 'ABC123',
    store_slug: 'tienda-pepe',
  }
  assert.equal(matchesStoreQuery(store, 'pepe'), true)
  assert.equal(matchesStoreQuery(store, '5123'), true)
  assert.equal(matchesStoreQuery(store, 'xyz'), false)
})
