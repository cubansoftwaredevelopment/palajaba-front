import { useState } from 'react'
import { Link } from 'react-router-dom'
import SectionRefreshMascot from '../../shared/componentes/SectionRefreshMascot.jsx'
import { usePullToRefresh } from '../../shared/componentes/usePullToRefresh.js'
import { useSectionRefreshing } from '../../session/useSectionSnapshot'
import Logo from '../../shared/componentes/Logo.jsx'
import SellerLogoutModal from '../../seller/componentes/SellerLogoutModal.jsx'
import { sellerFocusRing } from '../../seller/componentes/sellerStyles.js'

export default function GestorShell({
  backTo,
  backLabel = 'Volver',
  title,
  subtitle,
  onLogout,
  onPullRefresh = null,
  children,
}) {
  const { handlers: pullHandlers } = usePullToRefresh(onPullRefresh)
  const refreshing = useSectionRefreshing(onPullRefresh ? 'gestor' : null, onPullRefresh ? 'panel' : null)
  const [logoutOpen, setLogoutOpen] = useState(false)
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
                onClick={() => setLogoutOpen(true)}
                aria-label="Cerrar sesión"
                className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-carmelita/70 transition-colors touch-manipulation active:bg-brand-green/8 active:text-brand-green ${sellerFocusRing}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="page-scroll relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y" {...(onPullRefresh ? pullHandlers : {})}>
        <SectionRefreshMascot active={refreshing} />
        <div className="mx-auto w-full max-w-lg px-4 pt-5 pb-[max(1.25rem,var(--safe-bottom))] sm:px-5 sm:pt-6 sm:pb-[max(1.5rem,var(--safe-bottom))]">
          {children}
        </div>
      </div>
      {logoutOpen ? (
        <SellerLogoutModal
          onClose={() => setLogoutOpen(false)}
          onConfirm={() => {
            setLogoutOpen(false)
            onLogout()
          }}
        />
      ) : null}
    </main>
  )
}
