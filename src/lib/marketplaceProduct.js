export const STOCK_UNITS = [
  { value: 'kg', label: 'kg (kilogramos)' },
  { value: 'g', label: 'g (gramos)' },
  { value: 'lb', label: 'lb (libras)' },
  { value: 'oz', label: 'oz (onzas)' },
  { value: 'L', label: 'L (litros)' },
  { value: 'ml', label: 'ml (mililitros)' },
  { value: 'U', label: 'U (unidades)' },
]

const STOCK_UNIT_CODES = new Set(STOCK_UNITS.map((unit) => unit.value))

export function productStock(product) {
  const raw = product?.stock_quantity
  const parsed = raw == null || raw === '' ? 100 : Math.floor(Number(raw))
  const quantity = Number.isFinite(parsed) ? Math.max(0, parsed) : 100
  const unit = STOCK_UNIT_CODES.has(product?.stock_unit) ? product.stock_unit : 'U'
  return { quantity, unit }
}

export function productUnitAmount(product) {
  const unit = productStock(product).unit
  if (unit === 'U') return null
  const parsed = Number(String(product?.unit_amount ?? '').replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return Math.round(parsed * 1000) / 1000
}

export function formatMeasureAmount(amount) {
  const rounded = Math.round(Number(amount) * 1000) / 1000
  if (!Number.isFinite(rounded)) return ''
  return String(rounded)
}

export function productMeasureLabel(product) {
  const amount = productUnitAmount(product)
  if (amount == null) return null
  return `${formatMeasureAmount(amount)} ${productStock(product).unit}`
}

export function productStockLabel(product) {
  const stock = productStock(product)
  const measure = productMeasureLabel(product)
  if (measure) return `${stock.quantity} · ${measure}`
  return `${stock.quantity} ${stock.unit}`
}

export function isProductSoldOut(product) {
  if (product?.is_available === false) return true
  return productStock(product).quantity <= 0
}

export function isProductPurchasable(product) {
  return !product?.view_only && !isProductSoldOut(product)
}

export function getProductPickupDisplay(product) {
  if (!product) {
    return { requiresPickup: false, municipalityName: null, detailNotice: null }
  }

  if (product.pickup_required) {
    return {
      requiresPickup: true,
      municipalityName: product.pickup_municipality_name ?? null,
      detailNotice: product.pickup_notice ?? null,
    }
  }

  if (product.pickup_notice) {
    const match = product.pickup_notice.match(/Recoger en (.+)$/)
    return {
      requiresPickup: true,
      municipalityName: match?.[1]?.trim() ?? null,
      detailNotice: product.pickup_notice,
    }
  }

  return { requiresPickup: false, municipalityName: null, detailNotice: null }
}
