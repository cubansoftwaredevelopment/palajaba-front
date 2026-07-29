/** Estilos del área comprador (onboarding de ubicación y marketplace) */

export const buyerPageIntro =
  'mb-6 lg:mb-8 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-10'

export const buyerList =
  'flex flex-col gap-2.5 sm:gap-3 lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-2'

export const buyerListSingleCol =
  'flex flex-col gap-2.5 sm:gap-3 lg:max-w-2xl'

export const buyerSearchInput =
  'w-full min-h-11 rounded-2xl border border-brand-green/15 bg-brand-white px-4 py-2.5 text-sm text-brand-green placeholder:text-brand-carmelita/45 focus:border-brand-green/35 focus:outline-none focus:ring-2 focus:ring-brand-green/10'

export const buyerProvinceRow =
  'flex w-full items-center gap-4 rounded-2xl border border-brand-green/12 bg-brand-white px-4 py-3.5 text-left shadow-[0_2px_12px_rgba(89,128,44,0.06)] transition-colors touch-manipulation active:border-brand-green/25 active:bg-brand-yellow/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/20 lg:px-5 lg:py-4 lg:shadow-[0_4px_18px_rgba(89,128,44,0.08)] lg:hover:border-brand-green/22 lg:hover:bg-brand-green/[0.02]'

export const buyerProvinceImage =
  'h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-brand-green/12 sm:h-16 sm:w-16'

export const buyerProvinceName =
  'min-w-0 flex-1 font-display text-base font-bold text-brand-green sm:text-lg'

export const buyerMunicipalityRow =
  'flex w-full items-center gap-3 rounded-2xl border border-brand-green/12 bg-brand-white px-3.5 py-3 text-left transition-colors touch-manipulation active:border-brand-green/25 active:bg-brand-yellow/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/20 lg:px-4 lg:py-3.5 lg:hover:border-brand-green/22 lg:hover:bg-brand-green/[0.02]'

export const buyerMunicipalityMonogram =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-green/10 font-display text-sm font-bold text-brand-green'

export const buyerMunicipalityName =
  'min-w-0 flex-1 text-sm font-semibold text-brand-green sm:text-base'

export const buyerContextChip =
  'inline-flex items-center gap-2 rounded-full border border-brand-green/15 bg-brand-green/[0.06] px-3 py-1.5 text-xs font-semibold text-brand-green'

export const buyerHeaderLocationRoot =
  'flex min-w-0 items-center gap-3'

export const buyerHeaderLocationImage =
  'h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-brand-green/12 lg:h-12 lg:w-12'

export const buyerHeaderLocationTitle =
  'truncate font-display text-base font-bold leading-tight text-brand-green lg:text-lg'

export const buyerHeaderLocationProvince =
  'truncate text-xs font-semibold text-brand-carmelita/80 lg:text-sm'

export const buyerCurrencyTrigger =
  'inline-flex min-h-10 items-center gap-1.5 rounded-full border border-brand-green/15 bg-brand-white px-3 py-2 text-brand-green shadow-[0_2px_10px_rgba(89,128,44,0.08)] transition-colors touch-manipulation active:bg-brand-yellow/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 lg:min-h-11 lg:px-3.5'

export const buyerCurrencyPanel =
  'min-w-[10.5rem] overflow-hidden rounded-2xl border border-brand-green/12 bg-brand-white py-1 shadow-[0_12px_32px_rgba(89,128,44,0.16)]'

export const buyerCurrencyOption = (active) =>
  `flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left text-sm text-brand-green transition-colors touch-manipulation ${
    active ? 'bg-brand-green/[0.08] font-semibold' : 'active:bg-brand-yellow/10 lg:hover:bg-brand-green/[0.04]'
  }`

export const buyerCapitalBadge =
  'shrink-0 rounded-full bg-brand-yellow/25 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.06em] text-brand-green'

export const buyerProductGrid =
  'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4'

export const buyerHomeSections = 'flex min-w-0 flex-col gap-7 sm:gap-8'

