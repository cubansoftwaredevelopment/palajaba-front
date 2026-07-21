/** Cache en memoria de teléfonos de checkout por tienda (catálogo del negocio). */

const phonesByStoreId = new Map()

/**
 * @param {string} storeId
 * @param {Array<{ key: string, kind: string, label: string, phone: string, username?: string | null }>} phones
 */
export function setStoreCheckoutPhones(storeId, phones) {
  const id = String(storeId ?? '').trim()
  if (!id) return
  const list = Array.isArray(phones)
    ? phones.filter((item) => item?.phone && item?.key)
    : []
  if (!list.length) {
    phonesByStoreId.delete(id)
    return
  }
  phonesByStoreId.set(id, list)
}

/**
 * @param {string} storeId
 * @returns {Array<{ key: string, kind: string, label: string, phone: string, username?: string | null }> | null}
 */
export function getStoreCheckoutPhones(storeId) {
  const id = String(storeId ?? '').trim()
  if (!id) return null
  return phonesByStoreId.get(id) ?? null
}

export function clearStoreCheckoutPhones(storeId) {
  const id = String(storeId ?? '').trim()
  if (!id) return
  phonesByStoreId.delete(id)
}

/** @internal tests */
export function _resetStoreCheckoutPhonesForTests() {
  phonesByStoreId.clear()
}
