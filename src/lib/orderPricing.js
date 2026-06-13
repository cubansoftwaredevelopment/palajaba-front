import { getCupPerUnit } from './exchangeRates'
import { resolveDisplayPrice } from './displayPrice'

export function resolveOrderLineItems(items, displayCurrency, cupPerUnit = getCupPerUnit()) {
  return items.map((item) => {
    const price = resolveDisplayPrice(item, displayCurrency, cupPerUnit)
    return {
      product_id: item.id,
      name: item.name,
      quantity: item.quantity ?? 1,
      unit_price: price.amount,
      currency: price.currency,
    }
  })
}

/** Si todos los productos quedan en la misma moneda, esa es la moneda del pedido. */
export function inferOrderPaymentCurrency(lineItems) {
  if (!lineItems?.length) return null
  const currencies = new Set(lineItems.map((line) => line.currency))
  if (currencies.size !== 1) return null
  return [...currencies][0]
}
