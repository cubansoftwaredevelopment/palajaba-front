import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const distDir = resolve('dist')
const sitemapPath = resolve(distDir, 'sitemap.xml')

if (!existsSync(sitemapPath)) {
  console.error('verify-store-seo-pages: dist/sitemap.xml no existe.')
  process.exit(1)
}

const sitemap = readFileSync(sitemapPath, 'utf8')
const siteUrl = (process.env.VITE_SITE_URL ?? 'https://palajaba.com').replace(/\/+$/, '')
const staticPaths = new Set(['', 'comprar', 'aplicacion', 'registro', 'remesas'])
const slugs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => match[1].replace(`${siteUrl}/`, '').replace(`${siteUrl}`, ''))
  .filter((slug) => slug && !staticPaths.has(slug))

if (slugs.length === 0) {
  console.log('verify-store-seo-pages: no hay tiendas en el sitemap (OK).')
  process.exit(0)
}

const missing = slugs.filter((slug) => !existsSync(resolve(distDir, slug, 'index.html')))

if (missing.length > 0) {
  console.error(`verify-store-seo-pages: faltan páginas SEO para: ${missing.join(', ')}`)
  process.exit(1)
}

console.log(`verify-store-seo-pages: OK (${slugs.length} tiendas)`)
