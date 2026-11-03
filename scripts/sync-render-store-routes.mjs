import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const renderYamlPath = resolve('render.yaml')
const apiUrl = (process.env.VITE_API_URL ?? '').replace(/\/+$/, '')
const siteUrl = (process.env.VITE_SITE_URL ?? 'https://palajaba.com').replace(/\/+$/, '')

const STATIC_SLUGS = new Set(['', 'comprar', 'aplicacion', 'registro'])
const ROUTES_START = '      # AUTO-GENERATED STORE ROUTES START'
const ROUTES_END = '      # AUTO-GENERATED STORE ROUTES END'

function locToSlug(loc) {
  if (!loc) return ''
  const normalized = loc.replace(/\/+$/, '')
  if (normalized === siteUrl) return ''
  const prefix = `${siteUrl}/`
  if (normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length)
  }
  return ''
}

async function fetchStoreSlugs() {
  if (!apiUrl) {
    console.warn('sync-render-store-routes: VITE_API_URL no definida.')
    return []
  }

  const endpoint = `${apiUrl}/api/platform/seo/indexable-urls`
  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al leer ${endpoint}`)
  }

  const payload = await response.json()
  return (payload.urls ?? [])
    .map((entry) => locToSlug(entry.loc))
    .filter((slug) => slug && !STATIC_SLUGS.has(slug))
    .sort((a, b) => a.localeCompare(b))
}

function buildStoreRouteLines(slugs) {
  if (slugs.length === 0) {
    return [
      ROUTES_START,
      '      # (sin tiendas indexables en este momento)',
      ROUTES_END,
    ]
  }

  return [
    ROUTES_START,
    ...slugs.map(
      (slug) => `      - type: rewrite
        source: /${slug}
        destination: /${slug}/index.html`,
    ),
    ROUTES_END,
  ]
}

function patchRenderYaml(slugs) {
  const content = readFileSync(renderYamlPath, 'utf8')
  const startIndex = content.indexOf(ROUTES_START)
  const endIndex = content.indexOf(ROUTES_END)

  if (startIndex === -1 || endIndex === -1) {
    throw new Error('render.yaml no contiene los marcadores AUTO-GENERATED STORE ROUTES.')
  }

  const before = content.slice(0, startIndex)
  const after = content.slice(endIndex + ROUTES_END.length)
  const block = `${buildStoreRouteLines(slugs).join('\n')}\n`
  writeFileSync(renderYamlPath, `${before}${block}${after}`, 'utf8')
}

async function main() {
  const slugs = await fetchStoreSlugs()
  patchRenderYaml(slugs)
  console.log(`sync-render-store-routes: ${slugs.length} rutas en render.yaml`)
}

main().catch((error) => {
  console.error(`sync-render-store-routes: ${error.message}`)
  process.exit(1)
})
