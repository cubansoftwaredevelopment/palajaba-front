import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildManualOrderPayload,
  createManualOrderLineItem,
  flattenCatalogProducts,
  getProductSearchStatus,
  inferManualOrderPaymentCurrency,
  validateManualOrderDraft,
} from '../../src/lib/sellerManualOrder.js'

const catalog = {
  categories: [
    {
      name: 'Despensa',
      products: [
        {
          id: 'p1',
          name: 'Arroz',
          base_price: 100,
          base_currency: 'CUP',
          is_available: true,
          view_only: false,
          stock_quantity: 4,
        },
        {
          id: 'p2',
          name: 'Frijoles',
          base_price: 80,
          base_currency: 'CUP',
          is_available: false,
          view_only: false,
        },
      ],
    },
  ],
}

test('flattenCatalogProducts omite productos no disponibles', () => {
  const products = flattenCatalogProducts(catalog)
  assert.equal(products.length, 1)
  assert.equal(products[0].id, 'p1')
})

test('buildManualOrderPayload replica estructura de pedido normal', () => {
  const lineItem = createManualOrderLineItem(
    { id: 'p1', name: 'Arroz', base_price: 100, base_currency: 'CUP' },
    2,
  )
  const payload = buildManualOrderPayload({
    lineItems: [lineItem],
    paymentCurrency: 'CUP',
  })

  assert.deepEqual(payload, {
    items: [
      {
        product_id: 'p1',
        name: 'Arroz',
        quantity: 2,
        unit_price: 100,
        currency: 'CUP',
      },
    ],
    payment_currency: 'CUP',
  })
})

test('validateManualOrderDraft detecta stock insuficiente', () => {
  const lineItem = createManualOrderLineItem(
    { id: 'p1', name: 'Arroz', base_price: 100, base_currency: 'CUP', stock_quantity: 2 },
    3,
  )
  const message = validateManualOrderDraft([lineItem], { p1: { stock_quantity: 2 } })
  assert.match(message, /stock insuficiente/i)
})

test('inferManualOrderPaymentCurrency infiere moneda única', () => {
  const lineItems = [
    createManualOrderLineItem({ id: 'p1', name: 'Arroz', base_price: 100, base_currency: 'USD' }),
  ]
  assert.equal(inferManualOrderPaymentCurrency(lineItems), 'USD')
})

test('getProductSearchStatus distingue pedidos vacíos, vista previa y sin coincidencias', () => {
  const none = getProductSearchStatus({ hasOrderedProducts: false, total: 0, shown: 0 })
  assert.equal(none.type, 'empty')
  assert.match(none.message, /pedidos/)

  const preview = getProductSearchStatus({
    hasOrderedProducts: true,
    total: 20,
    shown: 12,
  })
  assert.equal(preview.type, 'preview')
  assert.match(preview.message, /Busca por nombre/)

  const missing = getProductSearchStatus({
    query: 'arroz',
    hasOrderedProducts: true,
    total: 0,
    shown: 0,
  })
  assert.equal(missing.type, 'no-results')
  assert.match(missing.message, /No encontramos productos/)
})
