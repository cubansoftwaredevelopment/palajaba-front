import { DEFAULT_DISPLAY_CURRENCY, DISPLAY_CURRENCIES } from '../constants/currencies'

const STORAGE_KEY = 'pala-jaba-buyer-display-currency'

const VALID_CODES = new Set(DISPLAY_CURRENCIES.map((item) => item.code))

export function getBuyerDisplayCurrency() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw && VALID_CODES.has(raw)) return raw
  return DEFAULT_DISPLAY_CURRENCY
}

export function setBuyerDisplayCurrency(code) {
  const normalized = code?.trim().toUpperCase()
  if (!VALID_CODES.has(normalized)) return
  localStorage.setItem(STORAGE_KEY, normalized)
  window.dispatchEvent(new CustomEvent('buyer-display-currency-change', { detail: normalized }))
}
