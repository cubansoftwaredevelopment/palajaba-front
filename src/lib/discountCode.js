export function applyPercentDiscount(amount, percentOff) {
  if (amount == null || Number.isNaN(Number(amount))) return null
  const base = Number(amount)
  const percent = Number(percentOff)
  if (!Number.isFinite(base) || base <= 0) return 0
  if (!Number.isFinite(percent) || percent <= 0) return base
  if (percent >= 100) return 0
  return Math.max(0, Math.floor((base * (100 - percent)) / 100))
}

export function getDiscountedPlanPrice(price, percentOff) {
  if (!price || percentOff == null || percentOff <= 0) {
    return price
  }

  if (price.amount != null) {
    return {
      ...price,
      originalAmount: price.amount,
      amount: applyPercentDiscount(price.amount, percentOff),
    }
  }

  return {
    ...price,
    originalAmountUsd: price.amountUsd,
    amountUsd: applyPercentDiscount(price.amountUsd, percentOff),
  }
}
