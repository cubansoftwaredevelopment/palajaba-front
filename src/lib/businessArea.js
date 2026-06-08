import { getMunicipalityById, getProvinceById } from '../constants/cubaLocations'

export const MAX_DELIVERY_AREAS = 30

export function areaKey(area) {
  if (!area) return ''
  return `${area.province_id}:${area.municipality_id}`
}

export function formatAreaLabel(area) {
  if (!area) return ''
  return `${area.municipality_name}, ${area.province_name}`
}

export function buildBusinessArea(provinceId, municipalityId) {
  const province = getProvinceById(provinceId)
  const municipality = getMunicipalityById(provinceId, municipalityId)
  if (!province || !municipality) return null

  return {
    province_id: province.id,
    province_name: province.name,
    municipality_id: municipality.id,
    municipality_name: municipality.name,
  }
}

export function buildAllMunicipalityAreasForProvince(provinceId) {
  const province = getProvinceById(provinceId)
  if (!province) return []

  return province.municipalities
    .map((municipality) => buildBusinessArea(provinceId, municipality.id))
    .filter(Boolean)
}

export function dedupeDeliveryAreas(areas = [], businessArea = null) {
  const seen = new Set(businessArea ? [areaKey(businessArea)] : [])

  return areas.filter((area) => {
    const key = areaKey(area)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function sameBusinessArea(a, b) {
  return areaKey(a) === areaKey(b)
}

export function sameDeliveryAreas(a = [], b = []) {
  const left = [...a].map(areaKey).sort()
  const right = [...b].map(areaKey).sort()
  return left.length === right.length && left.every((key, index) => key === right[index])
}
