import { DEAD_MASCOT } from '../../constants/branding'

const SIZE_CLASS = {
  sm: 'h-48 w-48 sm:h-56 sm:w-56 lg:h-64 lg:w-64',
  md: 'h-56 w-56 sm:h-64 sm:w-64 lg:h-72 lg:w-72',
  lg: 'h-64 w-64 sm:h-72 sm:w-72 lg:h-80 lg:w-80',
}

const SIZE_PX = {
  sm: 256,
  md: 288,
  lg: 320,
}

const VARIANT_CLASS = {
  inline: {
    wrap: 'flex flex-col items-center justify-center py-8 text-center',
    title: 'font-display text-lg font-bold text-brand-green sm:text-xl',
    message: 'mt-2 max-w-md text-sm leading-relaxed text-brand-carmelita/90',
    actions: 'mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center',
  },
  panel: {
    wrap: 'flex flex-col items-center justify-center rounded-3xl border border-brand-carmelita/18 bg-gradient-to-b from-brand-carmelita/[0.07] to-brand-white px-5 py-8 text-center sm:px-6 lg:text-left lg:items-start',
    title: 'font-display text-lg font-bold text-brand-green sm:text-xl',
    message: 'mt-2 max-w-md text-sm leading-relaxed text-brand-carmelita/90 lg:max-w-none',
    actions: 'mt-5 flex w-full flex-col gap-2 sm:flex-row sm:justify-center lg:justify-start',
  },
  fullscreen: {
    wrap: 'flex min-h-dvh flex-col items-center justify-center bg-brand-white px-6 py-12 text-center',
    title: 'font-display text-2xl font-bold text-brand-green sm:text-3xl',
    message: 'mt-3 max-w-md text-sm leading-relaxed text-brand-carmelita/90 sm:text-base',
    actions: 'mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center',
  },
}

export default function DeadState({
  title,
  message,
  variant = 'inline',
  size = 'md',
  className = '',
  children,
}) {
  const styles = VARIANT_CLASS[variant] || VARIANT_CLASS.inline
  const sizeKey = SIZE_CLASS[size] ? size : 'md'
  const pixelSize = SIZE_PX[sizeKey] || SIZE_PX.md

  return (
    <div className={`${styles.wrap} ${className}`.trim()} role="alert">
      <img
        src={DEAD_MASCOT.src}
        alt=""
        width={pixelSize}
        height={pixelSize}
        className={`${SIZE_CLASS[sizeKey]} object-contain`}
        decoding="async"
      />
      {title ? <h1 className={`mt-4 ${styles.title}`}>{title}</h1> : null}
      {message ? <p className={styles.message}>{message}</p> : null}
      {children ? <div className={styles.actions}>{children}</div> : null}
    </div>
  )
}
