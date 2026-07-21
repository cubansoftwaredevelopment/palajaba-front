const STORAGE_KEY = 'pala-jaba-buyer-jaba'
export const JABA_CHANGE_EVENT = 'buyer-jaba-change'

function readJaba() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeJaba(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent(JABA_CHANGE_EVENT, { detail: items }))
}

export function getJabaItems() {
  return readJaba()
}

export function getJabaCount() {
  return readJaba().reduce((total, item) => total + (item.quantity ?? 1), 0)
}

export function isInJaba(productId) {
  return readJaba().some((item) => item.id === productId)
}

export function resolveStorePhone(items = []) {
  for (const item of items) {
    if (item?.store_phone) return item.store_phone
  }
  return null
}

export function groupJabaByStore(items = readJaba()) {
  const groups = new Map()

  for (const item of items) {
    const storeId = item.store_id ?? 'unknown'
    const existing = groups.get(storeId)
    if (existing) {
      existing.items.push(item)
      existing.itemCount += item.quantity ?? 1
      if (!existing.store_phone && item.store_phone) {
        existing.store_phone = item.store_phone
      }
    } else {
      groups.set(storeId, {
        store_id: storeId,
        store_name: item.store_name ?? 'Tienda',
        store_phone: item.store_phone ?? null,
        items: [item],
        itemCount: item.quantity ?? 1,
      })
    }
  }

  for (const group of groups.values()) {
    if (!group.store_phone) {
      group.store_phone = resolveStorePhone(group.items)
    }
  }

  return Array.from(groups.values())
}

export function updateJabaStoreContact(storeId, phone, storeName = null) {
  if (!storeId || !phone) return getJabaCount()

  const items = readJaba()
  let changed = false

  for (const item of items) {
    if (item.store_id !== storeId) continue
    if (item.store_phone !== phone) {
      item.store_phone = phone
      changed = true
    }
    if (storeName && item.store_name !== storeName) {
      item.store_name = storeName
      changed = true
    }
  }

  if (changed) writeJaba(items)
  return getJabaCount()
}

export function getJabaStoreIdsMissingPhone(items = readJaba()) {
  const missing = new Set()
  for (const item of items) {
    if (item.store_id && !item.store_phone) {
      missing.add(item.store_id)
    }
  }
  return Array.from(missing)
}

export function allItemsOfferDelivery(items = []) {
  if (!items.length) return false
  return items.every((item) => item.offers_delivery === true)
}

function normalizeProduct(product) {
  const hasGestor = Boolean(product?.gestor_id)
  return {
    id: product.id,
    name: product.name,
    image_url: product.image_url,
    base_price: product.base_price,
    base_currency: product.base_currency,
    accepted_currencies: Array.isArray(product.accepted_currencies) ? product.accepted_currencies : [],
    offers_delivery: Boolean(product.offers_delivery),
    store_id: product.store?.id,
    store_name: product.store?.store_name,
    store_phone: product.store?.phone ?? null,
    gestor_id: hasGestor ? product.gestor_id : null,
    gestor_username: hasGestor ? product.gestor_username ?? null : null,
    quantity: 1,
  }
}

/** Checkout directo desde «Comprar»: solo este producto, sin usar el resto de la jaba. */
export function buildDirectBuyCheckoutPayload(product) {
  if (product?.is_available === false) return null

  const storeId = product.store?.id
  if (!storeId) return null

  const item = normalizeProduct(product)

  return {
    storeId,
    storeName: product.store?.store_name ?? item.store_name ?? 'Tienda',
    storePhone: product.store?.phone ?? item.store_phone ?? null,
    gestorId: item.gestor_id ?? null,
    gestorUsername: item.gestor_username ?? null,
    items: [item],
  }
}

export function addToJaba(product) {
  if (product?.is_available === false) return getJabaCount()

  const items = readJaba()
  const existing = items.find((item) => item.id === product.id)
  const hasGestor = Boolean(product?.gestor_id)

  if (existing) {
    existing.quantity = (existing.quantity ?? 1) + 1
    if (product.store?.phone) existing.store_phone = product.store.phone
    if (product.store?.store_name) existing.store_name = product.store.store_name
    if (product.offers_delivery != null) existing.offers_delivery = Boolean(product.offers_delivery)
    if (Array.isArray(product.accepted_currencies)) {
      existing.accepted_currencies = product.accepted_currencies
    }
    if (product.base_price != null) existing.base_price = product.base_price
    if (product.base_currency) existing.base_currency = product.base_currency
    // Marketplace / tienda del negocio: limpia atribución de gestor.
    existing.gestor_id = hasGestor ? product.gestor_id : null
    existing.gestor_username = hasGestor ? product.gestor_username ?? null : null
  } else {
    items.push(normalizeProduct(product))
  }

  writeJaba(items)
  return getJabaCount()
}

export function removeFromJaba(productId) {
  const items = readJaba().filter((item) => item.id !== productId)
  writeJaba(items)
  return getJabaCount()
}

export function setJabaItemQuantity(productId, quantity) {
  const items = readJaba()
  const nextQuantity = Math.max(0, Math.floor(Number(quantity) || 0))

  if (nextQuantity === 0) {
    writeJaba(items.filter((item) => item.id !== productId))
    return getJabaCount()
  }

  const item = items.find((entry) => entry.id === productId)
  if (!item) return getJabaCount()

  item.quantity = nextQuantity
  writeJaba(items)
  return getJabaCount()
}

export function clearJabaStore(storeId) {
  const items = readJaba().filter((item) => item.store_id !== storeId)
  writeJaba(items)
  return getJabaCount()
}

export function clearJaba() {
  writeJaba([])
  return 0
}

export function replaceJabaItems(items) {
  writeJaba(Array.isArray(items) ? items : [])
  return getJabaCount()
}

export function getJabaStoreItems(storeId) {
  return readJaba().filter((item) => item.store_id === storeId)
}
