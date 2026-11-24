export function formatCup(amount) {
  return formatPrice(amount, 'CUP')
}

export function formatPrice(amount, currencyCode = 'CUP') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—'
  }
  const code = String(currencyCode || 'CUP').toUpperCase()
  const value = Number(amount)
  const whole = code === 'CUP' || Math.abs(value - Math.round(value)) < 0.001
  const formatted = value.toLocaleString('es', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })
  return `${formatted} ${code}`
}

export function parseCupInput(value, { allowZero = false } = {}) {
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return null
  const amount = Number.parseInt(digits, 10)
  if (!Number.isFinite(amount) || amount < 0) return null
  if (!allowZero && amount < 1) return null
  return amount
}
