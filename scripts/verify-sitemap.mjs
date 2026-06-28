import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const sitemapPath = resolve('dist/sitemap.xml')

if (!existsSync(sitemapPath)) {
  console.error('verify-sitemap: dist/sitemap.xml no existe.')
  process.exit(1)
}

const content = readFileSync(sitemapPath, 'utf8').trimStart()
if (!content.startsWith('<?xml')) {
  console.error('verify-sitemap: dist/sitemap.xml no es XML válido (¿se sirvió index.html?).')
  process.exit(1)
}

if (!content.includes('<urlset')) {
  console.error('verify-sitemap: dist/sitemap.xml no contiene <urlset>.')
  process.exit(1)
}

console.log('verify-sitemap: OK')
