import { buildWhatsAppUrl } from './whatsappOrder'
import { buildAdvertisingPlanMessage } from '../constants/advertisingPlans'

export { buildAdvertisingPlanMessage }

export function buildRenewalPlanMessage(storeName) {
  const name = (storeName || 'mi tienda').trim()
  return `Buenas, soy la tienda ${name} de Pa' La Jaba.

Le escribo para renovar el plan de suscripción.`
}

export function buildPremiumUpgradeMessage(storeName, details = {}) {
  const name = (storeName || 'mi tienda').trim()
  const currentPlan = String(details.currentPlanName || '').trim()
  const targetPlan = String(details.targetPlanName || '').trim()
  const billingLabel = String(details.billingLabel || '').trim()

  if (targetPlan) {
    const currentLine = currentPlan
      ? `Estoy en el plan ${currentPlan}${billingLabel ? ` (${billingLabel})` : ''} y deseo pasar al plan ${targetPlan}.`
      : `Deseo pasar al plan ${targetPlan}.`
    return `Buenas, soy la tienda ${name} de Pa' La Jaba.

${currentLine}`
  }

  return `Buenas, soy la tienda ${name} de Pa' La Jaba.

Deseo pasar a un plan superior (Pro o Premium).`
}

export function buildRenewalWhatsAppUrl({ storeName, adminPhone }) {
  const message = buildRenewalPlanMessage(storeName)
  return buildWhatsAppUrl(adminPhone, message)
}

export function buildPremiumUpgradeWhatsAppUrl({
  storeName,
  adminPhone,
  currentPlanName,
  targetPlanName,
  billingLabel,
}) {
  const message = buildPremiumUpgradeMessage(storeName, {
    currentPlanName,
    targetPlanName,
    billingLabel,
  })
  return buildWhatsAppUrl(adminPhone, message)
}

export function openRenewalWhatsApp({ storeName, adminPhone }) {
  const url = buildRenewalWhatsAppUrl({ storeName, adminPhone })
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

export function openPremiumUpgradeWhatsApp({
  storeName,
  adminPhone,
  currentPlanName,
  targetPlanName,
  billingLabel,
}) {
  const url = buildPremiumUpgradeWhatsAppUrl({
    storeName,
    adminPhone,
    currentPlanName,
    targetPlanName,
    billingLabel,
  })
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

export function buildAdvertisingPlanWhatsAppUrl({ storeName, planName, adminPhone }) {
  const message = buildAdvertisingPlanMessage(storeName, planName)
  return buildWhatsAppUrl(adminPhone, message)
}

export function openAdvertisingPlanWhatsApp({ storeName, planName, adminPhone }) {
  const url = buildAdvertisingPlanWhatsAppUrl({ storeName, planName, adminPhone })
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
