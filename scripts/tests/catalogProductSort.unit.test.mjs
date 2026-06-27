import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  PRODUCT_SORT_MODES,
  getProductSortModeLabel,
  productPriceInCup,
  sortProductsForPreview,
} from '../../src/lib/productPriceSort.js'

const cupPerUnit = { CUP: 1, USD: 655, EUR: 750, MLC: 440 }

const sampleProducts = [
  { id: '1', name: 'Zeta', base_price: 300, base_currency: 'CUP', popularity: 5, sort_order: 2 },
  { id: '2', name: 'Alpha', base_price: 100, base_currency: 'CUP', popularity: 20, sort_order: 0 },
  { id: '3', name: 'Beta', base_price: 200, base_currency: 'CUP', popularity: 20, sort_order: 1 },
]

test('expone los cuatro modos de orden', () => {
  assert.deepEqual(
    PRODUCT_SORT_MODES.map((mode) => mode.id),
    ['popularity', 'price', 'alphabetical', 'manual'],
  )
})

test('getProductSortModeLabel usa popularidad por defecto', () => {
  assert.equal(getProductSortModeLabel('popularity'), 'Popularidad')
  assert.equal(getProductSortModeLabel('unknown'), 'Popularidad')
})

test('productPriceInCup convierte USD a CUP con la tasa actual', () => {
  assert.equal(productPriceInCup({ base_price: 2, base_currency: 'USD' }, cupPerUnit), 1310)
  assert.equal(productPriceInCup({ base_price: 500, base_currency: 'CUP' }, cupPerUnit), 500)
})

test('sortProductsForPreview ordena por popularidad como la tienda pública', () => {
  const ordered = sortProductsForPreview(sampleProducts, 'popularity', cupPerUnit)
  assert.deepEqual(
    ordered.map((product) => product.name),
    ['Alpha', 'Beta', 'Zeta'],
  )
})

test('sortProductsForPreview ordena por precio convertido a CUP', () => {
  const mixed = [
    { id: '1', name: 'Caro USD', base_price: 10, base_currency: 'USD' },
    { id: '2', name: 'Barato CUP', base_price: 500, base_currency: 'CUP' },
    { id: '3', name: 'Medio USD', base_price: 1, base_currency: 'USD' },
  ]
  const ordered = sortProductsForPreview(mixed, 'price', cupPerUnit)
  assert.deepEqual(
    ordered.map((product) => product.name),
    ['Barato CUP', 'Medio USD', 'Caro USD'],
  )
})

test('sortProductsForPreview ordena alfabéticamente', () => {
  const ordered = sortProductsForPreview(sampleProducts, 'alphabetical', cupPerUnit)
  assert.deepEqual(
    ordered.map((product) => product.name),
    ['Alpha', 'Beta', 'Zeta'],
  )
})

test('sortProductsForPreview respeta sort_order en modo manual', () => {
  const ordered = sortProductsForPreview(sampleProducts, 'manual', cupPerUnit)
  assert.deepEqual(
    ordered.map((product) => product.name),
    ['Alpha', 'Beta', 'Zeta'],
  )
})

test('sortProductsForPreview no muta la lista original', () => {
  const copy = [...sampleProducts]
  sortProductsForPreview(copy, 'price', cupPerUnit)
  assert.deepEqual(copy, sampleProducts)
})
