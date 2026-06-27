export const PRODUCT_SORT_MODES = [
  {
    id: 'popularity',
    label: 'Popularidad',
    description: 'Los más vistos y pedidos primero. Es el orden que ven tus clientes hoy.',
  },
  {
    id: 'price',
    label: 'Precio',
    description: 'Del precio más bajo al más alto, comparando monedas con la tasa actual (equivalente en CUP).',
  },
  {
    id: 'alphabetical',
    label: 'Alfabético',
    description: 'Por nombre de producto, de la A a la Z.',
  },
  {
    id: 'manual',
    label: 'Manual',
    description: 'Tú defines el orden arrastrando productos.',
  },
]

export function getProductSortModeLabel(mode) {
  return PRODUCT_SORT_MODES.find((entry) => entry.id === mode)?.label ?? 'Popularidad'
}

export function convertAmountToCup(amount, fromCurrency, cupPerUnit) {
  if (fromCurrency === 'CUP') return amount
  const fromRate = cupPerUnit[fromCurrency]
  if (!fromRate) return amount
  return Math.round(amount * fromRate)
}

export function productPriceInCup(product, cupPerUnit) {
  const amount = Number(product.base_price)
  const currency = product.base_currency || 'CUP'
  return convertAmountToCup(amount, currency, cupPerUnit)
}

function compareProductNames(a, b) {
  return String(a.name ?? '').localeCompare(String(b.name ?? ''), 'es', { sensitivity: 'base' })
}

export function sortProductsForPreview(products, mode, cupPerUnit) {
  const items = [...(products ?? [])]
  if (mode === 'price') {
    return items.sort(
      (a, b) =>
        productPriceInCup(a, cupPerUnit) - productPriceInCup(b, cupPerUnit)
        || compareProductNames(a, b),
    )
  }
  if (mode === 'alphabetical') {
    return items.sort((a, b) => compareProductNames(a, b))
  }
  if (mode === 'manual') {
    return items.sort(
      (a, b) =>
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
        || compareProductNames(a, b),
    )
  }
  return items.sort(
    (a, b) =>
      Number(b.popularity ?? 0) - Number(a.popularity ?? 0)
      || Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
      || compareProductNames(a, b),
  )
}