export const buyerCatalogPoweredFooter =
  '-mx-5 mt-6 -mb-[max(2rem,var(--safe-bottom))] sm:-mx-6 sm:mt-8 lg:-mx-10 lg:-mb-10'

export const buyerCatalogPoweredFooterShell =
  'relative w-full border-t border-brand-green/12 bg-gradient-to-b from-brand-yellow/10 via-brand-white to-brand-green/[0.03] px-5 py-4 pb-[max(1rem,var(--safe-bottom))] sm:px-6 sm:py-5 sm:pb-[max(1.25rem,var(--safe-bottom))] lg:px-10 lg:py-6 lg:pb-6'

export const buyerCatalogPoweredFooterEyebrow =
  'mb-1 inline-flex items-center rounded-full border border-brand-green/12 bg-brand-white/70 px-2.5 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-brand-carmelita/80'

export const buyerCatalogPoweredFooterTitle =
  'font-display text-base font-bold leading-snug text-brand-green sm:text-xl lg:text-2xl'

export const buyerCatalogPoweredFooterSubtitle =
  'mt-1 text-xs leading-relaxed text-brand-carmelita/85 sm:mt-1.5 sm:max-w-md sm:text-sm'

export const buyerCatalogPoweredFooterCta =
  'inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand-green px-4 text-xs font-semibold text-brand-white shadow-[0_4px_16px_rgba(89,128,44,0.22)] transition-all touch-manipulation active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 sm:min-h-11 sm:w-auto sm:px-5 sm:text-sm lg:hover:-translate-y-px lg:hover:bg-[#4d7026]'

export const buyerCategorySectionTitle =
  'font-display text-lg font-bold text-brand-green sm:text-xl'

export const buyerProductRowWrap = 'relative min-w-0 overflow-hidden'

export const buyerProductRow =
  'flex touch-manipulation gap-3 overflow-x-auto overscroll-x-contain py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'

export const buyerProductRowFade =
  'pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-brand-white via-brand-white/95 to-transparent sm:w-20'

export const buyerProductRowFadeLeft =
  'pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-brand-white via-brand-white/95 to-transparent sm:w-20'

export const buyerProductRowArrow =
  'absolute right-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-brand-green/15 bg-brand-white text-brand-green shadow-[0_4px_14px_rgba(89,128,44,0.14)] transition-[transform,background-color,box-shadow] duration-200 touch-manipulation active:scale-95 active:bg-brand-yellow/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:h-10 sm:w-10 lg:hover:-translate-y-1/2 lg:hover:scale-105 lg:hover:shadow-[0_6px_18px_rgba(89,128,44,0.18)]'

export const buyerProductRowArrowLeft =
  'absolute left-0 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-brand-green/15 bg-brand-white text-brand-green shadow-[0_4px_14px_rgba(89,128,44,0.14)] transition-[transform,background-color,box-shadow] duration-200 touch-manipulation active:scale-95 active:bg-brand-yellow/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:h-10 sm:w-10 lg:hover:-translate-y-1/2 lg:hover:scale-105 lg:hover:shadow-[0_6px_18px_rgba(89,128,44,0.18)]'

export const buyerProductRowItem =
  'w-[11rem] shrink-0 snap-start sm:w-[11.5rem]'

export const buyerProductCard =
  'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-green/10 bg-brand-white shadow-[0_3px_16px_rgba(89,128,44,0.07)] transition-shadow touch-manipulation sm:hover:shadow-[0_6px_22px_rgba(89,128,44,0.11)]'

export const buyerProductCardCompact = `${buyerProductCard} w-full`

export const buyerProductImageWrap =
  'relative aspect-[5/6] w-full overflow-hidden bg-gradient-to-b from-brand-green/[0.03] to-brand-green/[0.07]'

export const buyerProductImageSpinner =
  'h-8 w-8 animate-spin rounded-full border-2 border-brand-green/20 border-t-brand-green'

export const buyerProductImagePlaceholder =
  'flex h-full w-full items-center justify-center text-[0.65rem] font-semibold text-brand-carmelita/45'

