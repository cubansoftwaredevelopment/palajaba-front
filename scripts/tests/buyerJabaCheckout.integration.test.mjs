/**
 * Integración del checkout multitenda de la Jaba (domicilio / recogida).
 *
 * Uso (desde frontend/):
 *   node scripts/tests/buyerJabaCheckout.integration.test.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

import {
  isPickupFulfillment,
  toApiDelivery,
  validatePickupForm,
} from '../../src/lib/buyerDelivery.js'
import {
  CHECKOUT_INVALID_PAYLOAD,
  runStoreCheckout,
} from '../../src/lib/runStoreCheckout.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const panelSource = readFileSync(
  join(__dirname, '../../src/components/buyer/BuyerJabaPanel.jsx'),
  'utf8',
)
const contextSource = readFileSync(
  join(__dirname, '../../src/context/BuyerJabaContext.jsx'),
  'utf8',
)
const pickupModalSource = readFileSync(
  join(__dirname, '../../src/components/buyer/BuyerPickupCheckoutModal.jsx'),
  'utf8',
)
const whatsappSource = readFileSync(join(__dirname, '../../src/lib/whatsappOrder.js'), 'utf8')

const basePayload = {
  storeId: 'store-1',
  storeName: 'Tienda Test',
  storePhone: '+5351234567',
  items: [{ id: 'p1', name: 'Producto', quantity: 1, price_cup: 100 }],
}

test('flujo integrado: panel usa CTAs domicilio/recogida y no selector de moneda', () => {
  assert.match(panelSource, /Pedir a domicilio/)
  assert.match(panelSource, /Recoger en la tienda/)
  assert.match(panelSource, /El costo de entrega se coordina directamente con la tienda/)
  assert.match(panelSource, /requestPickupCheckout/)
  assert.match(panelSource, /window\.confirm/)
  assert.match(panelSource, /TrashIcon/)
  assert.match(panelSource, /buyerJabaStickySummary/)
  assert.match(panelSource, /groups\.length >= 3/)
  assert.doesNotMatch(panelSource, /BuyerCurrencySelector/)
  assert.doesNotMatch(panelSource, /Coordinar por WhatsApp/)
})

test('flujo integrado: contexto abre modal de recogida y no WhatsApp directo', () => {
  assert.match(contextSource, /BuyerPickupCheckoutModal/)
  assert.match(contextSource, /requestPickupCheckout/)
  assert.match(contextSource, /switchDeliveryToPickup/)
  assert.match(contextSource, /setPickupCheckout/)
  assert.match(pickupModalSource, /validatePickupForm/)
  assert.match(pickupModalSource, /mode: 'pickup'/)
  assert.doesNotMatch(pickupModalSource, /address/)
})

test('flujo integrado: mensaje WhatsApp contempla bloque de recogida', () => {
  assert.match(whatsappSource, /\*Recoger en la tienda\*/)
  assert.match(whatsappSource, /Recoge:/)
  assert.match(whatsappSource, /fulfillment\.mode === 'pickup'/)
})

test('flujo integrado: recogida válida → API sin delivery y WhatsApp con pickup', async () => {
  const pickup = {
    mode: 'pickup',
    recipient_name: 'Ana Pérez',
    phone_primary: '51234567',
  }

  assert.equal(validatePickupForm(pickup), null)
  assert.equal(toApiDelivery(pickup), null)
  assert.equal(isPickupFulfillment(pickup), true)

  const calls = { submit: 0, whatsapp: 0 }

  const result = await runStoreCheckout({
    payload: basePayload,
    delivery: pickup,
    displayCurrency: 'CUP',
    cupPerUnit: 1,
    ratesReady: true,
    areExchangeRatesAvailable: () => true,
    needsExchangeRatesForDisplay: () => false,
    submitStoreOrder: async (args) => {
      calls.submit += 1
      calls.submitArgs = args
      return { id: 'order-1', status: 'pending_confirmation' }
    },
    openWhatsAppCheckout: (args) => {
      calls.whatsapp += 1
      calls.whatsappArgs = args
      return true
    },
  })

  assert.equal(result.ok, true)
  assert.equal(calls.submit, 1)
  assert.equal(calls.whatsapp, 1)
  assert.equal(calls.submitArgs.delivery, null)
  assert.deepEqual(calls.whatsappArgs.delivery, pickup)
})

test('flujo integrado: domicilio sigue llegando al API y a WhatsApp', async () => {
  const delivery = {
    recipient_name: 'María',
    address: 'Calle 1 #23',
    phone_primary: '51234567',
    phone_secondary: '',
    notes: '',
  }

  const calls = {}
  const result = await runStoreCheckout({
    payload: basePayload,
    delivery,
    displayCurrency: 'CUP',
    cupPerUnit: 1,
    ratesReady: true,
    areExchangeRatesAvailable: () => true,
    needsExchangeRatesForDisplay: () => false,
    submitStoreOrder: async (args) => {
      calls.submitArgs = args
      return { id: 'order-2', status: 'pending_confirmation' }
    },
    openWhatsAppCheckout: (args) => {
      calls.whatsappArgs = args
      return true
    },
  })

  assert.equal(result.ok, true)
  assert.deepEqual(calls.submitArgs.delivery, delivery)
  assert.deepEqual(calls.whatsappArgs.delivery, delivery)
})

test('flujo integrado: payload inválido no guarda ni abre WhatsApp', async () => {
  let submit = 0
  let whatsapp = 0
  const result = await runStoreCheckout({
    payload: { storeId: 'x', items: [], storePhone: '1' },
    delivery: { mode: 'pickup', recipient_name: 'A', phone_primary: '51234567' },
    displayCurrency: 'CUP',
    cupPerUnit: 1,
    ratesReady: true,
    areExchangeRatesAvailable: () => true,
    needsExchangeRatesForDisplay: () => false,
    submitStoreOrder: async () => {
      submit += 1
      return { id: 'x', status: 'pending_confirmation' }
    },
    openWhatsAppCheckout: () => {
      whatsapp += 1
      return true
    },
  })

  assert.equal(result.ok, false)
  assert.equal(result.code, CHECKOUT_INVALID_PAYLOAD)
  assert.equal(submit, 0)
  assert.equal(whatsapp, 0)
})
