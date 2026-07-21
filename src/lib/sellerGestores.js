/** Helpers del panel de Gestores de Venta (vendedor). */

const USERNAME_PATTERN = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/

export function normalizeGestorUsername(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

/**
 * @returns {{ ok: true, username: string } | { ok: false, message: string }}
 */
export function validateGestorUsername(value) {
  const username = normalizeGestorUsername(value)
  if (username.length < 2 || username.length > 32) {
    return { ok: false, message: 'El usuario debe tener entre 2 y 32 caracteres.' }
  }
  if (!USERNAME_PATTERN.test(username)) {
    return {
      ok: false,
      message:
        'Solo letras minúsculas, números, guiones y guiones bajos (sin empezar ni terminar con guion).',
    }
  }
  return { ok: true, username }
}

export function gestorSetupStatus(gestor) {
  if (!gestor) return { label: '—', pending: true }
  if (gestor.has_password) {
    return { label: 'Activo', pending: false }
  }
  return { label: 'Pendiente de registro', pending: true }
}

/**
 * Construye el body PUT /gestores/catalog-access.
 * @param {'all' | 'selected'} mode
 * @param {string[]} productIds
 */
export function buildCatalogAccessPayload(mode, productIds = []) {
  if (mode === 'all') {
    return { mode: 'all', product_ids: [] }
  }
  const seen = new Set()
  const product_ids = []
  for (const id of productIds) {
    const productId = String(id ?? '').trim()
    if (!productId || seen.has(productId)) continue
    seen.add(productId)
    product_ids.push(productId)
  }
  return { mode: 'selected', product_ids }
}

export function toggleProductId(selectedIds, productId) {
  const id = String(productId)
  const set = new Set(selectedIds.map(String))
  if (set.has(id)) set.delete(id)
  else set.add(id)
  return [...set]
}

export function selectAllProductIds(products) {
  return (products ?? []).map((p) => String(p.product_id ?? p.id)).filter(Boolean)
}

export function areAllProductsSelected(products, selectedIds) {
  const list = products ?? []
  if (list.length === 0) return false
  const selected = new Set((selectedIds ?? []).map(String))
  return list.every((p) => selected.has(String(p.product_id ?? p.id)))
}

/** Deriva mode + ids seleccionados desde la respuesta de network-products + catalog-access. */
export function deriveSelectionFromAccess(access, networkProducts) {
  const mode = access?.mode === 'all' ? 'all' : 'selected'
  if (mode === 'all') {
    return {
      mode: 'all',
      selectedIds: selectAllProductIds(networkProducts),
    }
  }
  const fromAccess = Array.isArray(access?.product_ids) ? access.product_ids.map(String) : []
  if (fromAccess.length > 0) {
    return { mode: 'selected', selectedIds: fromAccess }
  }
  const fromFlags = (networkProducts ?? [])
    .filter((p) => p.selected)
    .map((p) => String(p.product_id))
  return { mode: 'selected', selectedIds: fromFlags }
}

export function catalogAccessDirty(saved, draft) {
  if (!saved || !draft) return false
  if (saved.mode !== draft.mode) return true
  if (draft.mode === 'all') return false
  const a = [...(saved.product_ids ?? [])].map(String).sort()
  const b = [...(draft.product_ids ?? [])].map(String).sort()
  if (a.length !== b.length) return true
  return a.some((id, i) => id !== b[i])
}

/** Gestor listo para habilitar su teléfono en ventas de la tienda. */
export function gestorEligibleForCheckoutPhone(gestor) {
  return Boolean(gestor?.has_password && gestor?.phone)
}

export function buildCheckoutPhonesPayload(gestorIds = [], includeStorePhone = true) {
  const seen = new Set()
  const gestor_ids = []
  for (const id of gestorIds) {
    const gestorId = String(id ?? '').trim()
    if (!gestorId || seen.has(gestorId)) continue
    seen.add(gestorId)
    gestor_ids.push(gestorId)
  }
  return {
    gestor_ids,
    include_store_phone: Boolean(includeStorePhone),
  }
}

export function checkoutPhonesDirty(saved, draft) {
  const savedIds = [...(saved?.gestor_ids ?? [])].map(String).sort()
  const draftIds = [...(draft?.gestor_ids ?? [])].map(String).sort()
  if (savedIds.length !== draftIds.length) return true
  if (savedIds.some((id, index) => id !== draftIds[index])) return true
  const savedInclude = saved?.include_store_phone !== false
  const draftInclude = draft?.include_store_phone !== false
  return savedInclude !== draftInclude
}

export function toggleGestorCheckoutId(selectedIds, gestorId) {
  return toggleProductId(selectedIds, gestorId)
}

/** Valida que quede al menos un teléfono (negocio o gestor). */
export function validateCheckoutPhonesSelection(gestorIds = [], includeStorePhone = true) {
  if (includeStorePhone) return { ok: true }
  if ((gestorIds ?? []).some((id) => String(id ?? '').trim())) {
    return { ok: true }
  }
  return {
    ok: false,
    message: 'Debes dejar al menos un teléfono disponible: el del negocio o uno de tus gestores.',
  }
}
