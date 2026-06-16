import { Link } from 'react-router-dom'
import BuyerJabaButton from './BuyerJabaButton'
import BuyerJabaPanel from './BuyerJabaPanel'
import {
  BuyerSellerReturnFooter,
  BuyerSellerReturnHeaderLink,
} from './BuyerSellerReturnLink'

export default function BuyerShell({ backTo, backLabel = 'Volver', headerStart = null, headerEnd = null, children }) {
  const showBackLink = Boolean(backTo) && !headerStart

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

      <header className="relative z-20 shrink-0 border-b border-brand-green/8 bg-brand-white/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 lg:px-10 lg:py-5">
          {headerStart ? (
            <div className="min-w-0 flex-1 pr-4">{headerStart}</div>
          ) : showBackLink ? (
            <Link
              to={backTo}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-brand-green transition-colors touch-manipulation active:bg-brand-green/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:hover:bg-brand-green/8"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {backLabel}
            </Link>
          ) : (
            <span className="w-10" aria-hidden="true" />
          )}
          <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
            {headerEnd}
            <BuyerSellerReturnHeaderLink />
            <BuyerJabaButton />
          </div>
        </div>
      </header>

      <div className="buyer-scroll relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y">
        <div className="mx-auto w-full max-w-md px-5 pb-[max(2rem,var(--safe-bottom))] pt-4 sm:px-6 lg:max-w-5xl lg:px-10 lg:pb-10 lg:pt-8">
          {children}
        </div>
      </div>

      <BuyerSellerReturnFooter />

      <BuyerJabaPanel />
    </main>
  )
}