export const buyerProductPickupRibbon =
  'absolute left-0 top-0 z-[1] flex max-w-[85%] items-center gap-1 rounded-br-xl bg-brand-carmelita px-2 py-1 text-[0.58rem] font-bold leading-none text-brand-white shadow-[0_2px_8px_rgba(123,76,56,0.35)] sm:text-[0.62rem]'

export const buyerProductPickupHint =
  'mt-1 flex items-center gap-1 text-[0.58rem] font-semibold leading-tight text-brand-carmelita sm:text-[0.62rem]'

export const buyerExpandSearchRoot =
  'min-w-0'

export const buyerExpandSearchTrigger = (active) =>
  `flex w-full min-h-8 items-center gap-2 rounded-full border px-2.5 py-1 text-left transition-[background-color,border-color,box-shadow] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/20 sm:min-h-9 sm:gap-2.5 sm:px-3.5 ${
    active
      ? 'border-brand-green/28 bg-brand-yellow/12 shadow-[0_1px_6px_rgba(89,128,44,0.08)]'
      : 'border-dashed border-brand-green/18 bg-brand-green/[0.02] active:bg-brand-yellow/8 lg:hover:border-brand-green/26 lg:hover:bg-brand-green/[0.04]'
  }`

export const buyerExpandSearchTriggerIcon =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow/22 text-brand-green sm:h-7 sm:w-7'

export const buyerExpandSearchTriggerTitle =
  'min-w-0 flex-1 truncate text-[0.72rem] font-semibold text-brand-green sm:text-xs'

export const buyerExpandSearchTriggerMeta =
  'shrink-0 rounded-full bg-brand-green px-1.5 py-0.5 text-[0.58rem] font-bold leading-none text-brand-white'

export const buyerExpandSearchPanel =
  'mt-2 rounded-2xl border border-brand-green/10 bg-brand-white px-3 py-3 shadow-[0_4px_16px_rgba(89,128,44,0.06)] sm:px-3.5'

export const buyerExpandSearchChip = (active) =>
  `min-h-8 rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:min-h-9 sm:px-3 sm:text-xs ${
    active
      ? 'border-brand-green bg-brand-green text-brand-white shadow-[0_2px_8px_rgba(89,128,44,0.18)]'
      : 'border-brand-green/16 bg-brand-white text-brand-green active:bg-brand-yellow/10 lg:hover:border-brand-green/24 lg:hover:bg-brand-green/[0.03]'
  }`

export const buyerProductBody = 'flex min-h-0 flex-1 flex-col px-2 pb-2 pt-1.5'

export const buyerProductName =
  'line-clamp-2 font-display text-[0.82rem] font-bold leading-snug text-brand-green sm:text-[0.9rem]'

export const buyerProductPrice =
  'mt-1 text-[0.72rem] font-semibold leading-none text-brand-green sm:text-[0.78rem]'

export const buyerProductStore =
  'mt-1.5 truncate text-[0.62rem] font-semibold text-brand-carmelita underline-offset-2 transition-colors touch-manipulation hover:text-brand-green hover:underline focus-visible:text-brand-green focus-visible:underline focus-visible:outline-none'

export const buyerProductActions =
  'mt-2 flex flex-col gap-1.5'

export const buyerProductBtnBuy =
  'flex min-h-9 w-full items-center justify-center rounded-xl bg-brand-green px-2 text-[0.68rem] font-bold leading-none text-brand-white shadow-[0_3px_10px_rgba(89,128,44,0.22)] transition-transform touch-manipulation active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 sm:min-h-10 sm:text-[0.72rem]'

export const buyerProductBtnJaba =
  'flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-brand-green/22 bg-transparent px-2 text-[0.62rem] font-semibold leading-none text-brand-green transition-[transform,background-color,border-color] touch-manipulation active:scale-[0.97] active:bg-brand-green/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:min-h-10 sm:text-[0.65rem]'

export const buyerProductBtnJabaActive =
  'flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-brand-green/30 bg-brand-green/[0.08] px-2 text-[0.62rem] font-semibold leading-none text-brand-green transition-[transform,background-color,border-color] touch-manipulation active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:min-h-10 sm:text-[0.65rem]'

