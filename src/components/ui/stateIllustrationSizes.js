export const STATE_MASCOT_SIZE_CLASS = {
  sm: 'h-48 w-48 sm:h-56 sm:w-56 lg:h-64 lg:w-64',
  md: 'h-56 w-56 sm:h-64 sm:w-64 lg:h-72 lg:w-72',
  lg: 'h-64 w-64 sm:h-72 sm:w-72 lg:h-80 lg:w-80',
}

export const STATE_MASCOT_SIZE_PX = {
  sm: 256,
  md: 288,
  lg: 320,
}

export const STATE_MASCOT_VARIANT_CLASS = {
  inline: {
    wrap: 'flex flex-col items-center justify-center py-8 text-center',
    title: 'font-display text-lg font-bold text-brand-green sm:text-xl',
    message: 'mt-2 max-w-md text-sm leading-relaxed text-brand-carmelita/90',
    actions: 'mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center',
    image: 'mt-0',
  },
  panel: {
    wrap: 'flex flex-col items-center justify-center rounded-3xl border border-brand-carmelita/18 bg-gradient-to-b from-brand-carmelita/[0.07] to-brand-white px-5 py-8 text-center sm:px-6 lg:text-left lg:items-start',
    title: 'font-display text-lg font-bold text-brand-green sm:text-xl',
    message: 'mt-2 max-w-md text-sm leading-relaxed text-brand-carmelita/90 lg:max-w-none',
    actions: 'mt-5 flex w-full flex-col gap-2 sm:flex-row sm:justify-center lg:justify-start',
    image: 'mt-0',
  },
  compact: {
    wrap: 'flex flex-col items-center rounded-2xl border border-brand-carmelita/12 bg-brand-carmelita/6 px-4 py-5 text-center',
    title: 'text-sm font-semibold text-brand-green',
    message: 'mt-1.5 text-xs leading-relaxed text-brand-carmelita/85 sm:text-sm',
    actions: 'mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center',
    image: 'mt-0',
  },
  fullscreen: {
    wrap: 'flex min-h-dvh flex-col items-center justify-center bg-brand-white px-6 py-12 text-center',
    title: 'font-display text-2xl font-bold text-brand-green sm:text-3xl',
    message: 'mt-3 max-w-md text-sm leading-relaxed text-brand-carmelita/90 sm:text-base',
    actions: 'mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center',
    image: 'mt-0',
  },
  admin: {
    wrap: 'flex flex-col items-center rounded-2xl border border-brand-carmelita/22 bg-brand-carmelita/10 px-5 py-8 text-center',
    title: 'font-display text-base font-bold text-zinc-100',
    message: 'mt-2 text-sm leading-relaxed text-zinc-300',
    actions: 'mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center',
    image: 'mt-0',
  },
}

export function resolveStateMascotSize(size) {
  return STATE_MASCOT_SIZE_CLASS[size] ? size : 'md'
}
