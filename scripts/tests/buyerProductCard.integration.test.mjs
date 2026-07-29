import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

import {
  BUYER_PRODUCT_CARD_ACTIONS,
  getBuyerProductCardContentFlags,
  resolveBuyerProductStorePath,
} from '../../src/lib/buyerProductCardView.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cardSource = readFileSync(
  join(__dirname, '../../src/components/buyer/BuyerProductCard.jsx'),
  'utf8',
)
const detailSource = readFileSync(
  join(__dirname, '../../src/components/buyer/BuyerProductDetailModal.jsx'),
  'utf8',
)

/**
 * Simula las decisiones de presentación de la tarjeta al renderizar un producto.
 */
function simulateProductCardPresentation(product) {
  const flags = getBuyerProductCardContentFlags()
  const storePath = resolveBuyerProductStorePath(product.store)
  return {
    showPickupBadge: flags.showPickupBadge,
    showPickupHint: flags.showPickupHint,
    storePath,
    storeClickable: Boolean(storePath),
    actions: BUYER_PRODUCT_CARD_ACTIONS,
    titleFirst: true,
    priceFirst: false,
  }
}

test('flujo integrado: producto sin domicilio no muestra badge en card', () => {
  const view = simulateProductCardPresentation({
    id: 'p1',
    name: 'Pan',
    pickup_required: true,
    pickup_municipality_name: 'Playa',
    store: { store_slug: 'panaderia-sol', store_name: 'Panadería Sol' },
  })

  assert.equal(view.showPickupBadge, false)
  assert.equal(view.showPickupHint, false)
  assert.equal(view.storePath, '/panaderia-sol')
  assert.equal(view.storeClickable, true)
  assert.equal(view.actions.primary, 'buy')
  assert.equal(view.actions.secondary, 'jaba')
  assert.equal(view.actions.layout, 'stack')
})

test('flujo integrado: la card pone el nombre antes que el precio', () => {
  const bodyStart = cardSource.indexOf('className={buyerProductBody}')
  assert.ok(bodyStart > 0)
  const bodySlice = cardSource.slice(bodyStart, bodyStart + 250)
  const nameIdx = bodySlice.indexOf('buyerProductName')
  const priceIdx = bodySlice.indexOf('buyerProductPrice')
  assert.ok(nameIdx >= 0)
  assert.ok(priceIdx > nameIdx)
  assert.doesNotMatch(cardSource, /Sin domicilio/)
  assert.doesNotMatch(cardSource, /buyerProductPickupRibbon/)
  assert.doesNotMatch(cardSource, /getProductPickupDisplay/)
  assert.match(cardSource, /JabaBagIcon/)
  assert.match(cardSource, /data-action=\{BUYER_PRODUCT_CARD_ACTIONS\.primary\}/)
  assert.match(cardSource, /data-action=\{BUYER_PRODUCT_CARD_ACTIONS\.secondary\}/)
})

test('flujo integrado: el detalle sigue mostrando Sin domicilio', () => {
  assert.match(detailSource, /Sin domicilio a tu municipio/)
  assert.match(detailSource, /buyerProductPickupRibbon/)
})

test('flujo integrado: tienda sin slug usable no es enlace', () => {
  const view = simulateProductCardPresentation({
    store: { store_name: '' },
  })
  assert.equal(view.storePath, null)
  assert.equal(view.storeClickable, false)
})
