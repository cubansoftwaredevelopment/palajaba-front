import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  isSubscriptionCheckoutClosed,
  isSubscriptionCheckoutPaid,
  subscriptionCheckoutPayload,
  subscriptionCheckoutStatusMessage,
} from '../../src/subscriptions/qvapay.js'

test('el checkout envía el plan y periodo escogidos', () => {
  assert.deepEqual(subscriptionCheckoutPayload('pro', 'quarterly'), {
    plan_tier: 'pro',
    billing_period: 'quarterly',
  })
})

test('la confirmación QvaPay activa la tienda automáticamente', () => {
  const checkout = { status: 'paid' }
  assert.equal(isSubscriptionCheckoutPaid(checkout), true)
  assert.equal(isSubscriptionCheckoutClosed(checkout), true)
  assert.match(subscriptionCheckoutStatusMessage(checkout), /Tu tienda ya está activa/)
})

test('un pago pendiente sigue consultándose y muestra que activa al confirmar', () => {
  const checkout = { status: 'pending' }
  assert.equal(isSubscriptionCheckoutPaid(checkout), false)
  assert.equal(isSubscriptionCheckoutClosed(checkout), false)
  assert.match(subscriptionCheckoutStatusMessage(checkout), /se activará automáticamente/)
})

test('una factura cancelada o fallida cierra el seguimiento', () => {
  for (const status of ['cancelled', 'failed']) {
    assert.equal(isSubscriptionCheckoutClosed({ status }), true)
    assert.match(subscriptionCheckoutStatusMessage({ status }), /no se completó/)
  }
})
