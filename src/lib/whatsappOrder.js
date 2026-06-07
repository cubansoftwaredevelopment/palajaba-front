import { PHONE_PREFIX } from './phone'
import { resolveDisplayPrice } from './displayPrice'
import { formatPrice } from './money'

export function phoneToWhatsAppId(phone) {
  const digits = String(phone ?? '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('53') && digits.length >= 10) return digits
  if (digits.length === 8) return `53${digits}`
  return digits
}

function formatContactPhone(digits) {
  if (!digits) return null
  const normalized = String(digits).replace(/\D/g, '')
  if (normalized.length !== 8) return normalized
  return `${PHONE_PREFIX} ${normalized.slice(0, 1)} ${normalized.slice(1, 4)} ${normalized.slice(4)}`
}

function buildDeliverySection(delivery) {
  if (!delivery) return ''

  const phones = [delivery.phone_primary, delivery.phone_secondary]
    .map((value) => formatContactPhone(value))
    .filter(Boolean)

  const lines = [
    '',
    '*Entrega a domicilio*',
    `Recibe: ${delivery.recipient_name}`,
    `Dirección: ${delivery.address}`,
    `Contacto: ${phones.join(', ')}`,
  ]

  if (delivery.notes?.trim()) {
    lines.push(`Detalles: ${delivery.notes.trim()}`)
  }

  return lines.join('\n')
}

export function buildStoreOrderMessage({ storeName, items, delivery = null, displayCurrency = 'CUP' }) {
  const lines = items.map((item) => {
    const qty = item.quantity ?? 1
    const price = resolveDisplayPrice(item, displayCurrency)
    const unitPrice = formatPrice(price.amount, price.currency)
    const line =
      qty > 1
        ? `• ${item.name} x${qty} — ${formatPrice(price.amount * qty, price.currency)} (${unitPrice} c/u)`
        : `• ${item.name} — ${unitPrice}`
    return line
  })

  const totalsByCurrency = {}
  for (const item of items) {
    const price = resolveDisplayPrice(item, displayCurrency)
    const amount = Number(price.amount) * (item.quantity ?? 1)
    totalsByCurrency[price.currency] = (totalsByCurrency[price.currency] ?? 0) + amount
  }

  const totalLine = Object.entries(totalsByCurrency)
    .map(([currency, amount]) => formatPrice(amount, currency))
    .join(' + ')

  const deliverySection = buildDeliverySection(delivery)

  return `Hola, quiero pedir desde Pa' La Jaba en *${storeName}*:

${lines.join('\n')}

*Total:* ${totalLine}${deliverySection}

¡Gracias!`
}

export function buildWhatsAppUrl(phone, message) {
  const id = phoneToWhatsAppId(phone)
  if (!id || !message) return null
  return `https://wa.me/${id}?text=${encodeURIComponent(message)}`
}

export function openWhatsAppCheckout({ storeName, storePhone, items, delivery = null, displayCurrency = 'CUP' }) {
  if (!items?.length) return false

  const message = buildStoreOrderMessage({ storeName, items, delivery, displayCurrency })
  const url = buildWhatsAppUrl(storePhone, message)
  if (!url) return false

  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
