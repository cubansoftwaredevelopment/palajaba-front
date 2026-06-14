import { Link } from 'react-router-dom'
import Logo from '../Logo'

const CONTENT_WIDTH = {
  default: 'max-w-md lg:max-w-5xl',
  wide: 'max-w-md lg:max-w-5xl',
  narrow: 'max-w-md lg:max-w-2xl',
}

export default function AuthShell({
  backTo = '/',
  backLabel = 'Volver',
  children,
  wide = false,
  centered = false,
  contentWidth,
  hideLogo = false,
  hideHeader = false,
}) {
  const widthKey = contentWidth ?? (wide ? 'wide' : centered ? 'narrow' : 'default')
  const widthClass = CONTENT_WIDTH[widthKey] ?? CONTENT_WIDTH.default

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-brand-white">
      <div
        className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-brand-yellow/20 blur-3xl lg:h-72 lg:w-72"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-brand-green/10 blur-3xl lg:h-80 lg:w-80"
        aria-hidden="true"
      />

      {!hideHeader ? (
        <header className="relative z-10 shrink-0 border-b border-brand-green/8 bg-brand-white/90 backdrop-blur-sm">
          <div
            className={`mx-auto flex w-full max-w-5xl items-center px-5 py-4 lg:px-10 lg:py-4 ${
              hideLogo ? 'justify-start' : 'justify-between'
            }`}
          >
            <Link
              to={backTo}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-brand-green transition-colors touch-manipulation active:bg-brand-green/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:hover:bg-brand-green/8"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {backLabel}
            </Link>
            {!hideLogo ? <Logo className="h-9 w-9 lg:h-10 lg:w-10" /> : null}
          </div>
        </header>
      ) : null}

      <div className="auth-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y">
        <div
          className={`mx-auto flex w-full flex-col px-5 pb-[max(2rem,var(--safe-bottom))] sm:px-6 lg:px-10 lg:pb-10 ${
            hideHeader
              ? 'min-h-full justify-center pt-[max(1.5rem,var(--safe-top))]'
              : 'pt-4 lg:pt-6'
          } ${widthClass}`}
        >
          {children}
        </div>
      </div>
    </main>
  )
}
