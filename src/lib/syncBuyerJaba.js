import { getJabaItems, replaceJabaItems } from './buyerJaba'
import { getAdditionalMunicipalities } from './buyerLocation'
import { syncBuyerJaba } from '../buyer/api.js'

const ZONE_REMOVAL_REASONS = new Set(['out_of_zone', 'store_unavailable'])
let syncGeneration = 0

function jabaItemFromApiProduct(product, quantity, previousItem = null) {
  const next = {
    id: product.id,
    name: product.name,
    image_url: product.image_url,
    base_price: product.base_price,
    base_currency: product.base_currency,
    discount_percent: product.discount_percent ?? previousItem?.discount_percent ?? null,
    accepted_currencies: Array.isArray(product.accepted_currencies) ? product.accepted_currencies : [],
    offers_delivery: Boolean(product.offers_delivery),
    store_id: product.store?.id,
    store_name: product.store?.store_name,
    store_phone: product.store?.phone ?? null,
    quantity: Math.max(1, quantity ?? 1),
  }

  // Conservar precio/teléfono/atribución del gestor tras sync del catálogo del negocio.
  if (previousItem?.gestor_id) {
    next.base_price = previousItem.base_price
    next.store_phone = previousItem.store_phone ?? next.store_phone
    next.gestor_id = previousItem.gestor_id
    next.gestor_username = previousItem.gestor_username ?? null
  }

  return next
}

export async function syncJabaWithBackend(location, { signal } = {}) {
  const generation = ++syncGeneration
  const current = getJabaItems()
  if (!current.length) {
    return { items: [], removed: [] }
  }

  const response = await syncBuyerJaba({
    items: current.map((item) => ({
      product_id: item.id,
      name: item.name ?? 'Producto',
    })),
    provinceId: location?.province?.id ?? null,
    municipalityId: location?.municipality?.id ?? null,
    additionalMunicipalityIds: location?.province?.id
      ? getAdditionalMunicipalities(location.province.id)
      : [],
  })

  if (signal?.aborted || generation !== syncGeneration) {
    return { items: getJabaItems(), removed: [] }
  }

  const previousById = new Map(current.map((item) => [item.id, item]))
  const removed = (response.removed ?? []).filter((item) => ZONE_REMOVAL_REASONS.has(item.reason))
  const removedIds = new Set(removed.map((item) => item.product_id))
  const validById = new Map((response.valid ?? []).map((product) => [product.id, product]))
  const synced = getJabaItems().flatMap((item) => {
    if (!previousById.has(item.id)) return [item]
    if (removedIds.has(item.id)) return []
    const product = validById.get(item.id)
    if (!product) return [item]
    return [jabaItemFromApiProduct(product, item.quantity ?? 1, previousById.get(item.id))]
  })

  if (generation !== syncGeneration || signal?.aborted) {
    return { items: getJabaItems(), removed: [] }
  }

  replaceJabaItems(synced)

  return {
    items: synced,
    removed,
  }
}
