/**
 * Validación y payload de recogida en tienda.
 *
 * Uso (desde frontend/):
 *   node scripts/tests/whatsappOrderPickup.unit.test.mjs
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  isPickupFulfillment,
  toApiDelivery,
  validatePickupForm,
} from '../../src/lib/buyerDelivery.js'
import { buildOpenStreetMapUrl } from '../../src/lib/openStreetMap.js'

test('validatePickupForm exige nombre y teléfono de 8 dígitos', () => {
  assert.equal(
    validatePickupForm({ recipient_name: '', phone_primary: '51234567' }),
    'Indica el nombre de quien recogerá el pedido.',
  )
  assert.equal(
    validatePickupForm({ recipient_name: 'Ana', phone_primary: '5123' }),
    'Ingresa un teléfono de contacto válido (8 dígitos).',
  )
  assert.equal(validatePickupForm({ recipient_name: 'Ana', phone_primary: '51234567' }), null)
})

test('toApiDelivery omite recogida para no marcar domicilio en el backend', () => {
  const pickup = { mode: 'pickup', recipient_name: 'Luis', phone_primary: '51234567' }
  assert.equal(isPickupFulfillment(pickup), true)
  assert.equal(toApiDelivery(pickup), null)

  const delivery = {
    recipient_name: 'María',
    address: 'Calle 1',
    phone_primary: '51234567',
  }
  assert.equal(isPickupFulfillment(delivery), false)
  assert.deepEqual(toApiDelivery(delivery), delivery)
})

test('buildOpenStreetMapUrl arma el punto y rechaza coordenadas inválidas', () => {
  assert.equal(
    buildOpenStreetMapUrl(23.1136, -82.3666),
    'https://www.openstreetmap.org/?mlat=23.113600&mlon=-82.366600#map=17/23.113600/-82.366600',
  )
  assert.equal(buildOpenStreetMapUrl(null, -82.3), null)
  assert.equal(buildOpenStreetMapUrl(91, 0), null)
})
