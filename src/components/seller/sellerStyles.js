/** Clases mobile-first del área vendedor (dashboard / onboarding) */

export const sellerShell =
  'relative flex min-h-dvh flex-col bg-brand-white lg:h-dvh lg:flex-row lg:overflow-hidden'

export const sellerHeader =
  'z-20 shrink-0 border-b border-brand-green/8 bg-brand-white/95 px-4 py-3 backdrop-blur-md sm:px-5 lg:px-8 lg:py-4'

export const sellerHeaderInner =
  'mx-auto flex w-full max-w-md items-center gap-2.5 sm:gap-3 lg:max-w-none'

export const sellerBody = 'flex min-h-0 flex-1 flex-col lg:min-w-0 lg:flex-row'

export const sellerSidebar =
  'hidden shrink-0 border-brand-green/10 bg-brand-white/50 px-3 py-6 lg:flex lg:h-full lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-r xl:w-60'

export const sellerSidebarLogoWrap = 'mb-8 flex justify-center px-2'

export const sellerContent = 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:h-full'

/** Contenedor de scroll (mismo patrón que buyer-scroll) */
export const sellerScrollArea =
  'seller-scroll relative z-0 min-h-0 flex-1 basis-0 overflow-y-auto overscroll-y-contain [touch-action:pan-y]'

export const sellerMain =
  'mx-auto w-full max-w-md px-4 pb-28 pt-4 sm:px-5 sm:pb-8 lg:mx-0 lg:max-w-none lg:px-8 lg:py-8 lg:pb-8'

export const sellerMainWithNav =
  'mx-auto w-full max-w-md px-4 pb-[calc(4.75rem+var(--safe-bottom))] pt-4 sm:px-5 lg:mx-0 lg:max-w-none lg:px-8 lg:py-8 lg:pb-8'

/** Main del catálogo: fondo verde a altura del área visible; el scroll va en sellerCatalogSection */
export const sellerMainCatalog =
  'mx-auto flex w-full max-w-md min-h-0 flex-1 flex-col overflow-hidden bg-brand-green p-0 lg:mx-0 lg:max-w-none'

export const sellerPageWrap = 'mx-auto w-full lg:max-w-3xl xl:max-w-4xl'

export const sellerFormGrid = 'grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 lg:gap-5'

export const sellerFormFull = 'lg:col-span-2'

export const sellerFormActions = 'pt-1 lg:col-span-2'

export const sellerEyebrow =
  'text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-carmelita sm:text-xs'

export const sellerTitle =
  'font-display text-xl font-bold leading-snug text-brand-green sm:text-2xl lg:text-3xl'

export const sellerSubtitle = 'mt-1 text-xs leading-relaxed text-brand-carmelita/90 sm:text-sm'

export const sellerEyebrowOnDark =
  'text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-white/60 sm:text-xs'

export const sellerTitleOnDark =
  'font-display text-xl font-bold leading-snug text-brand-white sm:text-2xl lg:text-3xl'

export const sellerSubtitleOnDark =
  'mt-1 text-xs leading-relaxed text-brand-white/75 sm:text-sm'

/** Contenido scrolleable del catálogo (el verde lo pone sellerMainCatalog) */
export const sellerCatalogSection =
  'seller-catalog-scroll flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain touch-pan-y px-4 pt-4 pb-[calc(4.75rem+var(--safe-bottom))] sm:px-5 lg:overflow-y-auto lg:px-8 lg:pb-8 lg:pt-8'

export const sellerSection =
  'rounded-2xl border border-brand-green/12 bg-brand-white p-3.5 shadow-[0_2px_12px_rgba(89,128,44,0.06)] sm:p-4'

export const sellerSectionGap = 'flex flex-col gap-3 sm:gap-4'

export const sellerModalTitle =
  'font-display text-xl font-bold text-brand-green sm:text-2xl'

export const sellerLabel = 'text-xs font-semibold text-brand-green sm:text-sm'

export const sellerHint = 'text-[0.7rem] leading-relaxed text-brand-carmelita/75 sm:text-xs'

export const sellerAlertSuccess =
  'rounded-xl border border-brand-green/20 bg-brand-green/8 px-3 py-2.5 text-center text-xs font-medium text-brand-green sm:text-sm'

export const sellerComingSoon =
  'rounded-xl border border-brand-yellow/25 bg-brand-yellow/15 px-3 py-2.5 text-xs font-medium leading-relaxed text-brand-green'

export const sellerStatCard =
  'rounded-2xl border border-brand-green/10 bg-brand-green/[0.03] px-3 py-3 text-center'

export const sellerFocusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-white'

