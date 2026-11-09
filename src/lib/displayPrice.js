import { formatPrice } from './money'
import { areExchangeRatesAvailable, getCupPerUnit } from './exchangeRates'
import { productDiscountPercent, productSaleAmount } from '../products/context.js'

export { productDiscountPercent, productSaleAmount }

const DOLLAR_CURRENCIES = new Set(['USD', 'QUSD'])

function samePaymentCurrency(left, right) {
  const a = String(left || '').trim().toUpperCase()
  const b = String(right || '').trim().toUpperCase()
  if (!a || !b) return false
  if (a === b) return true
  return DOLLAR_CURRENCIES.has(a) && DOLLAR_CURRENCIES.has(b)
}

function productAcceptsCurrency(product, currencyCode) {
  const requested = String(currencyCode || '').trim().toUpperCase()
  if (requested === 'QUSD' && !product?.store?.qvapay_enabled) return false
  return productAcceptedCurrencies(product).some((code) => samePaymentCurrency(code, currencyCode))
}

export function productAcceptedCurrencies(product) {
  const codes = [product?.base_currency, ...(product?.accepted_currencies ?? [])]
  return [...new Set(codes.map((code) => String(code || '').trim().toUpperCase()).filter(Boolean))]
}

export function normalizeDisplayCurrencies(displayCurrency) {
  if (Array.isArray(displayCurrency)) {
    return displayCurrency.filter(Boolean)
  }
  return displayCurrency ? [displayCurrency] : []
}

function withServiceFee(amount, currency, percent) {
  const base = Number(amount)
  const rate = Number(percent)
  if (!Number.isFinite(base) || !Number.isFinite(rate) || rate <= 0) return base
  const cents = Math.round(base * 100)
  const feeCents = Math.round((cents * rate) / 100)
  const total = (cents + feeCents) / 100
  if (String(currency || '').toUpperCase() === 'CUP') return Math.round(total)
  return total
}

function applyServiceFee(price, product) {
  if (String(price?.currency || '').trim().toUpperCase() !== 'QUSD') return price
  const percent = Number(product?.service_fee_percent)
  if (!percent) return price
  const amount = withServiceFee(price.amount, price.currency, percent)
  const next = {
    ...price,
    amount,
    label: formatPrice(amount, price.currency),
  }
  if (price.originalAmount == null) return next
  const originalAmount = withServiceFee(price.originalAmount, price.currency, percent)
  return {
    ...next,
    originalAmount,
    originalLabel: formatPrice(originalAmount, price.currency),
  }
}

export function resolveDisplayPrices(product, displayCurrency, cupPerUnit = getCupPerUnit(), options) {
  const selected = normalizeDisplayCurrencies(displayCurrency)
  const wanted = selected.filter((code) => productAcceptsCurrency(product, code))
  const codes = wanted.length ? wanted : [product.base_currency].filter(Boolean)
  return codes.map((code) => resolveDisplayPrice(product, code, cupPerUnit, options))
}

export function pickCheckoutCurrency(product, displayCurrency) {
  return resolveDisplayPrices(product, displayCurrency)[0]?.currency ?? product?.base_currency
}

export function needsExchangeRatesForDisplay(product, displayCurrency) {
  if (!product || !displayCurrency) return false
  const codes = normalizeDisplayCurrencies(displayCurrency)
  return codes.some(
    (code) =>
      productAcceptsCurrency(product, code) &&
      !samePaymentCurrency(code, product.base_currency),
  )
}

export function convertBetweenCurrencies(
  amount,
  fromCurrency,
  toCurrency,
  cupPerUnit = getCupPerUnit(),
) {
  if (fromCurrency === toCurrency || samePaymentCurrency(fromCurrency, toCurrency)) return amount
  if (!areExchangeRatesAvailable()) return null

  const fromRate = cupPerUnit[fromCurrency]
  const toRate = cupPerUnit[toCurrency]
  if (!fromRate || !toRate) return null

  const inCup = amount * fromRate
  const converted = inCup / toRate

  if (toCurrency === 'CUP') {
    return Math.round(converted)
  }

  return Math.round(converted * 100) / 100
}

/**
 * Convierte el precio con las tasas del toque.
 * El listado ya dejó solo negocios que aceptan la moneda elegida.
 * Si faltan tasas reales, muestra el precio base sin convertir.
 */
function withDiscount(price, product, originalAmount) {
  const discountPercent = productDiscountPercent(product)
  if (!discountPercent || originalAmount == null) return price
  return {
    ...price,
    originalAmount,
    originalLabel: formatPrice(originalAmount, price.currency),
    discountPercent,
  }
}

export function resolveDisplayPrice(product, displayCurrency, cupPerUnit = getCupPerUnit(), options = {}) {
  const listAmount = Number(product.base_price)
  const saleAmount = productSaleAmount(product)
  const baseCurrency = product.base_currency
  const requestedCurrency = String(displayCurrency || '').trim().toUpperCase()
  const discountPercent = productDiscountPercent(product)
  const includeFee = options.applyServiceFee !== false
  const present = (price) => (includeFee ? applyServiceFee(price, product) : price)

  if (!productAcceptsCurrency(product, requestedCurrency)) {
    return present(withDiscount(
      {
        amount: saleAmount,
        currency: baseCurrency,
        converted: false,
        conversionPending: false,
        label: formatPrice(saleAmount, baseCurrency),
      },
      product,
      discountPercent ? listAmount : null,
    ))
  }

  if (requestedCurrency === String(baseCurrency || '').trim().toUpperCase() || samePaymentCurrency(requestedCurrency, baseCurrency)) {
    return present(withDiscount(
      {
        amount: saleAmount,
        currency: requestedCurrency,
        converted: false,
        conversionPending: false,
        label: formatPrice(saleAmount, requestedCurrency),
      },
      product,
      discountPercent ? listAmount : null,
    ))
  }

  const amount = convertBetweenCurrencies(saleAmount, baseCurrency, requestedCurrency, cupPerUnit)
  if (amount === null) {
    return present(withDiscount(
      {
        amount: saleAmount,
        currency: baseCurrency,
        converted: false,
        conversionPending: true,
        label: formatPrice(saleAmount, baseCurrency),
      },
      product,
      discountPercent ? listAmount : null,
    ))
  }

  const originalAmount = discountPercent
    ? convertBetweenCurrencies(listAmount, baseCurrency, requestedCurrency, cupPerUnit)
    : null

  return present(withDiscount(
    {
      amount,
      currency: requestedCurrency,
      converted: true,
      conversionPending: false,
      label: formatPrice(amount, requestedCurrency),
    },
    product,
    originalAmount,
  ))
}
