import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  canRespondToQvaPayEvidence,
  canSendQvaPayEvidence,
  isValidQvaPayEvidenceContent,
  qvaPayInvoiceAmounts,
  QVAPAY_EVIDENCE_WARNING,
} from '../../src/lib/qvapayEvidence.js'

test('evidencia bloquea reenvío mientras el cliente debe responder', () => {
  assert.equal(canSendQvaPayEvidence({ payment_status: 'paid', evidence: { status: 'pending' } }), false)
  assert.equal(canRespondToQvaPayEvidence({ evidence: { status: 'pending' } }), true)
})

test('rechazo permite nueva evidencia y aceptación o vencimiento cierran el flujo', () => {
  assert.equal(canSendQvaPayEvidence({ payment_status: 'paid', evidence: { status: 'rejected' } }), true)
  assert.equal(canSendQvaPayEvidence({ payment_status: 'paid', evidence: { status: 'accepted' } }), false)
  assert.equal(canSendQvaPayEvidence({ payment_status: 'paid', evidence: { status: 'expired' } }), false)
  assert.equal(canSendQvaPayEvidence({ payment_status: 'awaiting_payment' }), false)
})

test('evidencia Tiptap acepta texto o imagen y rechaza documento vacío', () => {
  assert.equal(isValidQvaPayEvidenceContent({ type: 'doc', content: [{ type: 'paragraph' }] }), false)
  assert.equal(isValidQvaPayEvidenceContent({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Recibido' }] }] }), true)
  assert.equal(isValidQvaPayEvidenceContent({ type: 'doc', content: [{ type: 'image', attrs: { src: 'https://cdn.test/evidence.png' } }] }), true)
})

test('aviso de 48 horas advierte que se acepte solo al recibir el pedido', () => {
  assert.match(QVAPAY_EVIDENCE_WARNING, /Acepta solo si recibiste/)
  assert.match(QVAPAY_EVIDENCE_WARNING, /rechaza la evidencia ahora/)
  assert.match(QVAPAY_EVIDENCE_WARNING, /liberará automáticamente/)
})

test('muestra los importes acordados de productos, domicilio, fee y factura', () => {
  assert.deepEqual(qvaPayInvoiceAmounts({ products_amount_usd: 12, delivery_amount_usd: 3, fee_usd: 3.87, invoice_amount_usd: 18.87 }), {
    products: 12, delivery: 3, fee: 3.87, total: 18.87,
  })
})
