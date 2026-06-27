import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isSavedMarketplaceOrder } from '../../src/lib/marketplaceOrder.js'

test('acepta pedido guardado con id y status', () => {
  assert.equal(
    isSavedMarketplaceOrder({ id: 'abc123', status: 'pending_confirmation' }),
    true,
  )
})

test('rechaza respuestas incompletas del backend', () => {
  assert.equal(isSavedMarketplaceOrder(null), false)
  assert.equal(isSavedMarketplaceOrder({}), false)
  assert.equal(isSavedMarketplaceOrder({ id: 'x' }), false)
  assert.equal(isSavedMarketplaceOrder({ status: 'pending_confirmation' }), false)
  assert.equal(isSavedMarketplaceOrder({ id: '', status: 'pending_confirmation' }), false)
})
