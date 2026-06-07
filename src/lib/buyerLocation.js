const STORAGE_KEY = 'pala-jaba-buyer-location'

export function getBuyerLocation() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setBuyerProvince(province) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      province,
      municipality: null,
    }),
  )
}

export function setBuyerMunicipality(municipality) {
  const current = getBuyerLocation()
  if (!current?.province) return

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...current,
      municipality,
    }),
  )
}

export function clearBuyerLocation() {
  localStorage.removeItem(STORAGE_KEY)
}

export function hasCompleteBuyerLocation() {
  const location = getBuyerLocation()
  return Boolean(location?.province?.id && location?.municipality?.id)
}
