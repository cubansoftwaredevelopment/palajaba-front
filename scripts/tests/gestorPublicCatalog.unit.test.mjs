import assert from 'node:assert/strict'
import { test } from 'node:test'

import { buildDirectBuyCheckoutPayload } from '../../src/lib/buyerJaba.js'
import { storeGestorPublicPath, isReservedStoreSlug } from '../../src/lib/storeSlug.js'
import { computeGestorDisplayPrice } from '../../src/lib/gestorCatalog.js'

test('buildDirectBuyCheckoutPayload incluye gestor y teléfono del producto', () => {
  const payload = buildDirectBuyCheckoutPayload({
    id: 'p1',
    name: 'Arroz',
    base_price: 125,
    base_currency: 'CUP',
    is_available: true,
    gestor_id: 'g1',
    gestor_username: 'pepe',
    store: {
      id: 's1',
      store_name: 'Mi Tienda',
      phone: '+5352222222',
    },
  })

  assert.equal(payload.storePhone, '+5352222222')
  assert.equal(payload.gestorId, 'g1')
  assert.equal(payload.gestorUsername, 'pepe')
  assert.equal(payload.items[0].base_price, 125)
  assert.equal(payload.items[0].gestor_id, 'g1')
})

test('producto de marketplace sin gestor no arrastra atribución', () => {
  const payload = buildDirectBuyCheckoutPayload({
    id: 'p1',
    name: 'Arroz',
    base_price: 100,
    base_currency: 'CUP',
    is_available: true,
    store: {
      id: 's1',
      store_name: 'Mi Tienda',
      phone: '+5351111111',
    },
  })

  assert.equal(payload.gestorId, null)
  assert.equal(payload.gestorUsername, null)
  assert.equal(payload.items[0].gestor_id, null)
  assert.equal(payload.storePhone, '+5351111111')
})

test('storeGestorPublicPath y slug g reservado', () => {
  assert.equal(storeGestorPublicPath('mi-tienda', 'pepe_venta'), '/mi-tienda/pepe_venta')
  assert.equal(isReservedStoreSlug('g'), true)
})

test('precio público gestor = base + margen (parity backend)', () => {
  assert.equal(computeGestorDisplayPrice(100, 25), 125)
})
