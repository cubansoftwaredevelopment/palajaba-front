import { getJabaItems, replaceJabaItems } from './buyerJaba'
import { getAdditionalMunicipalities } from './buyerLocation'
import { syncBuyerJaba } from './api'

function jabaItemFromApiProduct(product, quantity) {
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
    quantity: Math.max(1, quantity ?? 1),
  }
}

export async function syncJabaWithBackend(location) {
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

  const quantities = new Map(current.map((item) => [item.id, item.quantity ?? 1]))
  const synced = (response.valid ?? []).map((product) =>
    jabaItemFromApiProduct(product, quantities.get(product.id) ?? 1),
  )

  replaceJabaItems(synced)

  return {
    items: synced,
    removed: response.removed ?? [],
  }
}