export const buyerProductBadge =
  'mt-2 inline-flex w-fit rounded-full bg-brand-yellow/20 px-2 py-0.5 text-[0.6rem] font-bold text-brand-green'

export const buyerProductSoldOutVeil =
  'pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-brand-carmelita/55'

export const buyerProductSoldOutImageVeil =
  'pointer-events-none absolute inset-0 flex items-center justify-center bg-brand-carmelita/35'

export const buyerProductSoldOutBadge =
  'rounded-xl border-2 border-brand-white/90 bg-brand-carmelita px-3.5 py-2 text-center font-display text-xs font-bold uppercase leading-none tracking-[0.16em] text-brand-white shadow-[0_8px_24px_rgba(123,76,56,0.45)] sm:px-4 sm:py-2.5 sm:text-sm'

export const buyerJabaTrigger =
  'relative inline-flex shrink-0 items-center justify-center rounded-2xl transition-transform touch-manipulation active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25'

export const buyerJabaBadge =
  'absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1 text-[0.62rem] font-bold leading-none text-brand-white shadow-[0_2px_8px_rgba(89,128,44,0.35)]'

export const buyerJabaOverlay =
  'fixed inset-0 z-[70] bg-brand-green/20 backdrop-blur-[2px]'

export const buyerJabaPanel =
  'fixed inset-x-0 bottom-0 z-[80] flex max-h-[min(88dvh,42rem)] flex-col rounded-t-[1.75rem] border border-brand-green/10 bg-brand-white shadow-[0_-12px_40px_rgba(89,128,44,0.18)] sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-4 sm:w-[min(24rem,calc(100vw-2rem))] sm:max-h-none sm:rounded-3xl lg:right-6 lg:w-[26rem]'

export const buyerJabaPanelHeader =
  'flex shrink-0 items-center justify-between gap-3 border-b border-brand-green/8 px-5 py-4'

export const buyerJabaPanelTitle =
  'font-display text-lg font-bold text-brand-green'

export const buyerJabaPanelBody =
  'min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4'

export const buyerJabaStoreSection =
  'rounded-2xl border border-brand-green/10 bg-brand-green/[0.02] p-3.5'

export const buyerJabaStoreTitle =
  'font-display text-sm font-bold text-brand-green'

export const buyerJabaItemRow =
  'flex items-start gap-3 border-t border-brand-green/8 py-3 first:border-t-0 first:pt-0'

export const buyerJabaItemImage =
  'h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-green/[0.06] object-cover'

export const buyerJabaQtyBtn =
  'flex h-7 w-7 items-center justify-center rounded-full border border-brand-green/15 text-sm font-bold text-brand-green transition-colors touch-manipulation active:bg-brand-yellow/20 lg:hover:bg-brand-green/[0.06]'

export const buyerJabaWhatsAppBtn =
  'mt-3 flex w-full min-h-10 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white shadow-[0_4px_14px_rgba(37,211,102,0.28)] transition-transform touch-manipulation active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'

export const buyerJabaDeliveryBtn =
  'flex w-full min-h-10 items-center justify-center gap-2 rounded-xl border border-brand-green/20 bg-brand-green/[0.06] px-4 text-sm font-bold text-brand-green transition-transform touch-manipulation active:scale-[0.98] active:bg-brand-yellow/15 lg:hover:bg-brand-green/[0.1]'

export const buyerJabaCheckoutActions = 'mt-3 grid gap-2'

export const buyerJabaSyncOverlay =
  'fixed inset-0 z-[95] flex items-end justify-center bg-brand-green/25 p-0 backdrop-blur-[3px] sm:items-center sm:p-4'

export const buyerJabaSyncModal =
  'relative flex w-full max-w-md min-h-0 max-h-[min(92dvh,44rem)] animate-fade-in flex-col overflow-hidden rounded-t-3xl border border-brand-green/12 bg-brand-white shadow-[0_24px_60px_rgba(89,128,44,0.22)] sm:max-h-[min(88dvh,40rem)] sm:rounded-3xl lg:max-w-lg'

