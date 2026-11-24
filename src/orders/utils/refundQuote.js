function cents(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 0
  return Math.round(number * 100)
}

function fromCents(value) {
  return Math.round(value) / 100
}

export function quoteRefund({ items, quantities, refundDelivery, productsUsd, deliveryUsd, feeUsd, invoiceUsd }) {
  const lines = Array.isArray(items) ? items : []
  let original = 0
  let removed = 0
  let keptCount = 0
  lines.forEach((item) => {
    const oldQty = Number(item.quantity) || 0
    const nextQty = Math.min(oldQty, Math.max(0, Number(quantities?.[item.product_id] ?? oldQty) || 0))
    const line = cents(item.line_total ?? (Number(item.unit_price) || 0) * oldQty)
    original += line
    if (oldQty > 0 && nextQty < oldQty) removed += Math.round((line * (oldQty - nextQty)) / oldQty)
    if (nextQty > 0) keptCount += 1
  })
  const products = cents(productsUsd)
  const delivery = cents(deliveryUsd)
  const fee = cents(feeUsd)
  const invoice = cents(invoiceUsd) || products + delivery + fee
  const removedProducts = original > 0 ? Math.min(products, Math.round((products * removed) / original)) : 0
  const giveDelivery = Boolean(refundDelivery) && delivery > 0
  const portion = removedProducts + (giveDelivery ? delivery : 0)
  const base = products + delivery
  const feePart = base > 0 ? Math.min(fee, Math.round((fee * portion) / base)) : 0
  const nothingLeft = keptCount === 0 && (giveDelivery || delivery === 0)
  let buyer = nothingLeft ? invoice : Math.min(invoice, portion + feePart)
  return {
    buyerUsd: fromCents(buyer),
    changed: portion > 0,
    nothingLeft,
  }
}
