export const QVAPAY_EVIDENCE_WARNING =
  'Acepta solo si recibiste tu pedido. Si aún no lo recibiste, rechaza la evidencia ahora y contacta a soporte. No esperes a que venza el plazo de 48 horas: el pago se liberará automáticamente.'

const terminalEvidenceStatuses = new Set(['accepted', 'expired'])

export function canSendQvaPayEvidence(qvapay) {
  const evidenceStatus = qvapay?.evidence?.status
  return qvapay?.payment_status === 'paid'
    && qvapay?.release_status !== 'released'
    && evidenceStatus !== 'pending'
    && !terminalEvidenceStatuses.has(evidenceStatus)
}

export function canRespondToQvaPayEvidence(qvapay) {
  return qvapay?.evidence?.status === 'pending'
}

export function isValidQvaPayEvidenceContent(content) {
  let hasText = false
  let hasImage = false
  function visit(node) {
    if (!node || typeof node !== 'object') return
    if (node.type === 'text' && String(node.text || '').trim()) hasText = true
    if (node.type === 'image' && String(node.attrs?.src || '').trim()) hasImage = true
    for (const child of node.content || []) visit(child)
  }
  visit(content)
  return hasText || hasImage
}

export function qvaPayInvoiceAmounts(qvapay) {
  return {
    products: Number(qvapay?.products_amount_usd || 0),
    delivery: Number(qvapay?.delivery_amount_usd || 0),
    fee: Number(qvapay?.fee_usd || 0),
    total: Number(qvapay?.invoice_amount_usd || 0),
  }
}
