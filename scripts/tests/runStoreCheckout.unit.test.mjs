/**
 * Tests unitarios del flujo guardar-pedido → abrir WhatsApp.
 *
 * Uso (desde frontend/):
 *   node scripts/tests/runStoreCheckout.unit.test.mjs
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  CHECKOUT_BLOCKED_RATES,
  CHECKOUT_INVALID_PAYLOAD,
  CHECKOUT_ORDER_SAVE_FAILED,
  CHECKOUT_RATES_MESSAGE,
  CHECKOUT_SAVE_FAILED_MESSAGE,
  CHECKOUT_WHATSAPP_FAILED_MESSAGE,
  runStoreCheckout,
} from '../../src/lib/runStoreCheckout.js'

const basePayload = {
  storeId: 'store-1',
  storeName: 'Tienda Test',
  storePhone: '+5351234567',
  items: [{ id: 'p1', name: 'Producto', quantity: 1, price_cup: 100 }],
}

const baseOptions = {
  payload: basePayload,
  displayCurrency: 'CUP',
  cupPerUnit: 1,
  ratesReady: true,
  areExchangeRatesAvailable: () => true,
  needsExchangeRatesForDisplay: () => false,
}

function createMocks({ orderResult = { id: 'order-1', status: 'pending_confirmation' }, orderError = null, whatsappOpened = true } = {}) {
  const calls = { submit: 0, whatsapp: 0, order: null }

  const submitStoreOrder = async (args) => {
    calls.submit += 1
    calls.submitArgs = args
    if (orderError) throw orderError
    return orderResult
  }

  const openWhatsAppCheckout = (args) => {
    calls.whatsapp += 1
    calls.whatsappArgs = args
    return whatsappOpened
  }

  return { calls, submitStoreOrder, openWhatsAppCheckout }
}

test('rechaza payload inválido sin llamar backend ni WhatsApp', async () => {
  const { submitStoreOrder, openWhatsAppCheckout, calls } = createMocks()

  const result = await runStoreCheckout({
    ...baseOptions,
    payload: { storeId: 'x', items: [] },
    submitStoreOrder,
    openWhatsAppCheckout,
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, CHECKOUT_INVALID_PAYLOAD)
  assert.equal(calls.submit, 0)
  assert.equal(calls.whatsapp, 0)
})

test('bloquea checkout si faltan tasas de cambio', async () => {
  const { submitStoreOrder, openWhatsAppCheckout, calls } = createMocks()

  const result = await runStoreCheckout({
    ...baseOptions,
    ratesReady: false,
    areExchangeRatesAvailable: () => false,
    needsExchangeRatesForDisplay: () => true,
    submitStoreOrder,
    openWhatsAppCheckout,
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, CHECKOUT_BLOCKED_RATES)
  assert.equal(result.message, CHECKOUT_RATES_MESSAGE)
  assert.equal(calls.submit, 0)
  assert.equal(calls.whatsapp, 0)
})

test('guarda el pedido antes de abrir WhatsApp', async () => {
  const { submitStoreOrder, openWhatsAppCheckout, calls } = createMocks()
  let submitFinished = false

  const submitWithDelay = async (args) => {
    await new Promise((resolve) => setTimeout(resolve, 5))
    submitFinished = true
    return submitStoreOrder(args)
  }

  const openAfterSubmit = (args) => {
    assert.equal(submitFinished, true, 'WhatsApp debe abrirse solo después de guardar')
    return openWhatsAppCheckout(args)
  }

  const result = await runStoreCheckout({
    ...baseOptions,
    submitStoreOrder: submitWithDelay,
    openWhatsAppCheckout: openAfterSubmit,
  })

  assert.equal(result.ok, true)
  assert.equal(result.whatsappOpened, true)
  assert.equal(calls.submit, 1)
  assert.equal(calls.whatsapp, 1)
})

test('no abre WhatsApp si falla el guardado del pedido', async () => {
  const { submitStoreOrder, openWhatsAppCheckout, calls } = createMocks({
    orderError: new Error('Error de conexión'),
  })

  const result = await runStoreCheckout({
    ...baseOptions,
    submitStoreOrder,
    openWhatsAppCheckout,
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, CHECKOUT_ORDER_SAVE_FAILED)
  assert.equal(result.message, 'Error de conexión')
  assert.equal(calls.submit, 1)
  assert.equal(calls.whatsapp, 0)
})

test('no abre WhatsApp si la respuesta del backend no trae id de pedido', async () => {
  const { submitStoreOrder, openWhatsAppCheckout, calls } = createMocks({
    orderResult: { status: 'pending_confirmation' },
  })

  const result = await runStoreCheckout({
    ...baseOptions,
    submitStoreOrder,
    openWhatsAppCheckout,
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, CHECKOUT_ORDER_SAVE_FAILED)
  assert.equal(calls.whatsapp, 0)
})

test('registra pedido aunque WhatsApp no se abra', async () => {
  const { submitStoreOrder, openWhatsAppCheckout, calls } = createMocks({
    whatsappOpened: false,
  })

  const result = await runStoreCheckout({
    ...baseOptions,
    submitStoreOrder,
    openWhatsAppCheckout,
  })

  assert.equal(result.ok, true)
  assert.equal(result.whatsappOpened, false)
  assert.equal(result.warning, CHECKOUT_WHATSAPP_FAILED_MESSAGE)
  assert.equal(calls.submit, 1)
  assert.equal(calls.whatsapp, 1)
})

test('propaga datos de entrega al guardar y al mensaje de WhatsApp', async () => {
  const { submitStoreOrder, openWhatsAppCheckout, calls } = createMocks()
  const delivery = {
    recipient_name: 'María',
    address: 'Calle 1',
    phone_primary: '51234567',
    phone_secondary: '',
    notes: '',
  }

  await runStoreCheckout({
    ...baseOptions,
    delivery,
    submitStoreOrder,
    openWhatsAppCheckout,
  })

  assert.deepEqual(calls.submitArgs.delivery, delivery)
  assert.deepEqual(calls.whatsappArgs.delivery, delivery)
})
