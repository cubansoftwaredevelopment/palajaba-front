/** Fechas ISO del API: naive UTC sin sufijo → se tratan como UTC y se muestran en hora local. */
export function parseApiDateTime(value) {
  if (!value) return null
  const text = String(value).trim()
  if (!text) return null
  const normalized = /[zZ]|[+-]\d{2}:?\d{2}$/.test(text) ? text : `${text}Z`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

export function addBillingPeriod(fromDate, billingPeriod) {
  const date = parseApiDateTime(fromDate) ?? new Date(fromDate)
  if (billingPeriod === 'yearly') {
    date.setFullYear(date.getFullYear() + 1)
  } else {
    date.setMonth(date.getMonth() + 1)
  }
  return date
}

export function formatDateTime(value) {
  const date = parseApiDateTime(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatOrderDateTime(value) {
  const date = parseApiDateTime(value)
  if (!date) return '—'
  return new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDateLabel(date) {
  return new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(date)
}

/** Envía solo la fecha (YYYY-MM-DD) en hora local */
export function formatDateForApi(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return null
  }
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function startOfDay(date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function parseApiDate(value) {
  const date = parseApiDateTime(value)
  if (!date) return null
  return startOfDay(date)
}

export function daysUntil(value) {
  const date = parseApiDateTime(value)
  if (!date) return null
  const end = startOfDay(date)
  const today = startOfDay(new Date())
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

export function formatRelativeTime(value) {
  const date = parseApiDateTime(value)
  if (!date) return ''

  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} min`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Hace ${diffHours} h`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return `Hace ${diffDays} días`

  return formatDateTime(value)
}
