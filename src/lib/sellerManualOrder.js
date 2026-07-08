export function flattenCatalogProducts(catalog) {
  if (!catalog?.categories?.length) return []

  const products = []
  for (const category of catalog.categories) {
    for (const product of category.products ?? []) {
      if (!product?.id || product.view_only || !product.is_available) continue
      products.push({
        ...product,
        category_name: category.name,
      })
    }
  }

  return products.sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

const PAYMENT_CURRENCIES = ['CUP', 'USD', 'EUR', 'MLC']

export function normalizeProductSearchQuery(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function productMatchesSearch(product, query) {
  const normalized = normalizeProductSearchQuery(query)
  if (!normalized) return true

  const name = String(product?.name ?? '').toLowerCase()
  const category = String(product?.category_name ?? '').toLowerCase()
  return name.includes(normalized) || category.includes(normalized)
}

export function filterProductsForManualOrder(
  products,
  query,
  { previewLimit = 12, searchLimit = 40 } = {},
) {
  const list = Array.isArray(products) ? products : []
  const normalized = normalizeProductSearchQuery(query)

  if (!normalized) {
    return list.slice(0, previewLimit)
  }

  return list.filter((product) => productMatchesSearch(product, normalized)).slice(0, searchLimit)
}

export function getProductSearchStatus(products, query, { previewLimit = 12 } = {}) {
  const list = Array.isArray(products) ? products : []
  const normalized = normalizeProductSearchQuery(query)

  if (list.length === 0) {
    return { type: 'empty', message: 'No hay productos disponibles para agregar.' }
  }

  if (!normalized) {
    if (list.length > previewLimit) {
      return {
        type: 'preview',
        message: `Mostrando ${previewLimit} de ${list.length}. Busca por nombre o categoría.`,
      }
    }
    return { type: 'idle', message: '' }
  }

  const totalMatches = list.filter((product) => productMatchesSearch(product, normalized)).length
  if (totalMatches === 0) {
    return { type: 'no-results', message: 'No encontramos productos con esa búsqueda.' }
  }

  return {
    type: 'results',
    message: `${totalMatches} coincidencia${totalMatches === 1 ? '' : 's'}`,
  }
}

export function createManualOrderLineItem(product, quantity = 1) {
  return {
    product_id: product.id,
    name: product.name,
    quantity: Math.min(99, Math.max(1, Number(quantity) || 1)),
    unit_price: Number(product.base_price),
    currency: product.base_currency,
    stock_quantity: product.stock_quantity ?? null,
  }
}

export function buildManualOrderPayload({
  lineItems,
  paymentCurrency = null,
  delivery = null,
}) {
  const items = (lineItems ?? []).map((item) => ({
    product_id: item.product_id,
    name: item.name,
    quantity: item.quantity,
    unit_price: Number(item.unit_price),
    currency: String(item.currency ?? '').toUpperCase(),
  }))

  const payload = { items }
  if (paymentCurrency) {
    payload.payment_currency = paymentCurrency
  }
  if (delivery) {
    payload.delivery = delivery
  }
  return payload
}

export function validateManualOrderDraft(lineItems, productsById = {}) {
  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    return 'Agrega al menos un producto al pedido.'
  }

  for (const item of lineItems) {
    if (!item.product_id || !item.name?.trim()) {
      return 'Hay un producto inválido en el pedido.'
    }
    if (!Number.isFinite(Number(item.unit_price)) || Number(item.unit_price) <= 0) {
      return `Indica un precio válido para «${item.name}».`
    }
    if (!PAYMENT_CURRENCIES.includes(String(item.currency ?? '').toUpperCase())) {
      return `La moneda de «${item.name}» no es válida.`
    }

    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return `La cantidad de «${item.name}» debe estar entre 1 y 99.`
    }

    const product = productsById[item.product_id]
    const stockLimit = product?.stock_quantity ?? item.stock_quantity
    if (stockLimit != null && quantity > stockLimit) {
      return `Stock insuficiente para «${item.name}».`
    }
  }

  return ''
}

export function inferManualOrderPaymentCurrency(lineItems) {
  const currencies = new Set(
    lineItems.map((item) => String(item.currency ?? '').toUpperCase()).filter(Boolean),
  )
  if (currencies.size === 1) {
    return [...currencies][0]
  }
  return ''
}

export { PAYMENT_CURRENCIES }
