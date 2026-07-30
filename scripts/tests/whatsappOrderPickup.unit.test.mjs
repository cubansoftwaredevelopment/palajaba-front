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
