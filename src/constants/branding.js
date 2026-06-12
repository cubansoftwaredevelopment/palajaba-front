/**
 * Logo de marca (imagen original).
 *
 * Coloca tu archivo en frontend/public/:
 *   - logo.png        → sitio público (fondo claro)
 *   - logo-black.png  → panel admin (fondo oscuro)
 *
 * El favicon del navegador usa logo.png automáticamente.
 */
export const BRAND_NAME = "Pa' La Jaba"

export const LOGO = {
  png: '/logo.png',
  black: '/logo-black.png',
  alt: `Logo de ${BRAND_NAME}`,
}

export const JABA_BAG = {
  src: '/images/buy-bag.png',
  alt: 'Jaba de compras',
}

export const LOADING_MASCOT = {
  src: '/images/states/loading.png',
  alt: 'Cargando',
}

/** Mismo tamaño hero que en Welcome */
export const LOGO_HERO_CLASS =
  'h-auto w-full max-w-[min(100%,20rem)] sm:max-w-[22rem] md:max-w-[26rem]'
