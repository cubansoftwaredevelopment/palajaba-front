import { getMunicipalityById, getProvinceById } from '../constants/cubaLocations'

const STORAGE_KEY = 'pala-jaba-buyer-location'
const ADDITIONAL_MUNICIPALITIES_KEY = 'pala-jaba-buyer-additional-municipalities'

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
