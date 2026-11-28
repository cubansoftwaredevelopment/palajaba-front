/**
 * Recorrido de compra QvaPay y pago al mensajero con usuario verificado.
 *
 * Uso (desde palajaba-front/):
 *   node scripts/tests/qvapayMessengerCheckout.e2e.test.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { runStoreCheckout } from '../../src/buyer/utils/runStoreCheckout.js'
import {
  buildCourierBatchPayload,
  canPayCourierWithQvaPay,
  courierAssignmentError,
  courierPayChoices,
} from '../../src/mensajeros/utils/courierQvaPay.js'

const root = dirname(fileURLToPath(import.meta.url))
const checkoutSource = readFileSync(join(root, '../../src/buyer/context/context.js'), 'utf8')
const modalSource = readFileSync(join(root, '../../src/mensajeros/componentes/AssignCourierModal.jsx'), 'utf8')
const qvapaySettingsSource = readFileSync(join(root, '../../src/mensajeros/componentes/MensajeroQvaPaySettings.jsx'), 'utf8')

const payload = {
  storeId: 'store-1',
  storeName: 'La Tienda',
  storePhone: '+5351234567',
  items: [{ id: 'malanga', name: 'Malanga', quantity: 1, price_cup: 400 }],
}

test('comprar con QvaPay y pagarle al mensajero verificado', async () => {
  // El checkout, el modal de asignación y el alta de QvaPay del mensajero usan estas reglas.
  assert.match(checkoutSource, /delivery\?\.payment_method === 'qvapay'/)
  assert.match(checkoutSource, /runWhatsAppCheckout\(payload, delivery, 'qvapay'\)/)
  assert.match(modalSource, /courierAssignmentError\(orders, fees, messenger\)/)
  assert.match(modalSource, /buildCourierBatchPayload\(messenger\.id, orders, fees\)/)
  assert.match(modalSource, /courierPayChoices\(order, messenger\)/)
  assert.match(qvapaySettingsSource, /saveMensajeroQvapay/)
  assert.match(qvapaySettingsSource, /qvapay_verified/)

  // Comprar por QvaPay guarda el pedido y no abre WhatsApp.
  const calls = { whatsapp: 0, submit: null }
  const checkout = await runStoreCheckout({
    payload,
    delivery: {
      recipient_name: 'José',
      address: 'Calle 12',
      phone_primary: '51234567',
      accepted_delivery_policy: true,
      accepted_terms: true,
      payment_method: 'qvapay',
    },
    displayCurrency: 'CUP',
    cupPerUnit: 400,
    ratesReady: true,
    areExchangeRatesAvailable: () => true,
    needsExchangeRatesForDisplay: () => false,
    paymentMethod: 'qvapay',
    submitStoreOrder: async (args) => {
      calls.submit = args
      return {
        id: 'pedido-qvapay',
        status: 'pending_confirmation',
        payment_method: args.paymentMethod,
      }
    },
    openWhatsAppCheckout: () => {
      calls.whatsapp += 1
      return true
    },
  })

  assert.equal(checkout.ok, true)
  assert.equal(checkout.paymentMethod, 'qvapay')
  assert.equal(checkout.whatsappOpened, false)
  assert.equal(calls.whatsapp, 0)
  assert.equal(calls.submit.paymentMethod, 'qvapay')
  assert.equal(calls.submit.acceptedDeliveryPolicy, true)
  assert.equal(calls.submit.acceptedTerms, true)

  // El domicilio ya tiene precio. El cobro al mensajero es la mitad: 200 CUP.
  const order = {
    id: 'pedido-qvapay',
    payment_method: 'qvapay',
    delivery_price: 400,
    delivery_currency: 'CUP',
    qvapay: { payment_status: 'awaiting_payment' },
  }
  const unverified = { id: 'rocio', qvapay_username: null, qvapay_verified: false }
  const verified = { id: 'rocio', qvapay_username: 'rocioqva', qvapay_verified: true }
  const fees = {
    'pedido-qvapay': { pay_via: 'qvapay', fee_amount: '200', fee_currency: 'CUP' },
  }

  // Sin pago confirmado no se puede asignar el domicilio, ni por QvaPay ni en otra moneda.
  assert.equal(
    courierAssignmentError([order], fees, unverified),
    'El cliente todavía no pagó este pedido por QvaPay.',
  )
  assert.equal(canPayCourierWithQvaPay(order, unverified), false)
  assert.equal(courierPayChoices(order, unverified).some((choice) => choice.value === 'qvapay'), false)

  // Ya pagó, pero Rocío no tiene QvaPay verificado: esa opción no aparece y la asignación se rechaza.
  order.qvapay.payment_status = 'paid'
  assert.equal(
    courierAssignmentError([order], fees, unverified),
    'Este mensajero no tiene QvaPay verificado.',
  )
  assert.equal(courierPayChoices(order, { ...verified, qvapay_verified: false }).some((choice) => choice.value === 'qvapay'), false)

  // Con el usuario verificado, el lote sale por QvaPay con los 200 CUP del domicilio.
  assert.equal(courierAssignmentError([order], fees, verified), '')
  assert.equal(canPayCourierWithQvaPay(order, verified), true)
  assert.deepEqual(courierPayChoices(order, verified), [
    { value: 'other', label: 'Otra moneda' },
    { value: 'qvapay', label: 'QvaPay' },
  ])
  assert.deepEqual(buildCourierBatchPayload(verified.id, [order], fees), {
    mensajero_id: 'rocio',
    orders: [{
      order_id: 'pedido-qvapay',
      pay_via: 'qvapay',
      fee_amount: 200,
      fee_currency: 'CUP',
    }],
  })
})
