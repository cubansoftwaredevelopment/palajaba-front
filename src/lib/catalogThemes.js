/**
 * Temas del catálogo público.
 *
 * Cada tema redefine los tokens semánticos de Tailwind (brand-green, brand-white, etc.)
 * para que todo el catálogo herede la paleta sin tocar cada componente.
 *
 * Tema gris — estudio de contraste sobre fondo Cloud Veil (#e0e0e0):
 * - Charcoal Noir  #2b2b2b → brand-green: títulos, botones primarios, iconos (~12:1)
 * - Cloud Veil     #e0e0e0 → brand-white: fondo de página y superficies base
 * - Moonlit Silver #b3b3b3 → brand-yellow: acentos, chips y avisos suaves
 * - Urban Fog      #848484 → brand-carmelita: texto secundario y metadatos (~3.5:1)
 * - Ironclad Grey  #565656 → reservado para bordes fuertes vía opacidad sobre charcoal
 *
 * Tema rojo — escala burdeos/vino (matiz ~0–8°, sin rosas ni magentas):
 * Escala oscuro → claro (5 tonos):
 * - Rum Chocolate  #4a0a0f → brand-green: títulos, botones primarios (~12:1 sobre crema)
 * - Vampire Hunter #5f0309 → brand-carmelita: texto secundario (~10:1)
 * - Cordovan Wine  #6e1a24 → puente vino entre los burdeos oscuros y Red Dahlia
 * - Red Dahlia     #85222f → brand-yellow: acentos, chips y avisos (~5.5:1)
 * - Crema Jaba     #fdfbf2 → brand-white: fondo (beige medio de Pa' La Jaba)
 *
 * Tema rosa — escala magenta/rosa (~330–345°), fondo Peachy Pink (#fce4ec):
 * - Deep Rose    #c2185b → brand-green: títulos, botones primarios (~5.8:1)
 * - Dusty Pink   #e91e63 → brand-carmelita: texto secundario (~4.2:1)
 * - Blush Pink   #f48fb1 → reservado para bordes suaves y superficies elevadas
 * - Pastel Pink  #f8bbd0 → puente claro en la escala
 * - Peachy Pink  #fce4ec → brand-white: fondo de página
 * - Blush Pink   #f48fb1 → brand-yellow: acentos, chips y avisos
 * - Dusty Pink   #e91e63 → brand-carmelita: texto secundario
 */

export const DEFAULT_CATALOG_THEME = 'default'

export const CATALOG_THEME_PALETTES = {
  default: {
    id: 'default',
    label: 'Clásico',
    description: 'Los colores originales de Pa\' La Jaba: verde, crema y acentos cálidos.',
    swatches: ['#59802c', '#fdfbf2', '#f5c71a', '#7b4c38'],
    className: 'catalog-theme-default',
  },
  grey: {
    id: 'grey',
    label: 'Gris',
    description: 'Paleta neutra en escala de grises para un catálogo sobrio y elegante.',
    swatches: ['#2b2b2b', '#565656', '#848484', '#b3b3b3', '#e0e0e0'],
    className: 'catalog-theme-grey',
  },
  red: {
    id: 'red',
    label: 'Rojo',
    description: 'Burdeos y carmesí sobre el beige crema de Pa\' La Jaba.',
    swatches: ['#4a0a0f', '#5f0309', '#6e1a24', '#85222f', '#fdfbf2'],
    className: 'catalog-theme-red',
  },
  pink: {
    id: 'pink',
    label: 'Rosa',
    description: 'Rosas y magentas suaves sobre un fondo Peachy Pink delicado.',
    swatches: ['#c2185b', '#e91e63', '#f48fb1', '#f8bbd0', '#fce4ec'],
    className: 'catalog-theme-pink',
  },
}

export const CATALOG_THEME_IDS = Object.keys(CATALOG_THEME_PALETTES)

export function normalizeCatalogTheme(value) {
  const theme = String(value ?? '').trim().toLowerCase()
  if (theme in CATALOG_THEME_PALETTES) return theme
  return DEFAULT_CATALOG_THEME
}

export function getCatalogThemeDefinition(theme) {
  return CATALOG_THEME_PALETTES[normalizeCatalogTheme(theme)]
}

export function getCatalogThemeClass(theme) {
  return getCatalogThemeDefinition(theme).className
}

export function listCatalogThemes() {
  return CATALOG_THEME_IDS.map((id) => CATALOG_THEME_PALETTES[id])
}
