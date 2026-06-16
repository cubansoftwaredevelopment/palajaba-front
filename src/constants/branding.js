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

/** Nombre del home de compradores (feed de tiendas por municipio). */
export const MARKETPLACE_LABEL = 'Marketplace'

/** CTA del inicio para entrar a comprar sin cuenta. */
export const BUY_ENTRY_LABEL = 'Continuar a comprar'

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

export const DEAD_MASCOT = {
  src: '/images/states/dead.png',
  alt: 'No disponible',
}

export const ETECSA_ERROR_MASCOT = {
  src: '/images/states/etecsa-error.png',
  alt: 'Error de conexión',
}

/** Mismo tamaño hero que en Welcome */
export const LOGO_HERO_CLASS =
  'h-auto w-full max-w-[min(100%,20rem)] sm:max-w-[22rem] md:max-w-[26rem]'
