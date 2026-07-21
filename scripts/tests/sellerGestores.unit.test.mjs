import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  areAllProductsSelected,
  buildCatalogAccessPayload,
  buildCheckoutPhonesPayload,
  catalogAccessDirty,
  checkoutPhonesDirty,
  deriveSelectionFromAccess,
  gestorEligibleForCheckoutPhone,
  gestorSetupStatus,
  normalizeGestorUsername,
  selectAllProductIds,
  toggleGestorCheckoutId,
  toggleProductId,
  validateCheckoutPhonesSelection,
  validateGestorUsername,
} from '../../src/lib/sellerGestores.js'

test('normalizeGestorUsername recorta y pasa a minúsculas', () => {
  assert.equal(normalizeGestorUsername('  PePe_01 '), 'pepe_01')
})

test('validateGestorUsername acepta slug válido', () => {
  const result = validateGestorUsername('maria_venta')
  assert.equal(result.ok, true)
  assert.equal(result.username, 'maria_venta')
})

test('validateGestorUsername rechaza guion al inicio', () => {
  const result = validateGestorUsername('-pepe')
  assert.equal(result.ok, false)
  assert.match(result.message, /guion/i)
})

test('validateGestorUsername rechaza demasiado corto', () => {
  const result = validateGestorUsername('a')
  assert.equal(result.ok, false)
  assert.match(result.message, /2 y 32/)
})

test('gestorSetupStatus distingue pendiente y activo', () => {
  assert.equal(gestorSetupStatus({ has_password: false }).pending, true)
  assert.equal(gestorSetupStatus({ has_password: true }).label, 'Activo')
})

test('buildCatalogAccessPayload en mode all limpia product_ids', () => {
  assert.deepEqual(buildCatalogAccessPayload('all', ['a', 'b']), {
    mode: 'all',
    product_ids: [],
  })
})

test('buildCatalogAccessPayload en selected deduplica ids', () => {
  assert.deepEqual(buildCatalogAccessPayload('selected', ['p1', ' p1 ', '', 'p2']), {
    mode: 'selected',
    product_ids: ['p1', 'p2'],
  })
})

test('toggleProductId agrega y quita', () => {
  assert.deepEqual(toggleProductId(['a'], 'b').sort(), ['a', 'b'])
  assert.deepEqual(toggleProductId(['a', 'b'], 'a'), ['b'])
})

test('selectAllProductIds y areAllProductsSelected', () => {
  const products = [{ product_id: '1' }, { product_id: '2' }]
  const ids = selectAllProductIds(products)
  assert.deepEqual(ids, ['1', '2'])
  assert.equal(areAllProductsSelected(products, ids), true)
  assert.equal(areAllProductsSelected(products, ['1']), false)
})

test('deriveSelectionFromAccess respeta mode all', () => {
  const products = [{ product_id: 'x' }, { product_id: 'y' }]
  const derived = deriveSelectionFromAccess({ mode: 'all', product_ids: [] }, products)
  assert.equal(derived.mode, 'all')
  assert.deepEqual(derived.selectedIds, ['x', 'y'])
})

test('deriveSelectionFromAccess usa product_ids en selected', () => {
  const derived = deriveSelectionFromAccess(
    { mode: 'selected', product_ids: ['a'] },
    [
      { product_id: 'a', selected: true },
      { product_id: 'b', selected: false },
    ],
  )
  assert.equal(derived.mode, 'selected')
  assert.deepEqual(derived.selectedIds, ['a'])
})

test('catalogAccessDirty detecta cambios de selección', () => {
  const saved = { mode: 'selected', product_ids: ['a'] }
  assert.equal(catalogAccessDirty(saved, { mode: 'selected', product_ids: ['a'] }), false)
  assert.equal(catalogAccessDirty(saved, { mode: 'selected', product_ids: ['a', 'b'] }), true)
  assert.equal(catalogAccessDirty(saved, { mode: 'all', product_ids: [] }), true)
})

test('gestorEligibleForCheckoutPhone exige activo con teléfono', () => {
  assert.equal(gestorEligibleForCheckoutPhone({ has_password: true, phone: '51234567' }), true)
  assert.equal(gestorEligibleForCheckoutPhone({ has_password: true, phone: null }), false)
  assert.equal(gestorEligibleForCheckoutPhone({ has_password: false, phone: '51234567' }), false)
})

test('buildCheckoutPhonesPayload deduplica ids e incluye flag del negocio', () => {
  assert.deepEqual(buildCheckoutPhonesPayload(['g1', ' g1 ', '', 'g2'], false), {
    gestor_ids: ['g1', 'g2'],
    include_store_phone: false,
  })
})

test('checkoutPhonesDirty detecta cambios de gestores o del número del negocio', () => {
  const saved = { gestor_ids: ['a'], include_store_phone: true }
  assert.equal(checkoutPhonesDirty(saved, { gestor_ids: ['a'], include_store_phone: true }), false)
  assert.equal(checkoutPhonesDirty(saved, { gestor_ids: ['a', 'b'], include_store_phone: true }), true)
  assert.equal(checkoutPhonesDirty(saved, { gestor_ids: ['a'], include_store_phone: false }), true)
})

test('validateCheckoutPhonesSelection exige al menos un teléfono', () => {
  assert.equal(validateCheckoutPhonesSelection([], true).ok, true)
  assert.equal(validateCheckoutPhonesSelection(['g1'], false).ok, true)
  assert.equal(validateCheckoutPhonesSelection([], false).ok, false)
})

test('toggleGestorCheckoutId agrega y quita', () => {
  assert.deepEqual(toggleGestorCheckoutId(['a'], 'b').sort(), ['a', 'b'])
})
