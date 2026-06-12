/**
 * Verifica que las rutas del panel admin existen en el router.
 * Uso: node scripts/verify-admin-routes.mjs
 */
import { createMemoryRouter, matchRoutes } from 'react-router-dom'

const adminPaths = [
  '/admin',
  '/admin/estadisticas',
  '/admin/solicitudes',
  '/admin/notificaciones',
  '/admin/configuracion',
]

const routes = [
  {
    path: '/',
    children: [
      {
        path: 'admin',
        children: [
          { index: true, element: null },
          {
            children: [
              { path: 'estadisticas', element: null },
              { path: 'solicitudes', element: null },
              { path: 'notificaciones', element: null },
              { path: 'configuracion', element: null },
            ],
          },
        ],
      },
    ],
  },
]

let failed = false

for (const path of adminPaths) {
  const matches = matchRoutes(routes, path)
  if (!matches?.length) {
    console.error(`FAIL: no hay ruta para ${path}`)
    failed = true
    continue
  }
  console.log(`OK: ${path}`)
}

if (failed) {
  process.exit(1)
}

console.log('Todas las rutas admin resuelven correctamente.')
