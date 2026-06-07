import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const indexPath = resolve('dist/index.html')
const fallbackPath = resolve('dist/404.html')

if (!existsSync(indexPath)) {
  console.error('copy-spa-fallback: dist/index.html no existe. Ejecuta vite build primero.')
  process.exit(1)
}

copyFileSync(indexPath, fallbackPath)
console.log('copy-spa-fallback: dist/404.html listo para rutas SPA (/admin, /login, etc.)')
