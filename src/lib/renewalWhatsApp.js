import { buildWhatsAppUrl } from './whatsappOrder'

export function buildRenewalPlanMessage(storeName) {
  const name = (storeName || 'mi tienda').trim()
  return `Buenas, soy la tienda ${name} de Pa' La Jaba.

Le escribo para renovar el plan de suscripción.`
}

export function buildPremiumUpgradeMessage(storeName) {
  const name = (storeName || 'mi tienda').trim()
  return `Buenas, soy la tienda ${name} de Pa' La Jaba.

Deseo pasar al plan Premium.`
}

export function buildRenewalWhatsAppUrl({ storeName, adminPhone }) {
  const message = buildRenewalPlanMessage(storeName)
  return buildWhatsAppUrl(adminPhone, message)
}

export function buildPremiumUpgradeWhatsAppUrl({ storeName, adminPhone }) {
  const message = buildPremiumUpgradeMessage(storeName)
  return buildWhatsAppUrl(adminPhone, message)
}

export function openRenewalWhatsApp({ storeName, adminPhone }) {
  const url = buildRenewalWhatsAppUrl({ storeName, adminPhone })
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

export function openPremiumUpgradeWhatsApp({ storeName, adminPhone }) {
  const url = buildPremiumUpgradeWhatsAppUrl({ storeName, adminPhone })
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
