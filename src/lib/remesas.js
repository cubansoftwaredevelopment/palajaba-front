import {
  REMESA_COMMISSION_RATE,
  REMESA_MIN_COMMISSION,
  REMESA_MIN_SENT,
  REMESA_MUNICIPALITIES,
  REMESA_NET_RATE,
  REMESA_WHATSAPP_PHONE,
  REMESA_ZONE,
} from '../constants/remesas.js'

function roundEuro(amount) {
  return Math.round(Number(amount) * 100) / 100
}

export function parseEuroAmount(value) {
  const raw = String(value ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.')
  if (!raw) return null
  const amount = Number.parseFloat(raw)
  if (!Number.isFinite(amount) || amount <= 0) return null
  return roundEuro(amount)
}

export function formatEuro(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '—'
  const value = Number(amount)
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${formatted}€`
}

export function computeRemesaAmounts(sentAmount) {
  const sent = parseEuroAmount(sentAmount)
  if (sent == null) return null
  return {
    sent,
    commission: roundEuro(sent * REMESA_COMMISSION_RATE),
    net: roundEuro(sent * REMESA_NET_RATE),
  }
}

export function getRemesaMunicipality(id) {
  return REMESA_MUNICIPALITIES.find((item) => item.id === id) ?? null
}

export function validateRemesaForm(form) {
  const amounts = computeRemesaAmounts(form.amount)
  if (!amounts) return 'Indica el monto en euros que quieres enviar.'
  if (amounts.commission < REMESA_MIN_COMMISSION) {
    return `La comisión mínima es ${formatEuro(REMESA_MIN_COMMISSION)}. Debes enviar al menos ${formatEuro(REMESA_MIN_SENT)}.`
  }

  if (!form.sender_name?.trim()) return 'Indica el nombre del remitente.'
  if (!form.recipient_name?.trim()) return 'Indica el nombre del destinatario en Cuba.'

  const contactDigits = String(form.contact_phone ?? '').replace(/\D/g, '')
  if (contactDigits.length < 8) return 'Indica un teléfono o WhatsApp de contacto válido.'

  if (!getRemesaMunicipality(form.municipality_id)) {
    return 'Selecciona el municipio de entrega en La Habana.'
  }

  if (!form.address?.trim()) return 'Indica la dirección de entrega.'

  return null
}

export function buildRemesaWhatsAppMessage(form) {
  const amounts = computeRemesaAmounts(form.amount)
  const municipality = getRemesaMunicipality(form.municipality_id)
  if (!amounts || !municipality) return null

  const lines = [
    `Hola, quiero enviar una remesa desde Pa' La Jaba:`,
    '',
    `*Monto enviado:* ${formatEuro(amounts.sent)}`,
    `*Comisión (10%):* ${formatEuro(amounts.commission)}`,
    `*El destinatario recibe:* ${formatEuro(amounts.net)}`,
    '',
    `*Remitente:* ${form.sender_name.trim()}`,
    `*Destinatario:* ${form.recipient_name.trim()}`,
  ]

  const recipientDetails = form.recipient_details?.trim()
  if (recipientDetails) {
    lines.push(`*Datos del destinatario:* ${recipientDetails}`)
  }

  lines.push(
    `*WhatsApp de contacto:* ${form.contact_phone.trim()}`,
    `*Municipio:* ${municipality.name}, ${REMESA_ZONE}`,
    `*Dirección:* ${form.address.trim()}`,
    '',
    '*Domicilio:* Costo de domicilio: 1€ por km, se paga en Cuba y se confirma por WhatsApp',
    '',
    '¡Gracias!',
  )

  return lines.join('\n')
}

export async function openRemesaWhatsApp({ form, phone = REMESA_WHATSAPP_PHONE }) {
  const message = buildRemesaWhatsAppMessage(form)
  const [{ buildWhatsAppUrl }, { openExternalUrl }] = await Promise.all([
    import('./whatsappOrder.js'),
    import('./nativeApp.js'),
  ])
  const url = buildWhatsAppUrl(phone, message)
  if (!url) return false
  openExternalUrl(url)
  return true
}
