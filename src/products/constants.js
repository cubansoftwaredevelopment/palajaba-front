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
 *
 * Tema morado — violetas y lilas (~270–300°), fondo Silver Wisteria (#dad4df):
 * - Midnight Orchid #312a44 → brand-green: títulos, botones Comprar (morado oscuro)
 * - Grape Dusk       #5b4b8a → brand-carmelita: texto secundario y metadatos
 * - Dusky Lilac      #8870e3 → brand-yellow: acentos, chips y avisos
 * - Iris Mist        #bab0c8 → puente claro en la escala
 * - Silver Wisteria  #dad4df → brand-white: fondo de página
 *
 * Tema naranja (Mango) — naranjas cálidos maduros (~30–35°):
 * Los cinco tonos del usuario son vibrantes y cercanos en luminancia; usados tal cual
 * como fondo (#ffcd90) el contraste con el resto cae ~1.2–1.8:1 (WCAG AA pide ≥4.5:1).
 * Patrón como Marpacífico: fondo crema cálida + naranjas oscuros para texto/CTA.
 *
 * Escala en el picker (oscuro → claro):
 * - Burnt Mango   #c24100 → brand-green: títulos y texto (legible)
 * - Mango Deep    #ff7b00 → brand-yellow + CTAs sólidos (Comprar, AGOTADO)
 * - Mango Rich    #ff8d21 → puente en la escala
 * - Mango Soft    #ffb76b → puente claro
 * - Mango Cream   #fff8f0 → brand-white: fondo (crema mango, no el #ffcd90 medio)
 * - Rust Mango    #9a3412 → brand-carmelita: texto secundario (~6.9:1)
 *
 * Tema amarillo (Marcolina) — amarillos cálidos (~45–50°):
 * Misma lógica que Mango: fondo #fdfbcf + dorados oscuros para texto legible.
 * CTAs en #f7c319 con texto oscuro (blanco sobre amarillo falla contraste ~1.6:1).
 *
 * Escala en el picker (oscuro → claro):
 * - Marcolina Deep  #7a6200 → brand-green: títulos y texto (~5.6:1)
 * - Marcolina Gold  #f7c319 → brand-yellow + CTAs sólidos (Comprar, AGOTADO)
 * - Marcolina Warm  #facf43 → puente en la escala
 * - Marcolina Soft  #fcdb6d → puente claro
 * - Marcolina Cream #fdfbcf → brand-white: fondo de página
 * - Marcolina Rust  #8a6d00 → brand-carmelita: texto secundario (~4.7:1)
 *
 * Tema carmelita (Café Cortao) — marrones café (~20–30°), escala café con leche:
 * Los cuatro tonos del usuario ya contrastan bien sobre #f3e9dc (espresso ~9:1).
 * Quinto tono añadido: Latte Foam #e5c9a8 — puente entre caramelo #c08552 y crema #f3e9dc.
 *
 * Escala oscuro → claro (5 tonos):
 * - Espresso      #5e3023 → brand-green: títulos y texto (~9.1:1)
 * - Mocha         #895737 → brand-carmelita: texto secundario (~5.0:1)
 * - Caramel       #c08552 → brand-yellow + CTAs sólidos (Comprar, AGOTADO)
 * - Latte Foam    #e5c9a8 → puente claro (chips, superficies elevadas)
 * - Oat Cream     #f3e9dc → brand-white: fondo de página
 */

export const DEFAULT_CATALOG_THEME = 'default'

export const PALETTE_SLOTS = ['primary', 'background', 'accent', 'secondary']

export const PALETTE_SLOT_META = {
  primary: {
    label: 'Principal',
    hint: 'Títulos y botones',
    cssVar: '--color-brand-green',
  },
  background: {
    label: 'Fondo',
    hint: 'Fondo de la página',
    cssVar: '--color-brand-white',
  },
  accent: {
    label: 'Acento',
    hint: 'Chips y avisos',
    cssVar: '--color-brand-yellow',
  },
  secondary: {
    label: 'Secundario',
    hint: 'Texto auxiliar',
    cssVar: '--color-brand-carmelita',
  },
}

export const CATALOG_THEME_PALETTES = {
  default: {
    id: 'default',
    label: 'Pa\' La Jaba',
    description: 'Amarillo tamal, verde aguacate y carmelita chocolate, pa que te de hambre',
    swatches: ['#59802c', '#fdfbf2', '#f5c71a', '#7b4c38'],
    tokens: {
      primary: '#59802c',
      background: '#fdfbf2',
      accent: '#f5c71a',
      secondary: '#7b4c38',
    },
    className: 'catalog-theme-default',
  },
  grey: {
    id: 'grey',
    label: 'Apagón',
    description: 'Paleta sobria en escala de grises como el perro apagón 💡, en el que debes estar ahora mismo.',
    swatches: ['#2b2b2b', '#565656', '#848484', '#b3b3b3', '#e0e0e0'],
    tokens: {
      primary: '#2b2b2b',
      background: '#e0e0e0',
      accent: '#b3b3b3',
      secondary: '#848484',
    },
    className: 'catalog-theme-grey',
  },
  red: {
    id: 'red',
    label: 'Marpacífico',
    description: 'Rojito marpacífico como el patio de tu abuela',
    swatches: ['#cc0000', '#e60000', '#ff2400', '#ff5722', '#fdfbf2'],
    tokens: {
      primary: '#cc0000',
      background: '#fdfbf2',
      accent: '#ff5722',
      secondary: '#e60000',
    },
    className: 'catalog-theme-red',
  },
  pink: {
    id: 'pink',
    label: 'Flamenco',
    description: 'Pa que flameenquee Santa Clo\'',
    swatches: ['#c2185b', '#e91e63', '#f48fb1', '#f8bbd0', '#fce4ec'],
    tokens: {
      primary: '#c2185b',
      background: '#fce4ec',
      accent: '#f48fb1',
      secondary: '#e91e63',
    },
    className: 'catalog-theme-pink',
  },
  green: {
    id: 'green',
    label: 'Limonada',
    description: 'La limonada es la base de to\' 🎶',
    swatches: ['#33691e', '#558b2f', '#7cb342', '#9acd32', '#f1f8e9'],
    tokens: {
      primary: '#33691e',
      background: '#f1f8e9',
      accent: '#9acd32',
      secondary: '#558b2f',
    },
    className: 'catalog-theme-green',
  },
  blue: {
    id: 'blue',
    label: 'Varadero',
    description: 'No hay transporte para ir, pero al menos que tu catalogo te haga sentir la playa.',
    swatches: ['#092c56', '#225688', '#1976d2', '#42a5f5', '#f0f5f4'],
    tokens: {
      primary: '#092c56',
      background: '#f0f5f4',
      accent: '#2196f3',
      secondary: '#225688',
    },
    className: 'catalog-theme-blue',
  },
  purple: {
    id: 'purple',
    label: 'Uva Caleta',
    description: 'Moradito, acido y con arena en las manos.',
    swatches: ['#312a44', '#5b4b8a', '#8870e3', '#bab0c8', '#dad4df'],
    tokens: {
      primary: '#312a44',
      background: '#dad4df',
      accent: '#8870e3',
      secondary: '#5b4b8a',
    },
    className: 'catalog-theme-purple',
  },
  orange: {
    id: 'orange',
    label: 'Mango',
    description: 'Bien maduro y picao en cuadritos.',
    swatches: ['#c24100', '#ff7b00', '#ff8d21', '#ffa652', '#fff8f0'],
    tokens: {
      primary: '#c24100',
      background: '#fff8f0',
      accent: '#ff7b00',
      secondary: '#9a3412',
    },
    className: 'catalog-theme-orange',
  },
  yellow: {
    id: 'yellow',
    label: 'Marcolina',
    description: 'YA EMPEZÓ LA SOMBRILLA AMARILLA, VAMOS,  VEN A LA CASA E MARCOLINA',
    swatches: ['#7a6200', '#f7c319', '#facf43', '#fcdb6d', '#fdfbcf'],
    tokens: {
      primary: '#7a6200',
      background: '#fdfbcf',
      accent: '#f7c319',
      secondary: '#8a6d00',
    },
    className: 'catalog-theme-yellow',
  },
  carmelita: {
    id: 'carmelita',
    label: 'Café Cortao',
    description: '5% café, 95% chícharo',
    swatches: ['#5e3023', '#895737', '#c08552', '#e5c9a8', '#f3e9dc'],
    tokens: {
      primary: '#5e3023',
      background: '#f3e9dc',
      accent: '#c08552',
      secondary: '#895737',
    },
    className: 'catalog-theme-carmelita',
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

const HEX_RE = /^#?([0-9a-fA-F]{6})$/

export function parseHexColor(value, fallback = '#59802c') {
  const match = HEX_RE.exec(String(value ?? '').trim())
  if (!match) {
    const fallbackMatch = HEX_RE.exec(String(fallback).trim())
    return `#${(fallbackMatch ? fallbackMatch[1] : '59802c').toLowerCase()}`
  }
  return `#${match[1].toLowerCase()}`
}

export function clampPaletteOpacity(value, fallback = 100) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    const next = Number(fallback)
    return Number.isFinite(next) ? Math.max(0, Math.min(100, Math.round(next))) : 100
  }
  return Math.max(0, Math.min(100, Math.round(amount)))
}

export function paletteFromTheme(theme) {
  const tokens = getCatalogThemeDefinition(theme).tokens
  return {
    primary: { hex: tokens.primary, opacity: 100 },
    background: { hex: tokens.background, opacity: 100 },
    accent: { hex: tokens.accent, opacity: 100 },
    secondary: { hex: tokens.secondary, opacity: 100 },
  }
}

function normalizePaletteSlot(raw, fallback) {
  return {
    hex: parseHexColor(raw?.hex, fallback.hex),
    opacity: clampPaletteOpacity(raw?.opacity, fallback.opacity),
  }
}

export function normalizeCatalogPalette(raw, theme) {
  const fallback = paletteFromTheme(theme)
  if (!raw || typeof raw !== 'object') return fallback
  return {
    primary: normalizePaletteSlot(raw.primary, fallback.primary),
    background: normalizePaletteSlot(raw.background, fallback.background),
    accent: normalizePaletteSlot(raw.accent, fallback.accent),
    secondary: normalizePaletteSlot(raw.secondary, fallback.secondary),
  }
}

export function hexToRgb(hex) {
  const normalized = parseHexColor(hex)
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  }
}

export function paletteColorToCss(color) {
  const { r, g, b } = hexToRgb(color?.hex)
  const alpha = clampPaletteOpacity(color?.opacity) / 100
  return `rgb(${r} ${g} ${b} / ${alpha})`
}

export function paletteToCssVars(palette, theme) {
  const normalized = normalizeCatalogPalette(palette, theme)
  const vars = {}
  for (const slot of PALETTE_SLOTS) {
    vars[PALETTE_SLOT_META[slot].cssVar] = paletteColorToCss(normalized[slot])
  }
  return vars
}