export const buyerJabaSyncHeader = 'shrink-0 px-5 pt-3'

export const buyerJabaSyncBody = 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pb-2'

export const buyerJabaSyncHero = 'text-center'

export const buyerJabaSyncHeroImage =
  'relative mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-yellow/18 ring-1 ring-brand-yellow/30'

export const buyerJabaSyncCountBadge =
  'absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-carmelita px-1.5 text-[0.68rem] font-bold leading-none text-brand-white shadow-[0_4px_12px_rgba(123,76,56,0.35)]'

export const buyerJabaSyncTitle = 'mt-2 font-display text-xl font-bold leading-snug text-brand-green sm:text-[1.35rem]'

export const buyerJabaSyncSubtitle = 'mt-2 text-sm leading-relaxed text-brand-carmelita/90'

export const buyerJabaSyncSummary =
  'mt-3 rounded-2xl border border-brand-green/10 bg-brand-green/[0.04] px-3.5 py-2.5 text-sm font-medium text-brand-green'

export const buyerJabaSyncList = 'mt-5 space-y-2.5'

export const buyerJabaSyncItem =
  'flex items-start gap-3 rounded-2xl border border-brand-green/10 bg-brand-white px-3.5 py-3 shadow-[0_2px_10px_rgba(89,128,44,0.05)]'

export const buyerJabaSyncItemIcon =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl'

export const buyerJabaSyncItemName = 'font-display text-sm font-bold leading-snug text-brand-green'

export const buyerJabaSyncItemBadge =
  'mt-1 inline-flex rounded-full px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.06em]'

export const buyerJabaSyncItemMessage = 'mt-1.5 text-sm leading-snug text-brand-carmelita/85'

export const buyerJabaSyncFooter =
  'shrink-0 flex flex-col gap-2 border-t border-brand-green/8 bg-brand-white/95 px-5 py-4 pb-[max(1rem,var(--safe-bottom))] backdrop-blur-sm'

export const buyerDeliveryOverlay =
  'fixed inset-0 z-[90] bg-brand-green/25 backdrop-blur-[2px]'

export const buyerDeliveryModal =
  'fixed inset-x-3 bottom-3 top-auto z-[100] flex max-h-[min(90dvh,40rem)] flex-col rounded-3xl border border-brand-green/10 bg-brand-white shadow-[0_16px_48px_rgba(89,128,44,0.2)] sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-[min(24rem,calc(100vw-2rem))] sm:max-h-[min(88dvh,40rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 lg:w-[26rem]'

export const buyerDeliveryModalHeader =
  'shrink-0 border-b border-brand-green/8 px-5 py-4'

export const buyerDeliveryModalBody =
  'min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4'

export const buyerDeliveryModalFooter =
  'shrink-0 flex flex-col gap-2 border-t border-brand-green/8 px-5 py-4'

export const buyerDeliveryFieldLabel =
  'mb-1 block text-xs font-semibold text-brand-green sm:text-sm'

export const buyerDeliveryInput =
  'w-full min-h-11 rounded-xl border border-brand-green/15 bg-brand-white px-3.5 py-2.5 text-sm text-brand-green placeholder:text-brand-carmelita/45 focus:border-brand-green/35 focus:outline-none focus:ring-2 focus:ring-brand-green/10'

export const buyerDeliveryTextarea =
  'w-full min-h-[5.5rem] resize-y rounded-xl border border-brand-green/15 bg-brand-white px-3.5 py-2.5 text-sm text-brand-green placeholder:text-brand-carmelita/45 focus:border-brand-green/35 focus:outline-none focus:ring-2 focus:ring-brand-green/10'

export const buyerProductDetailOverlay =
  'fixed inset-0 z-[85] flex items-end justify-center bg-brand-green/25 p-0 backdrop-blur-[3px] sm:items-center sm:p-4'

export const buyerProductDetailModal =
  'relative flex w-full max-w-md min-h-0 animate-fade-in flex-col overflow-hidden rounded-t-3xl border border-brand-green/12 bg-brand-white shadow-[0_24px_60px_rgba(89,128,44,0.22)] sm:max-h-[min(92dvh,44rem)] sm:rounded-3xl lg:max-w-lg'

