import { DEFAULT_DISPLAY_CURRENCY, DISPLAY_CURRENCIES } from '../constants/currencies'

const STORAGE_KEY = 'pala-jaba-buyer-display-currencies'
const LEGACY_KEY = 'pala-jaba-buyer-display-currency'
export const BUYER_DISPLAY_CURRENCY_EVENT = 'buyer-display-currency-change'

const VALID_CODES = new Set(DISPLAY_CURRENCIES.map((item) => item.code))

function uniqueValid(codes) {
  const next = []
  for (const raw of codes ?? []) {
    const code = String(raw || '').trim().toUpperCase()
    if (VALID_CODES.has(code) && !next.includes(code)) next.push(code)
  }
  return next
}

export function getBuyerDisplayCurrencies() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      const codes = uniqueValid(Array.isArray(parsed) ? parsed : [parsed])
      if (codes.length) return codes
    } catch {
      const codes = uniqueValid([raw])
      if (codes.length) return codes
    }
  }
  const legacy = localStorage.getItem(LEGACY_KEY)
  if (legacy && VALID_CODES.has(legacy)) return [legacy]
  return [DEFAULT_DISPLAY_CURRENCY]
}

export function getBuyerDisplayCurrency() {
  return getBuyerDisplayCurrencies()[0] ?? DEFAULT_DISPLAY_CURRENCY
}

export function setBuyerDisplayCurrencies(codes) {
  const next = uniqueValid(codes)
  if (!next.length) next.push(DEFAULT_DISPLAY_CURRENCY)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  localStorage.setItem(LEGACY_KEY, next[0])
  window.dispatchEvent(new CustomEvent(BUYER_DISPLAY_CURRENCY_EVENT, { detail: next }))
  return next
}

export function setBuyerDisplayCurrency(code) {
  return setBuyerDisplayCurrencies([code])
}

export function toggleBuyerDisplayCurrency(code) {
  const current = getBuyerDisplayCurrencies()
  const normalized = String(code || '').trim().toUpperCase()
  if (!VALID_CODES.has(normalized)) return current
  const next = current.includes(normalized)
    ? current.filter((item) => item !== normalized)
    : [...current, normalized]
  if (!next.length) return current
  return setBuyerDisplayCurrencies(next)
}
