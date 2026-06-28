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
 * Tema rojo — rojo puro y naranja-rojo (matiz ~0–14°), lejos del rosa magenta (~330°):
 * Referencias: Fire Engine #CC0000, Pure Red #E60000, Scarlet #FF2400, Deep Orange #FF5722.
 * El rosa usa magentas y blush; aquí solo rojos cálidos saturados sobre crema Jaba.
 *
 * Escala oscuro → claro (5 tonos):
 * - Fire Engine  #cc0000 → brand-green: títulos, botones primarios (~6:1 sobre crema)
 * - Pure Red     #e60000 → brand-carmelita: texto secundario (~5.5:1)
 * - Scarlet      #ff2400 → puente en la escala, rojo anaranjado vivo
 * - Deep Orange  #ff5722 → brand-yellow: acentos, chips y avisos (matiz ~14°)
 * - Crema Jaba   #fdfbf2 → brand-white: fondo
 *
 * Tema rosa — escala magenta/rosa (~330–345°), fondo Peachy Pink (#fce4ec):
 * - Deep Rose    #c2185b → brand-green: títulos, botones primarios (~5.8:1)
 * - Dusty Pink   #e91e63 → brand-carmelita: texto secundario (~4.2:1)
 * - Blush Pink   #f48fb1 → reservado para bordes suaves y superficies elevadas
 * - Pastel Pink  #f8bbd0 → puente claro en la escala
 * - Peachy Pink  #fce4ec → brand-white: fondo de página
 * - Blush Pink   #f48fb1 → brand-yellow: acentos, chips y avisos
 * - Dusty Pink   #e91e63 → brand-carmelita: texto secundario
 *
 * Tema verde — amarillo-verde (~88–100°), no verde azulado (~120°):
 * Oscuros oliva/lima para texto; YellowGreen #9ACD32 en acentos; fondo cálido #f1f8e9.
 *
 * Escala oscuro → claro (5 tonos):
 * - Olive Deep    #33691e → brand-green: títulos, botones primarios (~7:1)
 * - Olive Drab    #558b2f → brand-carmelita: texto secundario (~5.5:1)
 * - Light Green   #7cb342 → puente medio en la escala
 * - Yellow Green  #9acd32 → brand-yellow: acentos, chips y avisos
 * - Spring Mist   #f1f8e9 → brand-white: fondo con tinte amarillo-verde
 *
 * Tema azul — contraste luminancia: abisales para texto, azul vivo para acentos (~205–210°):
 * Oscuros Abyss/Lapis del usuario; Slate/Glacier reemplazados por azules brillantes UI.
 *
 * Escala oscuro → claro (5 tonos):
 * - Abyss        #092c56 → brand-green: títulos, botones primarios (~12:1)
 * - Lapis        #225688 → brand-carmelita: texto secundario (~7:1)
 * - Royal Blue   #1976d2 → puente medio en la escala
 * - Sky Blue     #42a5f5 → brand-yellow: acentos, chips y avisos
 * - Quartz       #f0f5f4 → brand-white: fondo de página
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
    description: 'Rojo intenso y naranja-rojo (bomberos/escarlata), bien separado del tema rosa.',
    swatches: ['#cc0000', '#e60000', '#ff2400', '#ff5722', '#fdfbf2'],
    className: 'catalog-theme-red',
  },
  pink: {
    id: 'pink',
    label: 'Rosa',
    description: 'Rosas y magentas suaves sobre un fondo Peachy Pink delicado.',
    swatches: ['#c2185b', '#e91e63', '#f48fb1', '#f8bbd0', '#fce4ec'],
    className: 'catalog-theme-pink',
  },
  green: {
    id: 'green',
    label: 'Verde',
    description: 'Amarillo-verde oliva con acentos lima cálidos, lejos del verde azulado.',
    swatches: ['#33691e', '#558b2f', '#7cb342', '#9acd32', '#f1f8e9'],
    className: 'catalog-theme-green',
  },
  blue: {
    id: 'blue',
    label: 'Azul',
    description: 'Azul abisal con acentos cielo brillantes sobre fondo Quartz.',
    swatches: ['#092c56', '#225688', '#1976d2', '#42a5f5', '#f0f5f4'],
    className: 'catalog-theme-blue',
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
