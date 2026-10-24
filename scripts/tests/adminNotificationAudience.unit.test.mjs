import assert from 'node:assert/strict'
import { test } from 'node:test'

import { notificationAudienceDisplay } from '../../src/constants/admin.js'
import {
  buildAdminNotificationPayload,
  matchesStoreQuery,
  smsSendCountLabel,
} from '../../src/lib/adminNotificationStores.js'

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

test('notificationAudienceDisplay junta varios grupos seleccionados', () => {
  assert.equal(
    notificationAudienceDisplay({
      audience: 'mixed',
      audiences: ['premium_monthly', 'premium_yearly'],
    }),
    'Premium · Mensual · Premium · Anual',
  )
})

test('buildAdminNotificationPayload no cae en todos si hay varios grupos', () => {
  const payload = buildAdminNotificationPayload({
    title: 'Aviso',
    content: 'Texto',
    audiences: ['premium_monthly', 'pro_yearly'],
    sellerIds: [],
  })
  assert.deepEqual(payload.audiences, ['premium_monthly', 'pro_yearly'])
  assert.equal(payload.audience, 'premium_monthly')
  assert.deepEqual(payload.seller_ids, [])
  assert.equal('seller_id' in payload, false)
})

test('buildAdminNotificationPayload usa negocios concretos sin ampliar a todos', () => {
  const payload = buildAdminNotificationPayload({
    title: 'Aviso',
    content: 'Texto',
    audiences: [],
    sellerIds: ['abc', 'def'],
  })
  assert.equal(payload.audience, 'single')
  assert.deepEqual(payload.audiences, [])
  assert.deepEqual(payload.seller_ids, ['abc', 'def'])
})

test('smsSendCountLabel usa el plural en español', () => {
  assert.equal(smsSendCountLabel(0), 'Enviado 0 veces por SMS')
  assert.equal(smsSendCountLabel(1), 'Enviado 1 vez por SMS')
  assert.equal(smsSendCountLabel(4), 'Enviado 4 veces por SMS')
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
