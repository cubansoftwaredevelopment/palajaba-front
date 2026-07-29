import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  BUYER_PRODUCT_CARD_ACTIONS,
  getBuyerProductCardContentFlags,
  resolveBuyerProductStorePath,
} from '../../src/lib/buyerProductCardView.js'
import {
  buyerProductActions,
  buyerProductBtnBuy,
  buyerProductBtnJaba,
  buyerProductCard,
  buyerProductGrid,
  buyerProductName,
  buyerProductPrice,
  buyerProductRow,
  buyerProductRowItem,
  buyerProductStore,
} from '../../src/components/buyer/buyerStyles.js'

test('getBuyerProductCardContentFlags oculta domicilio en la tarjeta', () => {
  const flags = getBuyerProductCardContentFlags()
  assert.equal(flags.showPickupBadge, false)
  assert.equal(flags.showPickupHint, false)
})

test('resolveBuyerProductStorePath usa store_slug o deriva del nombre', () => {
  assert.equal(
    resolveBuyerProductStorePath({ store_slug: 'los-reyes', store_name: 'Los Reyes' }),
    '/los-reyes',
  )
  assert.ok(resolveBuyerProductStorePath({ store_name: 'Panadería El Sol' }))
  assert.equal(resolveBuyerProductStorePath(null), null)
  assert.equal(resolveBuyerProductStorePath({}), null)
})

test('BUYER_PRODUCT_CARD_ACTIONS pone Comprar como primaria en stack', () => {
  assert.equal(BUYER_PRODUCT_CARD_ACTIONS.primary, 'buy')
  assert.equal(BUYER_PRODUCT_CARD_ACTIONS.secondary, 'jaba')
  assert.equal(BUYER_PRODUCT_CARD_ACTIONS.layout, 'stack')
})

test('jerarquía tipográfica: nombre más prominente que precio', () => {
  assert.match(buyerProductName, /font-bold/)
  assert.match(buyerProductName, /font-display/)
  assert.match(buyerProductName, /truncate/)
  assert.doesNotMatch(buyerProductName, /line-clamp-2/)
  assert.doesNotMatch(buyerProductName, /min-h-\[/)
  assert.match(buyerProductPrice, /font-semibold/)
  assert.match(buyerProductPrice, /text-brand-green/)
  assert.doesNotMatch(buyerProductPrice, /font-display/)
})

test('jerarquía de botones: Comprar sólido, Jaba outline', () => {
  assert.match(buyerProductBtnBuy, /bg-brand-green/)
  assert.match(buyerProductBtnBuy, /w-full/)
  assert.match(buyerProductBtnJaba, /bg-transparent/)
  assert.match(buyerProductBtnJaba, /border-brand-green/)
  assert.match(buyerProductStore, /hover:underline/)
})

test('alineación de fila: acciones al fondo y contenedores stretch', () => {
  assert.match(buyerProductActions, /mt-auto/)
  assert.match(buyerProductCard, /h-full/)
  assert.match(buyerProductCard, /flex-col/)
  assert.match(buyerProductGrid, /items-stretch/)
  assert.match(buyerProductRow, /items-stretch/)
  assert.match(buyerProductRowItem, /self-stretch/)
})
