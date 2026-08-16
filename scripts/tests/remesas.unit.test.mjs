import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  buildRemesaWhatsAppMessage,
  computeRemesaAmounts,
  formatEuro,
  validateRemesaForm,
} from '../../src/lib/remesas.js'

test('100€ envía 90€ netos con comisión del 10%', () => {
  const amounts = computeRemesaAmounts('100')
  assert.equal(amounts.sent, 100)
  assert.equal(amounts.net, 90)
  assert.equal(amounts.commission, 10)
  assert.equal(formatEuro(amounts.net), '90€')
})

test('el mensaje de WhatsApp incluye monto, neto, comisión, municipio y dirección', () => {
  const message = buildRemesaWhatsAppMessage({
    amount: '100',
    sender_name: 'Ana',
    recipient_name: 'Luis',
    recipient_details: 'CI 123',
    contact_phone: '+34600111222',
    municipality_id: 'playa',
    address: 'Calle 1 #23',
  })

  assert.match(message, /Monto enviado:\* 100€/)
  assert.match(message, /Comisión \(10%\):\* 10€/)
  assert.match(message, /El destinatario recibe:\* 90€/)
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