export const sellerInput =
  'w-full min-h-10 rounded-xl border border-brand-green/15 bg-brand-white px-3 py-2.5 text-sm text-brand-green placeholder:text-brand-carmelita/45 focus:border-brand-green/35 focus:outline-none focus:ring-2 focus:ring-brand-green/10'

/** Inputs dentro de modales: 16px en móvil evita zoom de Safari iOS */
export const sellerModalInput =
  'w-full min-h-10 rounded-xl border border-brand-green/15 bg-brand-white px-3 py-2.5 text-base text-brand-green placeholder:text-brand-carmelita/45 focus:border-brand-green/35 focus:outline-none focus:ring-2 focus:ring-brand-green/10 sm:text-sm'

export const sellerTextarea = `${sellerInput} min-h-[5.5rem] resize-y py-2.5`

export const sellerModalTextarea = `${sellerModalInput} min-h-[5.5rem] resize-y py-2.5`

export const sellerChip = (active) =>
  `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors touch-manipulation ${
    active
      ? 'border-brand-green bg-brand-green text-brand-white'
      : 'border-brand-green/18 bg-brand-white text-brand-green active:bg-brand-yellow/15'
  }`

export const sellerChoice = (active) =>
  `min-h-10 rounded-xl border px-3 text-sm font-semibold transition-colors touch-manipulation ${
    active
      ? 'border-brand-green bg-brand-green text-brand-white'
      : 'border-brand-green/18 text-brand-green active:bg-brand-yellow/10'
  }`

export const sellerStickyBar =
  'fixed inset-x-0 bottom-0 z-30 border-t border-brand-green/10 bg-brand-white/95 px-4 py-3 backdrop-blur-md pb-[max(0.75rem,var(--safe-bottom))] sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none'

export const sellerAlertError =
  'rounded-xl border border-brand-carmelita/15 bg-brand-carmelita/8 px-3 py-2.5 text-center text-xs text-brand-carmelita sm:text-sm'

export const sellerBtnPrimary =
  `flex min-h-10 w-full items-center justify-center rounded-full bg-brand-green px-4 py-2.5 text-sm font-semibold text-brand-white shadow-[0_4px_14px_rgba(89,128,44,0.25)] transition-transform touch-manipulation active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${sellerFocusRing}`

/** Primario compacto en desktop (toolbar, etc.) */
export const sellerBtnPrimaryCompact =
  `${sellerBtnPrimary} lg:w-auto lg:min-w-[11rem]`

export const sellerBtnSecondary =
  `flex min-h-10 w-full items-center justify-center rounded-full border border-brand-green/22 bg-brand-white px-4 py-2.5 text-sm font-semibold text-brand-green transition-colors touch-manipulation active:bg-brand-yellow/10 disabled:opacity-60 ${sellerFocusRing}`

export const sellerBtnGhost =
  'flex min-h-9 w-full items-center justify-center rounded-full px-3 py-2 text-xs font-semibold text-brand-carmelita/85 touch-manipulation active:text-brand-carmelita'

export const sellerBtnDanger =
  `${sellerBtnPrimary} !bg-brand-carmelita !shadow-[0_4px_14px_rgba(123,76,56,0.22)]`

/** Tarjeta hero del perfil (vista previa + foto) */
export const sellerProfileHero =
  'relative overflow-hidden rounded-3xl border border-brand-green/12 bg-gradient-to-b from-brand-green/[0.07] via-brand-white to-brand-white p-5 shadow-[0_4px_24px_rgba(89,128,44,0.08)] sm:p-6'

export const sellerProfileHeroPattern =
  'pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-yellow/15 blur-2xl'

/** Título de grupo de campos (fuera de la tarjeta) */
export const sellerFieldGroupTitle = 'font-display text-sm font-bold text-brand-green sm:text-base'

export const sellerFieldGroupDesc = 'mt-0.5 text-xs leading-relaxed text-brand-carmelita/80'

export const sellerFieldGroupWrap = 'flex flex-col gap-2.5 sm:gap-3'

/** Campo solo lectura (nombre de tienda, etc.) */
export const sellerReadOnlyField =
  'flex min-h-10 items-center gap-2.5 rounded-xl border border-brand-green/10 bg-brand-green/[0.03] px-3 py-2.5 text-sm font-medium text-brand-green'

export const sellerCharCounter = 'text-right text-[0.65rem] tabular-nums text-brand-carmelita/70'

/** Input con prefijo (@, icono) */
export const sellerInputPrefixWrap =
  'flex min-h-10 overflow-hidden rounded-xl border border-brand-green/15 bg-brand-white focus-within:border-brand-green/35 focus-within:ring-2 focus-within:ring-brand-green/10'

export const sellerInputPrefix =
  'flex shrink-0 items-center border-r border-brand-green/10 bg-brand-green/[0.04] px-3 text-sm font-medium text-brand-carmelita/80'

