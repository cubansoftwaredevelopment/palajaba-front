import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const indexPath = resolve('dist/index.html')
const fallbackPath = resolve('dist/404.html')

// Rutas del router que no tienen HTML propio. Render, si no aplica el rewrite
// de render.yaml, responde 404 en la URL directa. Un archivo en esa ruta
// se sirve con 200. Se copia el shell de Vite (rutas de /assets absolutas).
const SPA_ROUTES = [
  'login',
  'aplicacion',
  'terminos',
  'privacidad',
  'preguntas',
  'crear-cuenta',
  'registro',
  'registro/planes',
  'registro/pago',
  'registro/verificacion',
  'registro/otp',
  'registro/exito',
  'recuperar',
  'recuperar/codigo',
  'recuperar/nueva',
  'cliente/registro',
  'cliente/recuperar',
  'tienda',
  'tienda/catalogo',
  'tienda/catalogo/vista-previa',
  'tienda/gestores',
  'tienda/pedidos',
  'tienda/clientes',
  'tienda/estadisticas',
  'tienda/perfil',
  'tienda/completar-perfil',
  'admin',
  'admin/estadisticas',
  'admin/solicitudes',
  'admin/descuentos',
  'admin/mensajes',
  'admin/disputas',
  'admin/productos',
  'admin/banners',
  'admin/finanzas',
  'admin/configuracion',
]

if (!existsSync(indexPath)) {
  console.error('copy-spa-fallback: dist/index.html no existe. Ejecuta vite build primero.')
  process.exit(1)
}

copyFileSync(indexPath, fallbackPath)

for (const route of SPA_ROUTES) {
  const directoryIndex = resolve('dist', route, 'index.html')
  mkdirSync(dirname(directoryIndex), { recursive: true })
  copyFileSync(indexPath, directoryIndex)
  copyFileSync(indexPath, resolve('dist', `${route}.html`))
}

console.log(`copy-spa-fallback: dist/404.html y ${SPA_ROUTES.length} rutas SPA listas`)
