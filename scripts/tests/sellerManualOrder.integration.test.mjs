import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildManualOrderPayload,
  createManualOrderLineItem,
  inferManualOrderPaymentCurrency,
  validateManualOrderDraft,
} from '../../src/lib/sellerManualOrder.js'

function simulateGranularitySwitch(lineItems) {
  const productsById = {
    p1: { stock_quantity: 5 },
  }
  const validationError = validateManualOrderDraft(lineItems, productsById)
  const payload = buildManualOrderPayload({
    lineItems,
    paymentCurrency: inferManualOrderPaymentCurrency(lineItems),
  })
  return { validationError, payload }
}

test('flujo integrado: borrador válido genera payload listo para POST /me/orders', () => {
  const lineItems = [
    createManualOrderLineItem(
      { id: 'p1', name: 'Aceite', base_price: 450, base_currency: 'CUP', stock_quantity: 5 },
      2,
    ),
  ]

  const { validationError, payload } = simulateGranularitySwitch(lineItems)
  assert.equal(validationError, '')
  assert.equal(payload.items[0].quantity, 2)
  assert.equal(payload.payment_currency, 'CUP')
})

test('flujo integrado: cambiar cantidad invalida bloquea envío', () => {
  const lineItems = [
    createManualOrderLineItem(
      { id: 'p1', name: 'Aceite', base_price: 450, base_currency: 'CUP', stock_quantity: 1 },
      2,
    ),
  ]

  const validationError = validateManualOrderDraft(lineItems)
  assert.match(validationError, /stock insuficiente/i)
})
