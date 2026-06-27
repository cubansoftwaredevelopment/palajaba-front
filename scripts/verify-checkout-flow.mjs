/**
 * Verifica que el bundle de producción NO contenga el flujo viejo
 * (WhatsApp primero, pedido en segundo plano).
 *
 * Uso (desde frontend/):
 *   npm run build
 *   npm run verify:checkout-flow
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distAssets = join(__dirname, '..', 'dist', 'assets')

function readMainBundle() {
  const files = readdirSync(distAssets).filter((name) => name.startsWith('index-') && name.endsWith('.js'))
  if (!files.length) {
    throw new Error('No se encontró dist/assets/index-*.js. Ejecuta npm run build primero.')
  }
  return readFileSync(join(distAssets, files[0]), 'utf8')
}

const LEGACY_MARKERS = [
  'No se pudo registrar el pedido en Pa',
  '.catch(e=>{console.error(`No se pudo registrar',
]

const REQUIRED_MARKERS = [
  'No pudimos registrar tu pedido',
  'Registrando pedido',
]

function main() {
  const bundle = readMainBundle()

  for (const marker of LEGACY_MARKERS) {
    if (bundle.includes(marker)) {
      console.error(`FALLO: el bundle aún contiene el flujo viejo (${marker})`)
      process.exit(1)
    }
  }

  for (const marker of REQUIRED_MARKERS) {
    if (!bundle.includes(marker)) {
      console.error(`FALLO: falta el marcador del flujo nuevo (${marker})`)
      process.exit(1)
    }
  }

  const orderApiIndex = bundle.indexOf('/api/marketplace/orders')
  const whatsappIndex = bundle.indexOf('wa.me')
  if (orderApiIndex < 0 || whatsappIndex < 0) {
    console.error('FALLO: no se encontraron rutas de pedido o WhatsApp en el bundle')
    process.exit(1)
  }

  console.log('OK: bundle de checkout usa el flujo guardar-pedido → WhatsApp')
}

main()
