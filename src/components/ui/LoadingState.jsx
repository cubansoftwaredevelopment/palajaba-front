import { LOADING_MASCOT } from '../../constants/branding'

const SIZE_CLASS = {
  xs: 'h-8 w-8',
  sm: 'h-14 w-14',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
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

  return (
    <div className={`${styles.wrap} ${className}`.trim()} role="status" aria-live="polite">
      <img
        src={LOADING_MASCOT.src}
        alt=""
        width={128}
        height={128}
        className={`${SIZE_CLASS[size] || SIZE_CLASS.md} animate-levitate object-contain`}
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
