import L from 'leaflet'

export const SELLER_MAP_DEFAULT_CENTER = [23.1136, -82.3666]
export const SELLER_MAP_DEFAULT_ZOOM = 13
export const SELLER_MAP_PREVIEW_ZOOM = 15
export const SELLER_MAP_LOCATION_ZOOM = 16

const SELLER_MAP_PIN_HTML = `
  <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style="display:block">
    <path
      d="M18 0C10.82 0 5 5.82 5 13c0 9.75 13 35 13 35s13-25.25 13-35C31 5.82 25.18 0 18 0z"
      fill="#59802c"
      stroke="#fdfbf2"
      stroke-width="2"
    />
    <circle cx="18" cy="13" r="5.5" fill="#fdfbf2" />
  </svg>
`

export const sellerMapMarkerIcon = L.divIcon({
  className: 'seller-map-pin',
  html: SELLER_MAP_PIN_HTML,
  iconSize: [36, 48],
  iconAnchor: [18, 48],
})

export function addSellerMapTiles(map) {
  return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  }).addTo(map)
}

export function getCurrentMapPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Tu navegador no soporta geolocalización.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? 'Activa el permiso de ubicación para centrar el mapa.'
            : 'No se pudo obtener tu ubicación.'
        reject(new Error(message))
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    )
  })
}
