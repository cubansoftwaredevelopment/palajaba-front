import { formatPrice } from './money'
import { areExchangeRatesAvailable, getCupPerUnit } from './exchangeRates'
import { productDiscountPercent, productSaleAmount } from '../products/context.js'

export { productDiscountPercent, productSaleAmount }

function productAcceptsCurrency(product, currencyCode) {
  if (product.base_currency === currencyCode) return true
  return (product.accepted_currencies ?? []).includes(currencyCode)
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

export function resolveDisplayPrices(product, displayCurrency, cupPerUnit = getCupPerUnit()) {
  const selected = normalizeDisplayCurrencies(displayCurrency)
  const accepted = productAcceptedCurrencies(product)
  const wanted = selected.filter((code) => accepted.includes(code))
  const codes = wanted.length ? wanted : [product.base_currency].filter(Boolean)
  return codes.map((code) => resolveDisplayPrice(product, code, cupPerUnit))
}

export function pickCheckoutCurrency(product, displayCurrency) {
  return resolveDisplayPrices(product, displayCurrency)[0]?.currency ?? product?.base_currency
}

export function needsExchangeRatesForDisplay(product, displayCurrency) {
  if (!product || !displayCurrency) return false
  const codes = normalizeDisplayCurrencies(displayCurrency)
  return codes.some((code) => productAcceptsCurrency(product, code) && code !== product.base_currency)
}

export function convertBetweenCurrencies(
  amount,
  fromCurrency,
  toCurrency,
  cupPerUnit = getCupPerUnit(),
) {
  if (fromCurrency === toCurrency) return amount
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

export function resolveDisplayPrice(product, displayCurrency, cupPerUnit = getCupPerUnit()) {
  const listAmount = Number(product.base_price)
  const saleAmount = productSaleAmount(product)
  const baseCurrency = product.base_currency
  const discountPercent = productDiscountPercent(product)

  if (!productAcceptsCurrency(product, displayCurrency)) {
    return withDiscount(
      {
        amount: saleAmount,
        currency: baseCurrency,
        converted: false,
        conversionPending: false,
        label: formatPrice(saleAmount, baseCurrency),
      },
      product,
      discountPercent ? listAmount : null,
    )
  }

  if (displayCurrency === baseCurrency) {
    return withDiscount(
      {
        amount: saleAmount,
        currency: baseCurrency,
        converted: false,
        conversionPending: false,
        label: formatPrice(saleAmount, baseCurrency),
      },
      product,
      discountPercent ? listAmount : null,
    )
  }

  const amount = convertBetweenCurrencies(saleAmount, baseCurrency, displayCurrency, cupPerUnit)
  if (amount === null) {
    return withDiscount(
      {
        amount: saleAmount,
        currency: baseCurrency,
        converted: false,
        conversionPending: true,
        label: formatPrice(saleAmount, baseCurrency),
      },
      product,
      discountPercent ? listAmount : null,
    )
  }

  const originalAmount = discountPercent
    ? convertBetweenCurrencies(listAmount, baseCurrency, displayCurrency, cupPerUnit)
    : null

  return withDiscount(
    {
      amount,
      currency: displayCurrency,
      converted: true,
      conversionPending: false,
      label: formatPrice(amount, displayCurrency),
    },
    product,
    originalAmount,
  )
}
