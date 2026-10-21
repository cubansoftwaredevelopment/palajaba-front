import { Link } from 'react-router-dom'
import Logo from '../Logo'

export default function GestorShell({
  backTo,
  backLabel = 'Volver',
  title,
  subtitle,
  onLogout,
  children,
}) {
  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-brand-white">
      <div
        className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-brand-yellow/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-brand-green/10 blur-3xl"
        aria-hidden="true"
      />

      <header className="relative z-10 shrink-0 border-b border-brand-green/8 bg-brand-white/90 pt-[var(--safe-top)] backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Logo className="h-8 w-auto shrink-0" />
            {(title || subtitle) && (
              <div className="min-w-0">
                {title ? (
                  <p className="truncate font-display text-sm font-bold text-brand-green">{title}</p>
                ) : null}
                {subtitle ? (
                  <p className="truncate text-xs text-brand-carmelita/80">{subtitle}</p>
                ) : null}
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {backTo ? (
              <Link
                to={backTo}
                className="text-xs font-semibold text-brand-carmelita/80 touch-manipulation active:text-brand-green"
              >
                {backLabel}
              </Link>
            ) : null}
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-brand-green/18 px-3 py-1.5 text-xs font-semibold text-brand-green touch-manipulation active:bg-brand-yellow/15"
              >
                Salir
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="page-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y">
        <div className="mx-auto w-full max-w-lg px-4 pt-5 pb-[max(1.25rem,var(--safe-bottom))] sm:px-5 sm:pt-6 sm:pb-[max(1.5rem,var(--safe-bottom))]">
          {children}
        </div>
      </div>
    </main>
  )
}
