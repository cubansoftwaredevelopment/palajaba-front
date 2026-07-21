import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildDirectBuyCheckoutPayload } from '../../src/lib/buyerJaba.js'
import { computeGestorDisplayPrice } from '../../src/lib/gestorCatalog.js'

/**
 * Simula catálogo gestor → jaba → payload de pedido (sin red).
 */
function simulateGestorCheckout({ basePrice, margin, gestorPhone }) {
  const displayPrice = computeGestorDisplayPrice(basePrice, margin)
  const product = {
    id: 'p1',
    name: 'Aceite',
    base_price: displayPrice,
    base_currency: 'CUP',
    is_available: true,
    gestor_id: 'gestor-1',
    gestor_username: 'ana_ventas',
    store: {
      id: 'store-1',
      store_name: 'Bodega Central',
      phone: gestorPhone,
    },
  }
  const checkout = buildDirectBuyCheckoutPayload(product)
  const orderBody = {
    store_id: checkout.storeId,
    gestor_id: checkout.gestorId,
    gestor_username: checkout.gestorUsername,
    items: checkout.items.map((item) => ({
      product_id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.base_price,
      currency: item.base_currency,
    })),
  }
  return { checkout, orderBody, displayPrice }
}

test('flujo integrado: pedido lleva precio con margen y atribución del gestor', () => {
  const { checkout, orderBody, displayPrice } = simulateGestorCheckout({
    basePrice: 450,
    margin: 50,
    gestorPhone: '+5353333333',
  })

  assert.equal(displayPrice, 500)
  assert.equal(checkout.storePhone, '+5353333333')
  assert.equal(orderBody.gestor_id, 'gestor-1')
  assert.equal(orderBody.gestor_username, 'ana_ventas')
  assert.equal(orderBody.items[0].unit_price, 500)
})

test('flujo integrado: WhatsApp usa teléfono del gestor no del negocio', () => {
  const { checkout } = simulateGestorCheckout({
    basePrice: 100,
    margin: 0,
    gestorPhone: '+5359999999',
  })
  assert.equal(checkout.storePhone, '+5359999999')
  assert.notEqual(checkout.storePhone, '+5351111111')
})
