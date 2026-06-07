import { parseApiDateTime } from './dates'

function parseSubscriptionEnd(value) {
  return parseApiDateTime(value)
}

/** Horas restantes calculadas en el cliente (fallback si el perfil en caché no trae el campo). */
export function getSubscriptionHoursRemaining(profile) {
  const endsAt = parseSubscriptionEnd(profile?.subscription_ends_at)
  if (!endsAt) return null

  const diffMs = endsAt.getTime() - Date.now()
  if (diffMs <= 0) return 0

  return Math.floor(diffMs / (1000 * 60 * 60))
}

export function isSubscriptionEndingToday(profile) {
  const endsAt = parseSubscriptionEnd(profile?.subscription_ends_at)
  if (!endsAt || endsAt.getTime() <= Date.now()) return false

  const now = new Date()
  return (
    endsAt.getFullYear() === now.getFullYear() &&
    endsAt.getMonth() === now.getMonth() &&
    endsAt.getDate() === now.getDate()
  )
}

/**
 * Cartel urgente en General: ≤24 h restantes o vencimiento el mismo día (aún activa).
 */
export function shouldShowSubscriptionUrgentBanner(profile) {
  if (!profile?.subscription_ends_at) return false
  if (profile.subscription_active === false) return false

  const hours = getSubscriptionHoursRemaining(profile)
  if (hours === 0) return false

  if (hours != null && hours > 0 && hours <= 24) return true
  return isSubscriptionEndingToday(profile)
}

export function formatUrgentSubscriptionRemaining(profile) {
  const hours = getSubscriptionHoursRemaining(profile)
  if (hours == null || hours <= 0) return null
  if (isSubscriptionEndingToday(profile) && hours >= 24) return 'hoy'
  if (hours < 1) return 'menos de 1 hora'
  if (hours === 1) return '1 hora'
  if (isSubscriptionEndingToday(profile) && hours < 24) return `${hours} horas (hoy)`
  return `${hours} horas`
}
