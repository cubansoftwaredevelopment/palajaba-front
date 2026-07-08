import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildManualOrderPayload,
  createManualOrderLineItem,
  filterProductsForManualOrder,
  flattenCatalogProducts,
  getProductSearchStatus,
  inferManualOrderPaymentCurrency,
  productMatchesSearch,
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

test('filterProductsForManualOrder busca por nombre y categoría', () => {
  const products = [
    { id: '1', name: 'Arroz 1kg', category_name: 'Despensa' },
    { id: '2', name: 'Aceite', category_name: 'Condimentos' },
    { id: '3', name: 'Frijoles', category_name: 'Despensa' },
  ]

  assert.equal(filterProductsForManualOrder(products, 'arroz').length, 1)
  assert.equal(filterProductsForManualOrder(products, 'despensa').length, 2)
  assert.equal(productMatchesSearch(products[1], 'cond'), true)
})

test('getProductSearchStatus avisa cuando hay que buscar en catálogos grandes', () => {
  const products = Array.from({ length: 20 }, (_, index) => ({
    id: String(index),
    name: `Producto ${index}`,
    category_name: 'General',
  }))

  const preview = getProductSearchStatus(products, '')
  assert.equal(preview.type, 'preview')
  assert.match(preview.message, /Busca por nombre/)
})
