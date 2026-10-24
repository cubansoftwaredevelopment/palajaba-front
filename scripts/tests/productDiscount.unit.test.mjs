import assert from 'node:assert/strict'
import { test } from 'node:test'

import { productDiscountPercent, productSaleAmount } from '../../src/products/context.js'

test('productSaleAmount aplica el % sobre el precio base', () => {
  assert.equal(productDiscountPercent({ discount_percent: 20 }), 20)
  assert.equal(
    productSaleAmount({ base_price: 1000, base_currency: 'CUP', discount_percent: 20 }),
    800,
  )
  assert.equal(
    productSaleAmount({ base_price: 10, base_currency: 'USD', discount_percent: 15 }),
    8.5,
  )
  assert.equal(productSaleAmount({ base_price: 100, discount_percent: 0 }), 100)
  assert.equal(productSaleAmount({ base_price: 100 }), 100)
})
