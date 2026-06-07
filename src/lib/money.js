export function formatCup(amount) {
  return formatPrice(amount, 'CUP')
}

export function formatPrice(amount, currencyCode = 'CUP') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—'
  }
  return `${Number(amount).toLocaleString('es')} ${currencyCode}`
}

export function parseCupInput(value) {
  const digits = String(value).replace(/\D/g, '')
  if (!digits) return null
  const amount = Number.parseInt(digits, 10)
  if (!Number.isFinite(amount) || amount < 1) return null
  return amount
}
