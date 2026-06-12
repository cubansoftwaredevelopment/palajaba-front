import { LOADING_MASCOT } from '../../constants/branding'

const SIZE_CLASS = {
  xs: 'h-14 w-14 sm:h-10 sm:w-10',
  sm: 'h-24 w-24 sm:h-16 sm:w-16',
  md: 'h-44 w-44 sm:h-32 sm:w-32',
  lg: 'h-52 w-52 sm:h-40 sm:w-40',
}

const SIZE_PX = {
  xs: 56,
  sm: 96,
  md: 176,
  lg: 208,
}

const VARIANT_CLASS = {
  inline: {
    wrap: 'flex flex-col items-center justify-center py-8 text-center',
    message: 'mt-3 text-sm text-brand-carmelita/80',
  },
  panel: {
    wrap: 'flex flex-col items-center justify-center rounded-2xl border border-brand-green/10 bg-brand-white px-4 py-8 text-center',
    message: 'mt-3 text-sm text-brand-carmelita/80',
  },
  compact: {
    wrap: 'flex flex-col items-center py-4 text-center',
    message: 'mt-2 text-xs text-brand-carmelita/80 sm:text-sm',
  },
  admin: {
    wrap: 'flex flex-col items-center py-8 text-center',
    message: 'mt-3 text-sm text-zinc-400',
  },
  fullscreen: {
    wrap: 'relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-brand-white px-6 text-center',
    message: 'mt-4 text-sm font-medium text-brand-carmelita/85',
  },
}

export default function LoadingState({
  message = 'Cargando…',
  variant = 'inline',
  size = 'md',
  className = '',
  showMessage = true,
}) {
  const styles = VARIANT_CLASS[variant] || VARIANT_CLASS.inline
  const sizeKey = SIZE_CLASS[size] ? size : 'md'
  const pixelSize = SIZE_PX[sizeKey] || SIZE_PX.md

  return (
    <div className={`${styles.wrap} ${className}`.trim()} role="status" aria-live="polite">
      <img
        src={LOADING_MASCOT.src}
        alt=""
        width={pixelSize}
        height={pixelSize}
        className={`${SIZE_CLASS[sizeKey]} animate-levitate object-contain`}
        decoding="async"
      />
      {showMessage && message ? (
        <p className={styles.message}>{message}</p>
      ) : (
        <span className="sr-only">{message}</span>
      )}
    </div>
  )
}
