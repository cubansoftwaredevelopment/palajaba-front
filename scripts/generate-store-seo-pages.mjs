import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const distDir = resolve('dist')
const indexPath = resolve(distDir, 'index.html')
const sitemapPath = resolve(distDir, 'sitemap.xml')
const apiUrl = (process.env.VITE_API_URL ?? '').replace(/\/+$/, '')
const siteUrl = (process.env.VITE_SITE_URL ?? 'https://palajaba.com').replace(/\/+$/, '')

const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])
const MAX_ATTEMPTS = 4
const RETRY_BASE_MS = 700

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms))
}

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
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <script>document.documentElement.classList.add('js')</script>
    <style>
      html.js .seo-store-page { display: none !important; }
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
    <div id="root">
      ${page.body_html}
    </div>
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

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function rebuildUrlBlock(block) {
  const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]
  if (!loc) return null

  const lastmod = block.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]
  const changefreq = block.match(/<changefreq>([^<]+)<\/changefreq>/)?.[1]
  const priority = block.match(/<priority>([^<]+)<\/priority>/)?.[1]
  const parts = ['  <url>', `    <loc>${escapeXml(loc)}</loc>`]
  if (lastmod) parts.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`)
  if (changefreq) parts.push(`    <changefreq>${escapeXml(changefreq)}</changefreq>`)
  if (priority) parts.push(`    <priority>${escapeXml(priority)}</priority>`)
  parts.push('  </url>')
  return parts.join('\n')
}

/**
 * Quita del sitemap las tiendas cuya página SEO no se pudo generar,
 * para que verify-store-seo-pages no tumbe el deploy por un 502 puntual del API.
 */
function pruneSitemapMissingStores(writtenSlugs) {
  if (!existsSync(sitemapPath)) return

  const written = new Set(writtenSlugs)
  const sitemap = readFileSync(sitemapPath, 'utf8')
  const staticPaths = new Set(['', 'comprar', 'aplicacion', 'registro'])
  const urlBlocks = [...sitemap.matchAll(/<url>[\s\S]*?<\/url>/g)].map((match) => match[0])

  if (urlBlocks.length === 0) return

  const kept = []
  const removed = []

  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>([^<]+)<\/loc>/)
    if (!locMatch) continue

    const slug = locToSlug(locMatch[1])
    if (!slug || staticPaths.has(slug) || written.has(slug)) {
      const rebuilt = rebuildUrlBlock(block)
      if (rebuilt) kept.push(rebuilt)
      continue
    }

    removed.push(slug)
  }

  if (removed.length === 0) return

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    kept.join('\n'),
    '</urlset>',
    '',
  ].join('\n')

  writeFileSync(sitemapPath, xml, 'utf8')
  console.warn(
    `generate-store-seo-pages: sitemap actualizado; omitidas del índice: ${removed.join(', ')}`,
  )
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
  let lastError = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint)
      if (response.ok) {
        return response.json()
      }

      const statusError = new Error(`HTTP ${response.status}`)
      lastError = statusError
      if (!TRANSIENT_STATUS.has(response.status) || attempt === MAX_ATTEMPTS) {
        throw statusError
      }
    } catch (error) {
      lastError = error
      const statusMatch = /^HTTP (\d+)$/.exec(error.message ?? '')
      const status = statusMatch ? Number(statusMatch[1]) : null
      const isTransientNetwork = !statusMatch
      const isTransientHttp = status != null && TRANSIENT_STATUS.has(status)

      if ((!isTransientNetwork && !isTransientHttp) || attempt === MAX_ATTEMPTS) {
        throw error
      }
    }

    const delay = RETRY_BASE_MS * attempt
    console.warn(
      `generate-store-seo-pages: reintento ${attempt + 1}/${MAX_ATTEMPTS} para ${slug} tras ${lastError?.message ?? 'error'}…`,
    )
    await sleep(delay)
  }

  throw lastError ?? new Error('Error desconocido')
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
  const writtenSlugs = []

  for (const slug of slugs) {
    try {
      const page = await fetchStorePage(slug)
      const outputPath = resolve(distDir, slug, 'index.html')
      mkdirSync(dirname(outputPath), { recursive: true })
      writeFileSync(outputPath, buildStoreHtml(page, assetTags), 'utf8')
      writtenSlugs.push(slug)
    } catch (error) {
      console.warn(`generate-store-seo-pages: omitiendo ${slug} (${error.message}).`)
    }
  }

  pruneSitemapMissingStores(writtenSlugs)

  console.log(
    `generate-store-seo-pages: ${writtenSlugs.length}/${slugs.length} páginas en dist/{slug}/index.html`,
  )
}

main().catch((error) => {
  console.error(`generate-store-seo-pages: error inesperado (${error.message}).`)
  process.exit(1)
})
