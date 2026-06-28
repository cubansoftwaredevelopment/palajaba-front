import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const distDir = resolve('dist')
const outputPath = resolve(distDir, 'sitemap.xml')
const siteUrl = (process.env.VITE_SITE_URL ?? 'https://palajaba.com').replace(/\/+$/, '')
const apiUrl = (process.env.VITE_API_URL ?? '').replace(/\/+$/, '')

const STATIC_URLS = [
  { loc: siteUrl, changefreq: 'daily', priority: '1.0' },
  { loc: `${siteUrl}/comprar`, changefreq: 'daily', priority: '0.9' },
  { loc: `${siteUrl}/aplicacion`, changefreq: 'monthly', priority: '0.6' },
  { loc: `${siteUrl}/registro`, changefreq: 'monthly', priority: '0.7' },
]

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildSitemapXml(urls) {
  const body = urls
    .map((entry) => {
      const parts = [
        '  <url>',
        `    <loc>${escapeXml(entry.loc)}</loc>`,
      ]
      if (entry.lastmod) {
        parts.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`)
      }
      if (entry.changefreq) {
        parts.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`)
      }
      if (entry.priority) {
        parts.push(`    <priority>${escapeXml(entry.priority)}</priority>`)
      }
      parts.push('  </url>')
      return parts.join('\n')
    })
    .join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    body,
    '</urlset>',
    '',
  ].join('\n')
}

async function fetchIndexableUrls() {
  if (!apiUrl) {
    console.warn('generate-sitemap: VITE_API_URL no definida; solo páginas estáticas.')
    return null
  }

  const endpoint = `${apiUrl}/api/platform/seo/indexable-urls`
  try {
    const response = await fetch(endpoint)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const payload = await response.json()
    if (!Array.isArray(payload.urls) || payload.urls.length === 0) {
      return null
    }
    return payload.urls
  } catch (error) {
    console.warn(`generate-sitemap: no se pudo leer ${endpoint} (${error.message}).`)
    return null
  }
}

async function main() {
  if (!existsSync(distDir)) {
    console.error('generate-sitemap: dist/ no existe. Ejecuta vite build primero.')
    process.exit(1)
  }

  const urls = (await fetchIndexableUrls()) ?? STATIC_URLS
  writeFileSync(outputPath, buildSitemapXml(urls), 'utf8')
  console.log(`generate-sitemap: ${outputPath} (${urls.length} URLs)`)
}

main()
