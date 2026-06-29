import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const distDir = resolve('dist')
const indexPath = resolve(distDir, 'index.html')
const apiUrl = (process.env.VITE_API_URL ?? '').replace(/\/+$/, '')
const siteUrl = (process.env.VITE_SITE_URL ?? 'https://palajaba.com').replace(/\/+$/, '')

function extractAssetTags(html) {
  const tags = []
  for (const match of html.matchAll(/<script[^>]+type="module"[^>]*><\/script>/g)) {
    tags.push(match[0])
  }
  for (const match of html.matchAll(/<link rel="stylesheet"[^>]*>/g)) {
    tags.push(match[0])
  }
  return tags.join('\n    ')
}

function buildStoreHtml(page, assetTags) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#59802c" />
    <link rel="icon" type="image/png" href="/logo.png" />
    <link rel="apple-touch-icon" href="/logo.png" />
    <style>
      .seo-store-page { max-width: 42rem; margin: 0 auto; padding: 1.25rem; font-family: Georgia, serif; color: #2d5016; line-height: 1.5; }
      .seo-store-page h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
      .seo-store-page h2 { font-size: 1.15rem; margin-top: 1.5rem; }
      .seo-store-page ul { padding-left: 1.25rem; }
      .seo-store-page li { margin: 0.35rem 0; }
    </style>
    ${page.head_html}
    ${assetTags}
  </head>
  <body>
    ${page.body_html}
    <div id="root"></div>
  </body>
</html>
`
}

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
    console.warn('generate-store-seo-pages: VITE_API_URL no definida; se omiten tiendas.')
    return []
  }

  const endpoint = `${apiUrl}/api/platform/seo/indexable-urls`
  try {
    const response = await fetch(endpoint)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const payload = await response.json()
    const staticPaths = new Set(['', 'comprar', 'aplicacion', 'registro'])
    return (payload.urls ?? [])
      .map((entry) => locToSlug(entry.loc))
      .filter((slug) => slug && !staticPaths.has(slug))
  } catch (error) {
    console.warn(`generate-store-seo-pages: no se pudo leer ${endpoint} (${error.message}).`)
    return []
  }
}

async function fetchStorePage(slug) {
  const endpoint = `${apiUrl}/api/platform/seo/store/${encodeURIComponent(slug)}`
  const response = await fetch(endpoint)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  return response.json()
}

async function main() {
  if (!existsSync(indexPath)) {
    console.error('generate-store-seo-pages: dist/index.html no existe. Ejecuta vite build primero.')
    process.exit(1)
  }

  const slugs = await fetchStoreSlugs()
  if (slugs.length === 0) {
    console.log('generate-store-seo-pages: no hay tiendas indexables (0 páginas).')
    return
  }

  const assetTags = extractAssetTags(readFileSync(indexPath, 'utf8'))
  let written = 0

  for (const slug of slugs) {
    try {
      const page = await fetchStorePage(slug)
      const outputPath = resolve(distDir, slug, 'index.html')
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, buildStoreHtml(page, assetTags), 'utf8')
      written += 1
    } catch (error) {
      console.warn(`generate-store-seo-pages: omitiendo ${slug} (${error.message}).`)
    }
  }

  console.log(`generate-store-seo-pages: ${written}/${slugs.length} páginas en dist/{slug}/index.html`)
}

main().catch((error) => {
  console.error(`generate-store-seo-pages: error inesperado (${error.message}).`)
  process.exit(1)
})
