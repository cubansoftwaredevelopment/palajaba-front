/**
 * Descarga imágenes emblemáticas de provincias desde Wikimedia Commons.
 *
 * Uso (desde frontend/):
 *   node scripts/download-province-images.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { PROVINCE_LANDMARKS } from './province-landmarks.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = join(__dirname, '../public/images/provinces')
const THUMB_WIDTH = 800
const DELAY_MS = 3000

const SEARCH_BY_PROVINCE = {
  'pinar-del-rio': 'Viñales mogotes Cuba',
  artemisa: 'Las Terrazas Cuba',
  mayabeque: 'Viaducto Bacunayagua Cuba',
  'villa-clara': 'Che Guevara mausoleum Santa Clara Cuba',
  'sancti-spiritus': 'Trinidad Cuba plaza mayor',
  'ciego-de-avila': 'Cayo Coco Cuba beach',
  camaguey: 'Camagüey cathedral church',
  'las-tunas': 'Las Tunas Cuba city',
  holguin: 'Loma de la Cruz Holguín',
  granma: 'Bayamo cathedral Cuba',
  'santiago-de-cuba': 'Castillo San Pedro de la Roca Cuba',
  guantanamo: 'El Yunque Baracoa Cuba',
  'isla-de-la-juventud': 'Presidio Modelo Cuba',
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function commonsGet(params) {
  const url = `https://commons.wikimedia.org/w/api.php?${params}`
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PaLaJaba-ECommerce/1.0 (local dev script)' },
  })
  if (!response.ok) {
    throw new Error(`API HTTP ${response.status}`)
  }
  return response.json()
}

async function searchCommonsFile(query) {
  const payload = await commonsGet(
    new URLSearchParams({
      action: 'query',
      format: 'json',
      list: 'search',
      srnamespace: '6',
      srlimit: '5',
      srsearch: query,
    }).toString(),
  )
  const hit = payload.query?.search?.[0]
  return hit?.title ?? null
}

async function fetchCommonsThumb(commonsFile) {
  const payload = await commonsGet(
    new URLSearchParams({
      action: 'query',
      format: 'json',
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: String(THUMB_WIDTH),
      titles: commonsFile,
    }).toString(),
  )

  const pages = payload.query?.pages ?? {}
  const page = Object.values(pages)[0]
  if (!page || page.missing !== undefined) {
    throw new Error('Archivo no encontrado en Commons')
  }

  const info = page.imageinfo?.[0]
  const url = info?.thumburl || info?.url
  if (!url) {
    throw new Error('Sin URL de imagen')
  }
  return url
}

async function downloadImage(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PaLaJaba-ECommerce/1.0 (local dev script)' },
  })
  if (!response.ok) {
    throw new Error(`Download HTTP ${response.status}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length < 1024) {
    throw new Error('Archivo demasiado pequeño')
  }
  return buffer
}

async function resolveCommonsFile(provinceId, meta) {
  if (meta.commonsFile) {
    try {
      await fetchCommonsThumb(meta.commonsFile)
      return meta.commonsFile
    } catch {
      // fallback to search
    }
  }

  const query = SEARCH_BY_PROVINCE[provinceId]
  if (!query) {
    throw new Error('Sin búsqueda alternativa')
  }

  const found = await searchCommonsFile(query)
  if (!found) {
    throw new Error(`Sin resultados para "${query}"`)
  }
  return found
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true })

  const failures = []
  let ok = 0

  for (const [provinceId, meta] of Object.entries(PROVINCE_LANDMARKS)) {
    const outPath = join(OUTPUT_DIR, `${provinceId}.jpg`)
    process.stdout.write(`${provinceId} (${meta.landmark})… `)

    try {
      await sleep(DELAY_MS)
      const commonsFile = await resolveCommonsFile(provinceId, meta)
      const thumbUrl = await fetchCommonsThumb(commonsFile)
      const bytes = await downloadImage(thumbUrl)
      writeFileSync(outPath, bytes)
      ok += 1
      console.log(`OK ← ${commonsFile.replace('File:', '')} (${Math.round(bytes.length / 1024)} KB)`)
    } catch (error) {
      failures.push({ provinceId, error: error.message })
      console.log(`FAIL — ${error.message}`)
    }
  }

  console.log(`\nDescargadas: ${ok}/${Object.keys(PROVINCE_LANDMARKS).length}`)
  if (failures.length) {
    console.log('\nFallos:')
    for (const item of failures) {
      console.log(`  - ${item.provinceId}: ${item.error}`)
    }
    process.exitCode = 1
  }
}

main()
