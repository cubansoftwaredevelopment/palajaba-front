import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildSelectedProductsPayload,
  computeGestorDisplayPrice,
  createGestorProductDrafts,
  gestorProductsDirty,
  toggleGestorProductSelection,
  updateGestorProductMargin,
} from '../../src/lib/gestorCatalog.js'
import { validateGestorUsername } from '../../src/lib/sellerGestores.js'

/**
 * Simula login → drafts → guardar márgenes (sin red).
 */
function simulateGestorPanelFlow({ usernameDraft, allowedProducts, marginsById }) {
  const usernameResult = validateGestorUsername(usernameDraft)
  let drafts = createGestorProductDrafts(allowedProducts)
  for (const [productId, margin] of Object.entries(marginsById)) {
    drafts = toggleGestorProductSelection(drafts, productId)
    drafts = updateGestorProductMargin(drafts, productId, String(margin))
  }
  const payload = buildSelectedProductsPayload(drafts)
  const preview = payload.ok
    ? payload.products.map((p) => {
        const base = allowedProducts.find((a) => a.product_id === p.product_id)
        return {
          product_id: p.product_id,
          display_price: computeGestorDisplayPrice(base.base_price, p.margin_amount),
        }
      })
    : []
  return { usernameResult, payload, preview, drafts }
}

test('flujo integrado: primer producto con margen genera PUT válido', () => {
  const allowedProducts = [
    {
      product_id: 'p1',
      name: 'Arroz',
      base_price: 100,
      base_currency: 'CUP',
      selected: false,
    },
    {
      product_id: 'p2',
      name: 'Aceite',
      base_price: 450,
      base_currency: 'CUP',
      selected: false,
    },
  ]

  const { usernameResult, payload, preview } = simulateGestorPanelFlow({
    usernameDraft: 'pepe_venta',
    allowedProducts,
    marginsById: { p1: 20 },
  })

  assert.equal(usernameResult.ok, true)
  assert.equal(payload.ok, true)
  assert.deepEqual(payload.products, [{ product_id: 'p1', margin_amount: 20 }])
  assert.equal(preview[0].display_price, 120)
})

test('flujo integrado: dirty false tras sincronizar con gestor guardado', () => {
  const allowedProducts = [
    {
      product_id: 'p1',
      name: 'Arroz',
      base_price: 100,
      selected: true,
      margin_amount: 15,
    },
  ]
  const drafts = createGestorProductDrafts(allowedProducts)
  const saved = {
    selected_products: [{ product_id: 'p1', margin_amount: 15 }],
  }
  assert.equal(gestorProductsDirty(saved, drafts), false)

  const changed = updateGestorProductMargin(drafts, 'p1', '30')
  assert.equal(gestorProductsDirty(saved, changed), true)
})

test('flujo integrado: sin productos seleccionados envía lista vacía', () => {
  const drafts = createGestorProductDrafts([
    { product_id: 'p1', name: 'A', base_price: 1, selected: false },
  ])
  const payload = buildSelectedProductsPayload(drafts)
  assert.equal(payload.ok, true)
  assert.deepEqual(payload.products, [])
})
