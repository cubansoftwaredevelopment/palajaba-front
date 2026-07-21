import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  areAllProductsSelected,
  buildCatalogAccessPayload,
  catalogAccessDirty,
  deriveSelectionFromAccess,
  selectAllProductIds,
  toggleProductId,
  validateGestorUsername,
} from '../../src/lib/sellerGestores.js'

/**
 * Simula el flujo del panel: crear username válido → elegir productos → payload PUT.
 */
function simulateSellerGestoresPanel({ usernameDraft, accessMode, selectedIds, products }) {
  const usernameResult = validateGestorUsername(usernameDraft)
  const accessPayload = buildCatalogAccessPayload(accessMode, selectedIds)
  const allSelected = areAllProductsSelected(products, selectedIds)
  return { usernameResult, accessPayload, allSelected }
}

test('flujo integrado: crear gestor con username válido y habilitar todos los productos', () => {
  const products = [
    { product_id: 'p1', name: 'Arroz', selected: false },
    { product_id: 'p2', name: 'Aceite', selected: false },
  ]

  const { usernameResult, accessPayload, allSelected } = simulateSellerGestoresPanel({
    usernameDraft: '  pepe_venta ',
    accessMode: 'all',
    selectedIds: selectAllProductIds(products),
    products,
  })

  assert.equal(usernameResult.ok, true)
  assert.equal(usernameResult.username, 'pepe_venta')
  assert.deepEqual(accessPayload, { mode: 'all', product_ids: [] })
  assert.equal(allSelected, true)
})

test('flujo integrado: selección parcial genera payload selected', () => {
  const products = [{ product_id: 'p1' }, { product_id: 'p2' }, { product_id: 'p3' }]
  let selected = []
  selected = toggleProductId(selected, 'p1')
  selected = toggleProductId(selected, 'p3')

  const payload = buildCatalogAccessPayload('selected', selected)
  assert.deepEqual(payload, { mode: 'selected', product_ids: ['p1', 'p3'] })
  assert.equal(areAllProductsSelected(products, selected), false)
})

test('flujo integrado: cargar access y products sincroniza el draft', () => {
  const access = { mode: 'selected', product_ids: ['p2'] }
  const products = [
    { product_id: 'p1', selected: false },
    { product_id: 'p2', selected: true },
  ]
  const derived = deriveSelectionFromAccess(access, products)
  const draft = buildCatalogAccessPayload(derived.mode, derived.selectedIds)

  assert.equal(catalogAccessDirty(access, draft), false)
  assert.deepEqual(draft.product_ids, ['p2'])
})

test('flujo integrado: username inválido bloquea creación antes del POST', () => {
  const { usernameResult } = simulateSellerGestoresPanel({
    usernameDraft: 'Bad User!',
    accessMode: 'selected',
    selectedIds: [],
    products: [],
  })
  assert.equal(usernameResult.ok, false)
})
