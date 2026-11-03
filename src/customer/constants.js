import { buildWhatsAppUrl } from '../lib/whatsappOrder'

export const sectionClass = 'rounded-2xl border border-brand-green/10 bg-brand-white p-4 shadow-sm sm:p-6'

const statusLabel = { pending_confirmation: 'Por procesar', completed: 'Completado', cancelled: 'Cancelado' }

export function getBuyerOrderStatusLabel(order) {
  const evidenceStatus = order.payment_method === 'qvapay' ? order.qvapay?.evidence?.status : null
  if (evidenceStatus === 'pending') return 'Evidencia enviada'
  if (evidenceStatus === 'rejected') return 'Evidencia rechazada'
  return statusLabel[order.status] || order.status
}

export function needsBuyerOrderAttention(order) {
  return order.payment_method === 'qvapay'
    && ['pending', 'rejected'].includes(order.qvapay?.evidence?.status)
}

export function orderIsInRange(order, range) {
  if (!range?.from || !range?.to) return true
  const date = new Date(order.created_at)
  const from = new Date(range.from)
  const to = new Date(range.to)
  if ([date, from, to].some((value) => Number.isNaN(value.getTime()))) return false
  from.setHours(0, 0, 0, 0)
  to.setHours(23, 59, 59, 999)
  return date >= from && date <= to
}

export function parseDateValue(value) {
  if (!value) return null
  let parsed
  if (typeof value === 'string') {
    const normalized = value.trim().replace(/(\.\d{3})\d+/, '$1')
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
    parsed = new Date(isDateOnly
      ? `${normalized}T00:00:00`
      : hasTimezone ? normalized : `${normalized}Z`)
  } else {
    parsed = new Date(value)
  }
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatDate(value) {
  const dateValue = parseDateValue(value)
  if (!dateValue) return '—'
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(dateValue)
}

export function normalizedPhoneDigits(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.startsWith('53') && digits.length === 10 ? digits.slice(2) : digits
}

export function getEvidenceSupportWhatsAppUrl(phone, order) {
  const message = `Hola, necesito ayuda con la evidencia rechazada del pedido #${String(order?.id || '').slice(-6).toUpperCase()} en Pa' La Jaba.`
  return buildWhatsAppUrl(phone, message) || `https://wa.me/?text=${encodeURIComponent(message)}`
}
