/**
 * Verifica optimización de URLs Cloudinary en el frontend.
 *
 * Uso (desde frontend/):
 *   node scripts/verify-media-urls.mjs
 */
import { optimizeCloudinaryUrl } from '../src/lib/mediaCloudinary.js'

const SAMPLE_URL =
  'https://res.cloudinary.com/demo/image/upload/v1710000000/pala-jaba/products/item.jpg'

const ALREADY_OPTIMIZED =
  'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1710000000/pala-jaba/products/item.jpg'

const LOCAL_PATH = '/uploads/products/local.jpg'

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    console.error(`FAIL: ${message}`)
    console.error(`  esperado: ${expected}`)
    console.error(`  recibido: ${actual}`)
    process.exit(1)
  }
}

function assertIncludes(value, needle, message) {
  if (!value.includes(needle)) {
    console.error(`FAIL: ${message}`)
    console.error(`  valor: ${value}`)
    process.exit(1)
  }
}

// Añade f_auto,q_auto a URLs sin transformar
const optimized = optimizeCloudinaryUrl(SAMPLE_URL)
assertIncludes(
  optimized,
  '/upload/f_auto,q_auto/v1710000000/pala-jaba/products/item.jpg',
  'debe insertar f_auto,q_auto tras /upload/',
)

// No duplica transformaciones
assertEqual(
  optimizeCloudinaryUrl(ALREADY_OPTIMIZED),
  ALREADY_OPTIMIZED,
  'no debe modificar URLs ya optimizadas',
)

// Respeta width opcional
const withWidth = optimizeCloudinaryUrl(SAMPLE_URL, { width: 640 })
assertIncludes(withWidth, 'w_640', 'debe aceptar ancho de entrega')
assertIncludes(withWidth, 'c_limit', 'debe limitar ancho con c_limit')

// No toca rutas locales
assertEqual(optimizeCloudinaryUrl(LOCAL_PATH), LOCAL_PATH, 'rutas locales intactas')
assertEqual(optimizeCloudinaryUrl(null), null, 'null intacto')

console.log('OK: optimización de URLs Cloudinary (frontend)')
