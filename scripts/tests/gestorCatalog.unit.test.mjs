import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildSelectedProductsPayload,
  computeGestorDisplayPrice,
  countSelectedGestorProducts,
  createGestorProductDrafts,
  formatMarginInput,
  gestorProductsDirty,
  parseMarginAmount,
  toggleGestorProductSelection,
  updateGestorProductMargin,
  areAllGestorProductsSelected,
  applyMarginToAllGestorProducts,
  setAllGestorProductsSelected,
} from '../../src/lib/gestorCatalog.js'
import {
  gestorLoginPath,
  gestorPanelPath,
  gestorSetupPath,
} from '../../src/lib/gestorAuth.js'
import { isReservedStoreSlug } from '../../src/lib/storeSlug.js'

test('computeGestorDisplayPrice suma base + margen', () => {
  assert.equal(computeGestorDisplayPrice(100, 25), 125)
  assert.equal(computeGestorDisplayPrice(10.555, 0.1), 10.66)
})

test('parseMarginAmount acepta coma y rechaza inválidos', () => {
  assert.equal(parseMarginAmount('12,5'), 12.5)
  assert.equal(parseMarginAmount('0'), 0)
  assert.equal(parseMarginAmount(''), null)
  assert.equal(parseMarginAmount('-1'), null)
  assert.equal(parseMarginAmount('1.234'), null)
})

test('createGestorProductDrafts mapea selected y margen', () => {
  const drafts = createGestorProductDrafts([
    {
      product_id: 'p1',
      name: 'Arroz',
      base_price: 100,
      base_currency: 'CUP',
      selected: true,
      margin_amount: 10,
    },
    {
      product_id: 'p2',
      name: 'Aceite',
      base_price: 200,
      base_currency: 'CUP',
      selected: false,
    },
  ])
  assert.equal(drafts[0].marginInput, '10')
  assert.equal(drafts[1].selected, false)
  assert.equal(formatMarginInput(10.5), '10.5')
})

test('toggle y update margen mantienen selección', () => {
  let drafts = createGestorProductDrafts([
    { product_id: 'p1', name: 'A', base_price: 1, selected: false },
  ])
  drafts = toggleGestorProductSelection(drafts, 'p1')
  assert.equal(drafts[0].selected, true)
  assert.equal(drafts[0].marginInput, '0')
  drafts = updateGestorProductMargin(drafts, 'p1', '15')
  assert.equal(drafts[0].marginInput, '15')
})

test('seleccionar todos y margen masivo', () => {
  let drafts = createGestorProductDrafts([
    { product_id: 'p1', name: 'A', base_price: 10, selected: false },
    { product_id: 'p2', name: 'B', base_price: 20, selected: false },
  ])
  assert.equal(areAllGestorProductsSelected(drafts), false)

  drafts = setAllGestorProductsSelected(drafts, true)
  assert.equal(areAllGestorProductsSelected(drafts), true)
  assert.equal(drafts[0].marginInput, '0')

  drafts = applyMarginToAllGestorProducts(drafts, '40')
  assert.equal(drafts.every((d) => d.selected && d.marginInput === '40'), true)

  drafts = setAllGestorProductsSelected(drafts, false)
  assert.equal(areAllGestorProductsSelected(drafts), false)
})

test('buildSelectedProductsPayload arma body PUT', () => {
  const drafts = [
    {
      product_id: 'p1',
      name: 'A',
      selected: true,
      marginInput: '5',
    },
    {
      product_id: 'p2',
      name: 'B',
      selected: false,
      marginInput: '9',
    },
  ]
  const result = buildSelectedProductsPayload(drafts)
  assert.equal(result.ok, true)
  assert.deepEqual(result.products, [{ product_id: 'p1', margin_amount: 5 }])
})

test('buildSelectedProductsPayload falla con margen inválido', () => {
  const result = buildSelectedProductsPayload([
    { product_id: 'p1', name: 'A', selected: true, marginInput: 'abc' },
  ])
  assert.equal(result.ok, false)
  assert.match(result.message, /margen/i)
})

test('gestorProductsDirty detecta cambios', () => {
  const saved = {
    selected_products: [{ product_id: 'p1', margin_amount: 5 }],
  }
  const clean = [
    { product_id: 'p1', selected: true, marginInput: '5' },
  ]
  const dirty = [
    { product_id: 'p1', selected: true, marginInput: '8' },
  ]
  assert.equal(gestorProductsDirty(saved, clean), false)
  assert.equal(gestorProductsDirty(saved, dirty), true)
  assert.equal(countSelectedGestorProducts(dirty), 1)
})

test('rutas de gestor y slug reservado g', () => {
  assert.equal(gestorLoginPath('mi-tienda'), '/g/mi-tienda/gestor')
  assert.equal(gestorSetupPath('mi-tienda'), '/g/mi-tienda/gestor/setup')
  assert.equal(gestorPanelPath('mi-tienda'), '/g/mi-tienda/gestor/panel')
  assert.equal(isReservedStoreSlug('g'), true)
})
