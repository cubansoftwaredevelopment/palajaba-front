import { formatPrice } from './money'
import { areExchangeRatesAvailable, getCupPerUnit } from './exchangeRates'

function productAcceptsCurrency(product, currencyCode) {
  if (product.base_currency === currencyCode) return true
  return (product.accepted_currencies ?? []).includes(currencyCode)
}

export function needsExchangeRatesForDisplay(product, displayCurrency) {
  if (!product || !displayCurrency) return false
  if (!productAcceptsCurrency(product, displayCurrency)) return false
  return displayCurrency !== product.base_currency
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
 * Resuelve el precio a mostrar según la moneda elegida por el comprador.
 * Solo convierte si la tienda acepta esa moneda; si no, mantiene el precio base.
 * Si faltan tasas reales, muestra el precio base sin convertir.
 */
export function resolveDisplayPrice(product, displayCurrency, cupPerUnit = getCupPerUnit()) {
  const baseAmount = Number(product.base_price)
  const baseCurrency = product.base_currency

  if (!productAcceptsCurrency(product, displayCurrency)) {
    return {
      amount: baseAmount,
      currency: baseCurrency,
      converted: false,
      conversionPending: false,
      label: formatPrice(baseAmount, baseCurrency),
    }
  }

  if (displayCurrency === baseCurrency) {
    return {
      amount: baseAmount,
      currency: baseCurrency,
      converted: false,
      conversionPending: false,
      label: formatPrice(baseAmount, baseCurrency),
    }
  }

  const amount = convertBetweenCurrencies(baseAmount, baseCurrency, displayCurrency, cupPerUnit)
  if (amount === null) {
    return {
      amount: baseAmount,
      currency: baseCurrency,
      converted: false,
      conversionPending: true,
      label: formatPrice(baseAmount, baseCurrency),
    }
  }

  return {
    amount,
    currency: displayCurrency,
    converted: true,
    conversionPending: false,
    label: formatPrice(amount, displayCurrency),
  }
}
