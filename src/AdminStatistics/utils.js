import { format } from 'date-fns'

export const POLL_MS = 10_000

export const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

export function isoDate(value) {
  return format(value, 'yyyy-MM-dd')
}

export function buildChartQuery(granularity, range) {
  if (range?.from && range?.to) {
    return {
      granularity,
      start: isoDate(range.from),
      end: isoDate(range.to),
    }
  }
  if (granularity === 'monthly') return { granularity }
  const now = new Date()
  return {
    granularity,
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

export function buildMonthQuery(query) {
  if (query.start && query.end) {
    return { start: query.start, end: query.end }
  }
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  }
}

export function periodLabel(stats) {
  if (!stats) return ''
  return `${MONTH_NAMES[stats.month - 1]} ${stats.year}`
}

export function isMultiDayRange(range, pointCount) {
  return (
    Boolean(range?.from && range?.to && isoDate(range.from) !== isoDate(range.to)) ||
    (!range?.from && pointCount > 1)
  )
}
