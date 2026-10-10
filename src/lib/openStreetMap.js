export function buildOpenStreetMapUrl(latitude, longitude) {
  if (latitude == null || longitude == null || latitude === '' || longitude === '') return null
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  const latText = lat.toFixed(6)
  const lngText = lng.toFixed(6)
  return `https://www.openstreetmap.org/?mlat=${latText}&mlon=${lngText}#map=17/${latText}/${lngText}`
}
