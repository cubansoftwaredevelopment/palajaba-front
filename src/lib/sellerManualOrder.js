import { productStock } from './marketplaceProduct.js'
import { productSaleAmount } from './productDiscount.js'

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

const PAYMENT_CURRENCIES = ['CUP', 'USD', 'EUR', 'MLC', 'QUSD']

export function getProductSearchStatus({
  query = '',
  total = 0,
  shown = 0,
  hasOrderedProducts = false,
} = {}) {
  if (!hasOrderedProducts) {
    // El aviso con CTA al catálogo vive en el modal; aquí no duplicamos texto.
    return { type: 'empty-catalog', message: '' }
  }

  const normalized = String(query ?? '').trim()
  if (!normalized) {
    if (total === 0) {
      return { type: 'empty', message: 'No hay productos disponibles para agregar.' }
    }
    if (total > shown) {
      return {
        type: 'preview',
        message: `Mostrando ${shown} de ${total}. Busca por nombre o categoría.`,
      }
    }
    return { type: 'idle', message: '' }
  }

  if (total === 0) {
    return { type: 'no-results', message: 'No encontramos productos con esa búsqueda.' }
  }

  return {
    type: 'results',
    message: `${total} coincidencia${total === 1 ? '' : 's'}`,
  }
}

export function createManualOrderLineItem(product, quantity = 1) {
  const stock = productStock(product)
  const requested = Math.max(1, Number(quantity) || 1)
  return {
    product_id: product.id,
    name: product.name,
    quantity: Math.min(stock.quantity || 1, requested),
    unit_price: productSaleAmount(product),
    currency: product.base_currency,
    stock_quantity: stock.quantity,
    stock_unit: stock.unit,
    unit_amount: product.unit_amount ?? null,
  }
}

export function buildManualOrderPayload({
  lineItems,
  delivery = null,
  deliveryPrice = null,
  deliveryCurrency = null,
  soldAt = null,
}) {
  const items = (lineItems ?? []).map((item) => ({
    product_id: item.product_id,
    name: item.name,
    quantity: item.quantity,
    unit_price: Number(item.unit_price),
    currency: String(item.currency ?? '').toUpperCase(),
  }))

  const payload = { items }
  if (delivery) {
    payload.delivery = delivery
    payload.delivery_price = Number(deliveryPrice)
    payload.delivery_currency = deliveryCurrency
  }
  if (soldAt) {
    payload.sold_at = soldAt
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
    const product = productsById[item.product_id]
    const stockLimit = product ? productStock(product).quantity : (item.stock_quantity ?? 100)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > stockLimit) {
      return stockLimit < 1
        ? `«${item.name}» está agotado.`
        : `Stock insuficiente para «${item.name}». Quedan ${stockLimit}.`
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
