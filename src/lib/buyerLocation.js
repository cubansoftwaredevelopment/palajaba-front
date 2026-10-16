import { getMunicipalityById, getProvinceById } from '../constants/cubaLocations'

const STORAGE_KEY = 'pala-jaba-buyer-location'
const ADDITIONAL_MUNICIPALITIES_KEY = 'pala-jaba-buyer-additional-municipalities'
const MARKETPLACE_CATEGORY_FILTER_KEY = 'pala-jaba-buyer-marketplace-category-filter'

let persistBuyerPrefs = true

/** La vista previa del admin no debe reescribir la ubicación real del navegador. */
export function disableBuyerLocationPersistence() {
  persistBuyerPrefs = false
}

function normalizeStoredLocation(raw) {
  if (!raw?.province?.id) return null

  const province = getProvinceById(raw.province.id)
  if (!province) return null

  const provincePayload = {
    id: province.id,
    name: province.name,
  }

  if (!raw.municipality?.id) {
    return { province: provincePayload, municipality: null }
  }

  const municipality = getMunicipalityById(province.id, raw.municipality.id)
  if (!municipality) {
    return { province: provincePayload, municipality: null }
  }

  return {
    province: provincePayload,
    municipality: {
      id: municipality.id,
      name: municipality.name,
    },
  }
}

function persistBuyerLocation(province, municipality = null) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      province: {
        id: province.id,
        name: province.name,
      },
      municipality: municipality
        ? {
            id: municipality.id,
            name: municipality.name,
          }
        : null,
    }),
  )
}

export function getBuyerLocation() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return normalizeStoredLocation(JSON.parse(raw))
  } catch {
    return null
  }
}

export function setBuyerProvince(province) {
  persistBuyerLocation(province, null)
}

export function setBuyerLocation(province, municipality) {
  if (!persistBuyerPrefs || !province?.id || !municipality?.id) return false
  const resolvedProvince = getProvinceById(province.id)
  const resolvedMunicipality = getMunicipalityById(province.id, municipality.id)
  if (!resolvedProvince || !resolvedMunicipality) return false
  persistBuyerLocation(
    { id: resolvedProvince.id, name: resolvedProvince.name },
    { id: resolvedMunicipality.id, name: resolvedMunicipality.name },
  )
  return true
}

export function readSharedZoneFromSearch(search = '') {
  const params = new URLSearchParams(search)
  const province = getProvinceById(params.get('provincia'))
  const municipality = getMunicipalityById(params.get('provincia'), params.get('municipio'))
  if (!province || !municipality) return null
  return {
    province: { id: province.id, name: province.name },
    municipality: { id: municipality.id, name: municipality.name },
  }
}

export function applySharedZoneFromSearch(search = '') {
  const zone = readSharedZoneFromSearch(search)
  if (!zone) return null
  setBuyerLocation(zone.province, zone.municipality)
  return zone
}

export function setBuyerMunicipality(municipality) {
  const current = getBuyerLocation()
  if (!current?.province) return

  persistBuyerLocation(current.province, municipality)
}

export function clearBuyerLocation() {
  localStorage.removeItem(STORAGE_KEY)
}

export function hasCompleteBuyerLocation() {
  const location = getBuyerLocation()
  return Boolean(location?.province?.id && location?.municipality?.id)
}

/** Ruta inicial al entrar a comprar según lo guardado en localStorage. */
export function resolveBuyerEntryPath() {
  const location = getBuyerLocation()
  if (location?.province?.id && location?.municipality?.id) return '/comprar'
  if (location?.province?.id) return '/comprar/municipio'
  return '/comprar/provincia'
}

function readAdditionalMunicipalitiesStore() {
  const raw = localStorage.getItem(ADDITIONAL_MUNICIPALITIES_KEY)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function getAdditionalMunicipalities(provinceId) {
  if (!provinceId) return []

  const store = readAdditionalMunicipalitiesStore()
  const ids = store[provinceId]
  if (!Array.isArray(ids)) return []

  return ids.filter((id) => typeof id === 'string' && id.trim()).map((id) => id.trim())
}

export function setAdditionalMunicipalities(provinceId, municipalityIds) {
  if (!provinceId) return
  if (!persistBuyerPrefs || !provinceId) return
  const store = readAdditionalMunicipalitiesStore()
  const normalized = [...new Set(
    (municipalityIds ?? [])
      .filter((id) => typeof id === 'string' && id.trim())
      .map((id) => id.trim()),
  )]

  if (normalized.length === 0) {
    delete store[provinceId]
  } else {
    store[provinceId] = normalized
  }

  if (Object.keys(store).length === 0) {
    localStorage.removeItem(ADDITIONAL_MUNICIPALITIES_KEY)
    return
  }

  localStorage.setItem(ADDITIONAL_MUNICIPALITIES_KEY, JSON.stringify(store))
}

function readMarketplaceCategoryFilterStore() {
  const raw = localStorage.getItem(MARKETPLACE_CATEGORY_FILTER_KEY)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** Categoría compartida entre marketplace y negocios (por provincia). */
export function getMarketplaceCategoryFilter(provinceId) {
  if (!provinceId) return ''

  const store = readMarketplaceCategoryFilterStore()
  const categoryId = store[provinceId]
  return typeof categoryId === 'string' ? categoryId : ''
}

export function setMarketplaceCategoryFilter(provinceId, categoryId) {
  if (!provinceId) return
  if (!persistBuyerPrefs || !provinceId) return
  const store = readMarketplaceCategoryFilterStore()
  const normalized = typeof categoryId === 'string' ? categoryId.trim() : ''

  if (!normalized) {
    delete store[provinceId]
  } else {
    store[provinceId] = normalized
  }

  if (Object.keys(store).length === 0) {
    localStorage.removeItem(MARKETPLACE_CATEGORY_FILTER_KEY)
    return
  }

  localStorage.setItem(MARKETPLACE_CATEGORY_FILTER_KEY, JSON.stringify(store))
}
