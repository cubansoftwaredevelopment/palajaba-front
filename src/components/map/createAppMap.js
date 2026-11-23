import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { addSellerMapTiles, SELLER_MAP_DEFAULT_CENTER, SELLER_MAP_DEFAULT_ZOOM } from '../../lib/sellerMap'

/** Una sola forma de abrir Leaflet en la app: teselas, centro y gestos. */
export function createAppMap(node, options = {}) {
  const {
    center = SELLER_MAP_DEFAULT_CENTER,
    zoom = SELLER_MAP_DEFAULT_ZOOM,
    interactive = true,
    zoomControl = interactive,
    attributionControl = false,
    scrollWheelZoom = interactive,
    doubleClickZoom = interactive,
    dragging = interactive,
    touchZoom = interactive,
    boxZoom = interactive,
    keyboard = interactive,
  } = options
  const view = Array.isArray(center) ? center : [center.lat, center.lng]
  const map = L.map(node, {
    zoomControl,
    attributionControl,
    scrollWheelZoom,
    doubleClickZoom,
    dragging,
    touchZoom,
    boxZoom,
    keyboard,
  }).setView(view, zoom)
  addSellerMapTiles(map)
  return map
}
