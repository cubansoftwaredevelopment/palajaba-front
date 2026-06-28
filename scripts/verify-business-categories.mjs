/**
 * Verifica que el backend expone las categorías de negocio que el frontend espera.
 *
 * Requiere API en marcha (misma URL que Vite: VITE_API_URL o :8081).
 *
 * Uso (desde frontend/):
 *   node scripts/verify-business-categories.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const frontendRoot = join(__dirname, '..')

function loadEnvApiUrl() {
  for (const file of ['.env', '.env.local.dev']) {
    try {
      const raw = readFileSync(join(frontendRoot, file), 'utf8')
      const match = raw.match(/^VITE_API_URL=(.+)$/m)
      if (match) return match[1].trim().replace(/\/$/, '')
    } catch {
      // ignore missing file
    }
  }
  return 'http://127.0.0.1:8081'
}

const REQUIRED = [
  { id: 'comida', name: 'Comida y bebidas' },
  { id: 'construccion', name: 'Materiales y herramientas de construcción' },
  { id: 'medios-transporte', name: 'Medios de transporte' },
  { id: 'articulos-limpieza', name: 'Articulos de limpieza' },
  { id: 'suplementos-gimnasio', name: 'Suplementos y articulos de gimnasio' },
  { id: 'otros', name: 'Otros' },
]

const apiBase = loadEnvApiUrl()
const url = `${apiBase}/api/categories/`

let payload
try {
  const response = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    console.error(`FAIL: GET ${url} → ${response.status}`)
    process.exit(1)
  }
  payload = await response.json()
} catch (error) {
  console.error(`FAIL: no se pudo conectar con ${url}`)
  console.error(error.message)
  process.exit(1)
}

if (!Array.isArray(payload)) {
  console.error('FAIL: la respuesta no es un arreglo')
  process.exit(1)
}

const byId = new Map(payload.map((item) => [item.id, item]))
const ids = payload.map((item) => item.id)
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
if (duplicateIds.length > 0) {
  console.error(`FAIL: IDs duplicados en la API: ${[...new Set(duplicateIds)].join(', ')}`)
  process.exit(1)
}

let failed = false

for (const required of REQUIRED) {
  const found = byId.get(required.id)
  if (!found) {
    console.error(`FAIL: falta categoría «${required.id}»`)
    failed = true
    continue
  }
  if (found.name !== required.name) {
    console.error(
      `FAIL: «${required.id}» tiene nombre «${found.name}», se esperaba «${required.name}»`,
    )
    failed = true
    continue
  }
  console.log(`OK: ${required.id} → ${found.name}`)
}

for (const item of payload) {
  if (!item?.id || !item?.name) {
    console.error(`FAIL: categoría inválida en la API: ${JSON.stringify(item)}`)
    failed = true
  }
}

if (failed) {
  process.exit(1)
}

console.log(`Todas las categorías requeridas están en la API (${payload.length} en total).`)
