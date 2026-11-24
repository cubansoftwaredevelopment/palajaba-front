/** Helpers del panel del gestor (productos + márgenes). */

export function computeGestorDisplayPrice(basePrice, marginAmount) {
  const base = Math.max(0, Number(basePrice) || 0)
  const margin = Math.max(0, Number(marginAmount) || 0)
  return Math.round((base + margin) * 100) / 100
}

/**
 * Parsea margen desde input (acepta coma o punto).
 * @returns {number | null} null si vacío/inválido
 */
export function parseMarginAmount(value) {
  const raw = String(value ?? '')
    .trim()
    .replace(',', '.')
  if (!raw) return null
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return null
  const amount = Number(raw)
  if (!Number.isFinite(amount) || amount < 0) return null
  return Math.round(amount * 100) / 100
}

export function formatMarginInput(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return ''
  const n = Number(amount)
  if (Number.isInteger(n)) return String(n)
  return String(Math.round(n * 100) / 100)
}

/**
 * Estado editable a partir de allowed-products.
 * @returns {Array<{ product_id: string, name: string, base_price: number, base_currency: string, image_url: string, is_available: boolean, selected: boolean, marginInput: string }>}
 */
export function createGestorProductDrafts(products) {
  return (products ?? []).map((p) => ({
    product_id: String(p.product_id),
    name: p.name || 'Producto',
    base_price: Number(p.base_price) || 0,
    base_currency: p.base_currency || 'CUP',
    image_url: p.image_url || '',
    is_available: p.is_available !== false,
    selected: Boolean(p.selected),
    marginInput: p.margin_amount != null ? formatMarginInput(p.margin_amount) : '',
  }))
}

export function toggleGestorProductSelection(drafts, productId) {
  const id = String(productId)
  return drafts.map((item) => {
    if (item.product_id !== id) return item
    const selected = !item.selected
    return {
      ...item,
      selected,
      marginInput: selected && !item.marginInput ? '0' : item.marginInput,
    }
  })
}

export function areAllGestorProductsSelected(drafts) {
  const list = drafts ?? []
  return list.length > 0 && list.every((item) => item.selected)
}

/** Selecciona o deselecciona todos. Al seleccionar, rellena margen vacío con "0". */
export function setAllGestorProductsSelected(drafts, selected) {
  return (drafts ?? []).map((item) => ({
    ...item,
    selected: Boolean(selected),
    marginInput: selected && !item.marginInput ? '0' : item.marginInput,
  }))
}

export function updateGestorProductMargin(drafts, productId, marginInput) {
  const id = String(productId)
  return drafts.map((item) =>
    item.product_id === id ? { ...item, marginInput, selected: true } : item,
  )
}

/**
 * Aplica el mismo margen a todos los productos y los marca como seleccionados.
 * Conserva el string del input (validación al guardar).
 */
export function applyMarginToAllGestorProducts(drafts, marginInput) {
  const value = String(marginInput ?? '')
  return (drafts ?? []).map((item) => ({
    ...item,
    selected: true,
    marginInput: value,
  }))
}

/**
 * Aplica margen solo a los ya seleccionados (no cambia los no seleccionados).
 */
export function applyMarginToSelectedGestorProducts(drafts, marginInput) {
  const value = String(marginInput ?? '')
  return (drafts ?? []).map((item) =>
    item.selected ? { ...item, marginInput: value } : item,
  )
}

/**
 * @returns {{ ok: true, products: Array<{product_id: string, margin_amount: number}> } | { ok: false, message: string }}
 */
export function buildSelectedProductsPayload(drafts) {
  const products = []
  for (const item of drafts ?? []) {
    if (!item.selected) continue
    const margin = parseMarginAmount(item.marginInput === '' ? '0' : item.marginInput)
    if (margin == null) {
      return {
        ok: false,
        message: `Revisa el margen de «${item.name}». Usa un número mayor o igual a 0.`,
      }
    }
    products.push({
      product_id: item.product_id,
      margin_amount: margin,
    })
  }
  return { ok: true, products }
}

export function countSelectedGestorProducts(drafts) {
  return (drafts ?? []).filter((item) => item.selected).length
}

export function gestorProductsDirty(savedGestor, drafts) {
  const savedMap = new Map(
    (savedGestor?.selected_products ?? []).map((p) => [
      String(p.product_id),
      Number(p.margin_amount) || 0,
    ]),
  )
  const selected = (drafts ?? []).filter((d) => d.selected)
  if (selected.length !== savedMap.size) return true
  for (const item of selected) {
    const margin = parseMarginAmount(item.marginInput === '' ? '0' : item.marginInput)
    if (margin == null) return true
    if (!savedMap.has(item.product_id)) return true
    if (savedMap.get(item.product_id) !== margin) return true
  }
  return false
}
