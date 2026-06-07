import { formatPrice } from './money'

/**
 * Tasas de referencia temporales hasta integrar El Toque.
 * Valor: cuántos CUP equivalen a 1 unidad de la moneda.
 */
const STUB_CUP_PER_UNIT = {
  CUP: 1,
  USD: 250,
  MLC: 250,
}

function productAcceptsCurrency(product, currencyCode) {
  if (product.base_currency === currencyCode) return true
  return (product.accepted_currencies ?? []).includes(currencyCode)
}

export function convertBetweenCurrencies(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) return amount

  const fromRate = STUB_CUP_PER_UNIT[fromCurrency]
  const toRate = STUB_CUP_PER_UNIT[toCurrency]
  if (!fromRate || !toRate) return amount

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
 */
export function resolveDisplayPrice(product, displayCurrency) {
  const baseAmount = Number(product.base_price)
  const baseCurrency = product.base_currency

  if (!productAcceptsCurrency(product, displayCurrency)) {
    return {
      amount: baseAmount,
      currency: baseCurrency,
      converted: false,
      label: formatPrice(baseAmount, baseCurrency),
    }
  }

  if (displayCurrency === baseCurrency) {
    return {
      amount: baseAmount,
      currency: baseCurrency,
      converted: false,
      label: formatPrice(baseAmount, baseCurrency),
    }
  }

  const amount = convertBetweenCurrencies(baseAmount, baseCurrency, displayCurrency)
  return {
    amount,
    currency: displayCurrency,
    converted: true,
    label: formatPrice(amount, displayCurrency),
  }
}