export const buyerProductDetailBody =
  'min-h-0 flex-1 overflow-y-auto overscroll-y-contain'

export const buyerProductDetailHero =
  'bg-gradient-to-b from-brand-green/[0.04] to-brand-white px-5 pb-4 pt-1'

export const buyerProductDetailHeroImage =
  'relative mx-auto aspect-[4/5] w-full max-w-[11rem] overflow-hidden rounded-2xl bg-brand-white shadow-[0_8px_28px_rgba(89,128,44,0.12)] ring-1 ring-brand-green/10 sm:max-w-[12rem]'

export const buyerProductDetailPrice =
  'font-display text-2xl font-bold leading-none text-brand-green sm:text-[1.65rem]'

export const buyerProductDetailName =
  'mt-2 font-display text-lg font-bold leading-snug text-brand-green sm:text-xl'

export const buyerProductDetailSectionTitle =
  'mb-2.5 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-brand-carmelita/75'

export const buyerProductDetailSpecGrid =
  'grid grid-cols-1 gap-2 sm:grid-cols-2'

export const buyerProductDetailSpecCard =
  'rounded-xl border border-brand-green/10 bg-brand-white px-3.5 py-3 shadow-[0_2px_8px_rgba(89,128,44,0.04)]'

export const buyerProductDetailSpecLabel =
  'text-[0.62rem] font-semibold uppercase tracking-[0.06em] text-brand-carmelita/70'

export const buyerProductDetailSpecValue =
  'mt-1 text-sm font-semibold leading-snug text-brand-green'

export const buyerProductDetailStickyBar =
  'shrink-0 border-t border-brand-green/10 bg-brand-white/95 px-5 py-3 pb-[max(0.85rem,var(--safe-bottom))] shadow-[0_-8px_24px_rgba(89,128,44,0.08)] backdrop-blur-md'

export const buyerMarketplaceNavShell =
  'fixed bottom-0 left-0 right-0 z-30 w-full max-w-[100dvw] border-t border-brand-green/10 bg-brand-white/95 shadow-[0_-4px_24px_rgba(89,128,44,0.08)] backdrop-blur-md pb-[max(0.375rem,var(--safe-bottom))]'

export function buyerMarketplaceNavItem(isActive) {
  return `flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 py-1.5 text-[0.625rem] font-semibold leading-none transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green/30 sm:text-xs ${
    isActive ? 'text-brand-green' : 'text-brand-carmelita/65 active:text-brand-green'
  }`
}

export const buyerMarketplaceScrollPadding =
  'pb-[calc(4.75rem+var(--safe-bottom))] lg:pb-[calc(5rem+var(--safe-bottom))]'

export const buyerProductDetailStickyPriceLabel =
  'text-[0.62rem] font-semibold uppercase tracking-[0.06em] text-brand-carmelita/70'

export const buyerProductDetailStickyPrice =
  'font-display text-lg font-bold text-brand-green'

export const buyerStoreStrip =
  'flex items-center gap-3 rounded-2xl border border-brand-green/12 bg-gradient-to-r from-brand-yellow/12 via-brand-white to-brand-green/[0.04] px-3 py-2.5 shadow-[0_2px_10px_rgba(89,128,44,0.05)]'

export const buyerStoreStripLink =
  `${buyerStoreStrip} transition-colors touch-manipulation active:border-brand-green/25 active:bg-brand-yellow/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 lg:hover:border-brand-green/22 lg:hover:bg-brand-yellow/8`

export const buyerStorePageHeader =
  'min-w-0 rounded-3xl border border-brand-green/12 bg-gradient-to-br from-brand-yellow/15 via-brand-white to-brand-green/[0.04] px-5 py-5 shadow-[0_4px_20px_rgba(89,128,44,0.07)]'

export const buyerStorePageAvatar =
  'flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-yellow/15 font-display text-lg font-bold text-brand-carmelita/75 ring-2 ring-brand-green/15 sm:h-20 sm:w-20'

