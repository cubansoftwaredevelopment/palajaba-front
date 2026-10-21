export const DATE_RANGE_PERIODS = [
  { id: 'daily', label: 'Diario' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensual' },
  { id: 'custom', label: 'Personalizado' },
]

export function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export function isoDate(value) {
  if (!value) return ''
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function rangeForPeriod(period) {
  const to = startOfToday()
  if (period === 'weekly') {
    const from = new Date(to)
    from.setDate(from.getDate() - 6)
    return { from, to }
  }
  if (period === 'monthly') {
    return { from: new Date(to.getFullYear(), to.getMonth(), 1), to }
  }
  return { from: new Date(to), to }
}

export function granularityForRange(period, range) {
  if (period === 'daily' || period === 'weekly' || period === 'monthly') return period
  if (!range?.from || !range?.to) return 'daily'
  const days = Math.round((range.to - range.from) / 86400000) + 1
  if (days <= 14) return 'daily'
  if (days <= 90) return 'weekly'
  return 'monthly'
}

export function formatRangeLabel(range) {
  if (!range?.from || !range?.to) return ''
  const sameDay = isoDate(range.from) === isoDate(range.to)
  const format = (value) =>
    new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(value)
  if (sameDay) return format(range.from)
  return `${format(range.from)} – ${format(range.to)}`
}

export function formatCount(value) {
  return Number(value || 0).toLocaleString('es')
}

export function formatPercent(value) {
  return `${Number(value || 0).toLocaleString('es', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`
}

export function formatRevenueAmount(value, currency) {
  if (currency === 'CUP') {
    return `${Math.round(value).toLocaleString('es')} CUP`
  }
  return `${Number(value).toLocaleString('es', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`
}

export function formatAxisTick(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`
  return String(Math.round(value))
}
