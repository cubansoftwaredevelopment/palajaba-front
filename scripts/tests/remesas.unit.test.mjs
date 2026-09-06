import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildRemesaWhatsAppMessage,
  computeRemesaAmounts,
  formatEuro,
  validateRemesaForm,
} from '../../src/lib/remesas.js'

test('100€ recibidos generan 10€ de comisión y 110€ a transferir', () => {
  const amounts = computeRemesaAmounts('100')
  assert.equal(amounts.received, 100)
  assert.equal(amounts.commission, 10)
  assert.equal(amounts.toTransfer, 110)
  assert.equal(formatEuro(amounts.toTransfer), '110€')
})

test('el mensaje de WhatsApp incluye el monto recibido, la comisión y la cantidad a transferir', () => {
  const message = buildRemesaWhatsAppMessage({
    amount: '100',
    sender_name: 'Ana',
    recipient_name: 'Luis',
    recipient_details: 'CI 123',
    contact_phone: '+34600111222',
    municipality_id: 'playa',
    address: 'Calle 1 #23',
  })

  assert.match(message, /El destinatario recibe:\* 100€/)
  assert.match(message, /Comisión \(10%\):\* 10€/)
  assert.match(message, /Cantidad a transferir:\* 110€/)
  assert.match(message, /Playa, La Habana/)
  assert.match(message, /Calle 1 #23/)
})

test('el formulario exige municipio y dirección', () => {
  const error = validateRemesaForm({
    amount: '50',
    sender_name: 'Ana',
    recipient_name: 'Luis',
    contact_phone: '600111222',
    municipality_id: '',
    address: '',
  })
  assert.equal(error, 'Selecciona el municipio de entrega en La Habana.')
})

test('rechaza montos cuya comisión queda por debajo de 5€', () => {
  const error = validateRemesaForm({
    amount: '40',
    sender_name: 'Ana',
    recipient_name: 'Luis',
    contact_phone: '600111222',
    municipality_id: 'playa',
    address: 'Calle 1',
  })
  assert.equal(error, 'La comisión mínima es 5€. El destinatario debe recibir al menos 50€.')
})

test('50€ cumple la comisión mínima de 5€', () => {
  const amounts = computeRemesaAmounts('50')
  assert.equal(amounts.commission, 5)
  assert.equal(amounts.toTransfer, 55)
  assert.equal(
    validateRemesaForm({
      amount: '50',
      sender_name: 'Ana',
      recipient_name: 'Luis',
      contact_phone: '600111222',
      municipality_id: 'playa',
      address: 'Calle 1',
    }),
    null,
  )
})
