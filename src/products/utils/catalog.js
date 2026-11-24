/** Sugerencias para nombres de categorías locales del catálogo (menú de la tienda).
 *  Las categorías globales de negocio vienen del API: GET /api/categories
 *  (fuente: backend/app/services/categories.py). */
export const CATALOG_CATEGORY_SUGGESTIONS = [
  'Entrantes',
  'Ferretería',
  'Electrodomésticos',
  'Ropa de hombre',
  'Repuestos',
  'Bicicletas',
  'Motos',
  'Panadería',
]

export const CATALOG_ONBOARDING_STEPS = [
  {
    title: 'Crea categorías locales',
    description: 'Agrupa tus productos como tú quieras (Despensa, Ofertas, etc.).',
  },
  {
    title: 'Agrega cada producto',
    description: 'Elige categoría local + global del negocio, foto, precio y descripción.',
  },
  {
    title: 'Publica tu tienda',
    description: 'Tu catálogo público usa las categorías locales; el marketplace usa la global.',
  },
]

export function getCategoryInitial(name) {
  const trimmed = name?.trim()
  if (!trimmed) return '?'
  return trimmed.charAt(0).toUpperCase()
}