export const buyerStorePageName =
  'font-display text-xl font-bold text-brand-green sm:text-2xl'

export const buyerStorePageBio =
  'mt-4 text-sm leading-relaxed text-brand-carmelita/90'

export const buyerStorePageSectionTitle =
  'text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-brand-carmelita/70'

export const buyerStorePageMeta =
  'rounded-2xl border border-brand-green/10 bg-brand-white/70 px-3.5 py-3'

export const buyerStorePageMetaLabel =
  'text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-brand-carmelita/70'

export const buyerStorePageMetaValue =
  'mt-1 text-sm font-semibold leading-snug text-brand-green'

export const buyerBusinessList =
  'grid min-w-0 grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3 lg:gap-5 xl:gap-6'

export const buyerBusinessCard =
  'flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-brand-green/12 bg-brand-white shadow-[0_4px_20px_rgba(89,128,44,0.07)]'

export const buyerBusinessCardImageWrap =
  'relative aspect-square w-full overflow-hidden bg-brand-yellow/10'

export const buyerBusinessCardImage =
  'h-full w-full object-cover'

export const buyerBusinessCardImageFallback =
  'flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-yellow/20 via-brand-white to-brand-green/[0.08] font-display text-4xl font-bold text-brand-carmelita/60 sm:text-5xl'

export const buyerBusinessCardBody = 'flex flex-1 flex-col gap-3 px-4 py-4 sm:px-5 sm:py-5'

export const buyerBusinessCardName =
  'font-display text-lg font-bold leading-tight text-brand-green sm:text-xl'

export const buyerBusinessCardLocation =
  'flex flex-col gap-0.5'

export const buyerBusinessCardMunicipality =
  'text-sm font-semibold text-brand-green sm:text-base'

export const buyerBusinessCardProvince =
  'text-xs font-semibold text-brand-carmelita/80 sm:text-sm'

export const buyerBusinessCardProductCount =
  'text-sm font-semibold text-brand-carmelita/90'

export const buyerBusinessCardCatalogBtn =
  'mt-auto flex min-h-11 w-full items-center justify-center rounded-full bg-brand-green px-5 text-sm font-semibold text-brand-white shadow-[0_6px_20px_rgba(89,128,44,0.28)] transition-all touch-manipulation active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 lg:hover:-translate-y-px lg:hover:bg-[#4d7026]'

export const buyerStorePageMapBtn =
  'inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-brand-green/20 bg-brand-green/[0.06] px-4 text-sm font-bold text-brand-green transition-colors touch-manipulation active:bg-brand-yellow/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:w-auto sm:shrink-0 lg:hover:bg-brand-green/[0.1]'

export const buyerStoreMapOverlay =
  'fixed inset-0 z-[70] bg-brand-green/25 backdrop-blur-[2px]'

export const buyerStoreMapModal =
  'fixed inset-x-3 top-[3dvh] z-[80] flex max-h-[94dvh] min-h-[min(94dvh,40rem)] flex-col overflow-hidden rounded-3xl border border-brand-green/10 bg-brand-white shadow-[0_16px_48px_rgba(89,128,44,0.2)] sm:inset-x-auto sm:left-1/2 sm:w-[min(36rem,calc(100vw-1.5rem))] sm:-translate-x-1/2'

export const buyerStoreMapModalBody =
  'flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-0'

export const buyerStoreMapModalHeader =
  'flex shrink-0 items-center justify-between gap-3 border-b border-brand-green/8 px-5 py-4'

export const buyerStorePageSocialLink =
  'inline-flex min-h-9 items-center rounded-full border border-brand-green/15 bg-brand-white px-3.5 text-xs font-bold text-brand-green transition-colors touch-manipulation active:bg-brand-yellow/15 lg:hover:bg-brand-green/[0.04]'

export const buyerStoreStripAvatar =
  'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-yellow/15 font-display text-sm font-bold text-brand-carmelita/75 ring-2 ring-brand-green/15'

export const buyerStoreStripName =
  'truncate font-display text-sm font-bold text-brand-green'

export const buyerStoreStripLabel =
  'text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-brand-carmelita/70'
