/** Sugerencias variadas (restaurante, ferretería, ropa, etc.) */
export const CATALOG_CATEGORY_SUGGESTIONS = [
  'Entrantes',
  'Ferretería',
  'Electrodomésticos',
  'Ropa de hombre',
  'Repuestos',
  'Panadería',
]

export const CATALOG_ONBOARDING_STEPS = [
  {
    title: 'Elige la categoría',
    description: 'Usa las categorías globales de la plataforma, inspiradas en Revolico.',
  },
  {
    title: 'Agrega el producto',
    description: 'Foto, nombre, precio y descripción en cada ítem.',
  },
  {
    title: 'Publica tu tienda',
    description: 'Tus clientes verán el catálogo listo para comprar.',
  },
]

export function getCategoryInitial(name) {
  const trimmed = name?.trim()
  if (!trimmed) return '?'
  return trimmed.charAt(0).toUpperCase()
}
