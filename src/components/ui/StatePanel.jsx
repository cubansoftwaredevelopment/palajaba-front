import Button from '../Button'
import { ETECSA_ERROR_MASCOT } from '../../constants/branding'
import { resolveStateMascotSize } from './stateIllustrationSizes'
import StateMascotImage from './StateMascotImage'

const shellByVariant = {
  buyer:
    'rounded-3xl border border-brand-carmelita/18 bg-gradient-to-b from-brand-carmelita/[0.07] to-brand-white px-5 py-7 text-center sm:px-6 lg:text-left',
  seller:
    'rounded-2xl border border-brand-carmelita/15 bg-brand-carmelita/6 px-5 py-6 text-center',
  admin:
    'rounded-2xl border border-brand-carmelita/22 bg-brand-carmelita/10 px-5 py-6 text-center',
  compact:
    'rounded-2xl border border-brand-carmelita/12 bg-brand-carmelita/6 px-4 py-4 text-center',
  fullscreen:
    'flex min-h-[50vh] flex-col items-center justify-center px-6 py-10 text-center',
}

const titleByVariant = {
  buyer: 'font-display text-lg font-bold text-brand-green sm:text-xl',
  seller: 'font-display text-base font-bold text-brand-green',
  admin: 'font-display text-base font-bold text-zinc-100',
  compact: 'text-sm font-semibold text-brand-green',
  fullscreen: 'font-display text-xl font-bold text-brand-green',
}

const messageByVariant = {
  buyer: 'mt-2 text-sm leading-relaxed text-brand-carmelita/90',
  seller: 'mt-2 text-sm leading-relaxed text-brand-carmelita/90',
  admin: 'mt-2 text-sm leading-relaxed text-zinc-300',
  compact: 'mt-1.5 text-xs leading-relaxed text-brand-carmelita/85 sm:text-sm',
  fullscreen: 'mt-2 max-w-sm text-sm leading-relaxed text-brand-carmelita/90',
}

const mascotSizeByVariant = {
  buyer: 'md',
  seller: 'md',
  admin: 'md',
  compact: 'sm',
  fullscreen: 'lg',
}

function StateIcon() {
  return (
    <div
      className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-carmelita/10 text-brand-carmelita lg:mx-0"
      aria-hidden="true"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 20h.01" strokeLinecap="round" />
        <path d="M8.5 8.5a4 4 0 017 0" strokeLinecap="round" />
        <path d="M5 5a9 9 0 0114 0" strokeLinecap="round" />
        <path d="M2 2l20 20" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default function StatePanel({
  variant = 'buyer',
  title,
  message,
  onRetry,
  retryLabel = 'Volver a intentar',
  retrying = false,
  serviceError = false,
  children,
  className = '',
}) {
  const shell = variant === 'fullscreen' ? shellByVariant.fullscreen : shellByVariant[variant] || shellByVariant.buyer
  const mascotSize = resolveStateMascotSize(mascotSizeByVariant[variant] || 'md')
  const showMascot = serviceError

  return (
    <div className={`${shell} ${className}`.trim()} role="alert">
      {showMascot ? (
        <StateMascotImage
          src={ETECSA_ERROR_MASCOT.src}
          size={mascotSize}
          className={`mx-auto ${variant !== 'compact' ? 'mb-1' : 'mb-2'} lg:mx-0`}
        />
      ) : variant !== 'compact' ? (
        <StateIcon />
      ) : null}
      {title ? (
        <p className={`${titleByVariant[variant] || titleByVariant.buyer} ${showMascot ? 'mt-4' : ''}`}>
          {title}
        </p>
      ) : null}
      {message ? <p className={messageByVariant[variant] || messageByVariant.buyer}>{message}</p> : null}
      {children}
      {onRetry ? (
        <div
          className={`flex flex-col gap-2 sm:flex-row ${
            variant === 'buyer' || variant === 'fullscreen'
              ? 'mt-5 justify-center lg:justify-start'
              : 'mt-4 justify-center'
          }`}
        >
          <Button
            type="button"
            variant={variant === 'admin' ? 'primary' : 'secondary'}
            className="w-full sm:w-auto"
            onClick={onRetry}
            disabled={retrying}
          >
            {retrying ? 'Reintentando…' : retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
