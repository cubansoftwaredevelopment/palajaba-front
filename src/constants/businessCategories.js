/**
 * Categorías globales de negocio (perfil del vendedor, productos, marketplace).
 *
 * La lista completa vive en el backend:
 *   backend/app/services/categories.py → DEFAULT_CATEGORIES
 *
 * El frontend siempre la consume vía GET /api/categories (fetchCategories).
 * Este archivo solo documenta requisitos mínimos para verificación en CI/local.
 *
 * Al agregar una categoría: actualizar categories.py y añadirla aquí, luego:
 *   backend:  .\\venv\\Scripts\\python.exe scripts\\test_medios_transporte_category.py
 *   frontend: node scripts/verify-business-categories.mjs
 */

/** Categorías que deben existir en la API con id y nombre exactos. */
export const REQUIRED_BUSINESS_CATEGORIES = [
  { id: 'comida', name: 'Comida y bebidas' },
  { id: 'construccion', name: 'Materiales y herramientas de construcción' },
  { id: 'medios-transporte', name: 'Medios de transporte' },
  { id: 'articulos-limpieza', name: 'Articulos de limpieza' },
  { id: 'suplementos-gimnasio', name: 'Suplementos y articulos de gimnasio' },
  { id: 'otros', name: 'Otros' },
]

export function formatBusinessCategoryFallback(id) {
  if (!id) return ''
  return id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** Une la lista de la API con IDs ya guardados en el perfil (evita chips vacíos). */
export function resolveSelectedBusinessCategories(categories, selectedIds) {
  const byId = new Map((categories ?? []).map((category) => [category.id, category]))
  return (selectedIds ?? [])
    .filter(Boolean)
    .map((id) => byId.get(id) ?? { id, name: formatBusinessCategoryFallback(id) })
}