export const sellerInputBare =
  'min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-brand-green placeholder:text-brand-carmelita/45 focus:outline-none'

/** Badge de estado en hero del perfil */
export const sellerProfileBadge = (active = true) =>
  `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${
    active
      ? 'bg-brand-green/12 text-brand-green'
      : 'bg-brand-carmelita/8 text-brand-carmelita/75'
  }`

/** Tarjeta de ubicación seleccionada */
export const sellerLocationCard =
  'flex items-start gap-2.5 rounded-xl border border-brand-green/12 bg-brand-green/[0.04] px-3 py-2.5'

/** Divisor dentro de una sección */
export const sellerSectionDivider = 'my-3 border-t border-brand-green/8 sm:my-4'

/** Catálogo vendedor */
export const sellerCatalogCategoryCard =
  'overflow-hidden rounded-2xl border border-brand-green/12 bg-brand-white shadow-[0_2px_14px_rgba(89,128,44,0.06)]'

export const sellerCatalogAddProductZone =
  'flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-green/22 bg-brand-green/[0.02] px-3 py-2.5 text-sm font-semibold text-brand-green transition-colors touch-manipulation active:border-brand-green/35 active:bg-brand-yellow/10'

export const sellerCatalogProductRow =
  'flex items-center gap-2 py-2.5 first:pt-0 last:pb-0'

export const sellerCatalogFab =
  `flex h-14 w-14 items-center justify-center rounded-full bg-brand-yellow text-brand-green shadow-[0_6px_24px_rgba(0,0,0,0.28)] transition-transform duration-200 touch-manipulation active:scale-95 ${sellerFocusRing}`

export const sellerCatalogFabAction =
  `flex items-center gap-2 rounded-full border border-brand-green/12 bg-brand-white px-4 py-2.5 text-sm font-semibold text-brand-green shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-colors touch-manipulation active:bg-brand-yellow/25 ${sellerFocusRing}`

export const sellerCheckboxRow =
  'flex cursor-pointer items-start gap-3 rounded-xl border border-brand-green/12 bg-brand-green/[0.02] px-3 py-3 touch-manipulation has-[:checked]:border-brand-green/25 has-[:checked]:bg-brand-green/[0.05]'

export const sellerCheckboxInput =
  'mt-0.5 h-4 w-4 shrink-0 rounded border-brand-green/25 text-brand-green focus:ring-brand-green/20'

export const sellerCatalogProductCard =
  'overflow-hidden rounded-2xl border border-brand-green/12 bg-brand-white shadow-[0_2px_10px_rgba(89,128,44,0.05)]'

export const sellerCatalogProductBadge =
  'inline-flex rounded-full bg-brand-green/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-brand-green'

export const sellerCatalogProductBadgeMuted =
  'inline-flex rounded-full bg-brand-carmelita/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.06em] text-brand-carmelita/85'

export const sellerIconBtn =
  `flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-green/12 bg-brand-white text-brand-green transition-colors touch-manipulation active:bg-brand-yellow/15 active:border-brand-green/25 ${sellerFocusRing}`

export const sellerIconBtnDanger =
  `flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-carmelita/15 bg-brand-white text-brand-carmelita/70 transition-colors touch-manipulation active:bg-brand-carmelita/10 active:text-brand-carmelita ${sellerFocusRing}`

/** Overlay/modal fuera del scroll del shell (portal en document.body) */
export const sellerModalOverlay =
  'fixed inset-0 z-[200] flex items-end justify-center bg-brand-green/25 p-0 backdrop-blur-[3px] sm:items-center sm:p-4'

export const sellerModalSheet =
  'relative flex w-full max-w-md max-h-[min(92dvh,760px)] min-h-0 animate-fade-in flex-col overflow-hidden rounded-t-3xl border border-brand-green/12 bg-brand-white shadow-[0_24px_60px_rgba(89,128,44,0.22)] sm:rounded-3xl'

export const sellerModalBody =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4'

export const sellerModalFooter =
  'shrink-0 border-t border-brand-green/8 px-5 py-4 pb-[max(1rem,var(--safe-bottom))]'

export const sellerNotificationsOverlay =
  'fixed inset-0 z-[200] flex items-end justify-center bg-brand-green/20 p-0 backdrop-blur-[3px] sm:items-center sm:p-4'

export const sellerNotificationsPanel =
  'relative flex w-full max-w-md min-h-0 animate-fade-in flex-col overflow-hidden rounded-t-3xl border border-brand-green/12 bg-brand-white shadow-[0_24px_60px_rgba(89,128,44,0.2)] sm:max-h-[min(88dvh,40rem)] sm:rounded-3xl lg:max-w-lg'
