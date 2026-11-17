import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { BuyerDisplayCurrencyContext } from '../context.js'
import BuyerCurrencyTag from './BuyerCurrencyTag'
import BuyerHeaderTools from './BuyerHeaderTools'
import BuyerJabaPanel from './BuyerJabaPanel'
import { buyerMarketplaceScrollPadding } from './buyerStyles'
import {
  BuyerSellerReturnFooter,
  BuyerSellerReturnHeaderLink,
} from './BuyerSellerReturnLink'
import { useBuyerMarketplaceHub } from '../../lib/buyerMarketplaceHub'
import { isSellerBrowsingMarketplace } from '../../lib/sellerMarketplaceNav'

export default function BuyerShell({
  mode = 'default',
  backTo,
  backLabel = 'Volver',
  onBack = null,
  headerStart = null,
  headerMeta = null,
  headerEnd = null,
  headerSearch = null,
  headerLayout = 'row',
  flushBottom = false,
  footer = null,
  children,
}) {
  const showBackLink = Boolean(backTo || onBack) && !headerStart
  const stacked = headerLayout === 'stack'
  const isSellerPreview = mode === 'seller-preview'
  const marketplaceHub = useBuyerMarketplaceHub()
  const currencyContext = useContext(BuyerDisplayCurrencyContext)
  const showCurrencyTag = marketplaceHub && !isSellerPreview && Boolean(currencyContext)
  const sellerBrowsing = isSellerBrowsingMarketplace() && !isSellerPreview
  const pageFooter = Boolean(footer)
  const scrollPaddingClass = pageFooter
    ? ''
    : marketplaceHub
      ? sellerBrowsing
        ? 'pb-[calc(9rem+var(--safe-bottom))] lg:pb-[calc(6.25rem+var(--safe-bottom))]'
        : buyerMarketplaceScrollPadding
      : flushBottom
        ? ''
        : 'pb-[max(2rem,var(--safe-bottom))] lg:pb-10'
  const footerPaddingClass = marketplaceHub
    ? sellerBrowsing
      ? 'pb-[calc(9rem+var(--safe-bottom))] lg:pb-[calc(6.25rem+var(--safe-bottom))]'
      : buyerMarketplaceScrollPadding
    : 'pb-[max(2rem,var(--safe-bottom))] lg:pb-10'

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

      <header className="relative z-20 shrink-0 border-b border-brand-green/8 bg-brand-white/90 pt-[var(--safe-top)] backdrop-blur-sm">
        <div className={`mx-auto w-full max-w-5xl px-5 py-3 lg:px-10 lg:py-4 ${stacked ? 'flex flex-col gap-3' : 'flex items-center gap-2 lg:gap-3'}`}>
          <div className={stacked ? 'flex items-center justify-between gap-3' : 'contents'}>
            {headerStart ? (
              <div className={stacked ? 'min-w-0 flex-1' : headerSearch ? 'min-w-0 max-w-[46%] shrink' : 'min-w-0 flex-1 pr-4'}>{headerStart}</div>
            ) : showBackLink ? (
              onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label={backLabel || 'Volver'}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-brand-green transition-colors touch-manipulation active:bg-brand-green/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:hover:bg-brand-green/8"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  {backLabel ? <span>{backLabel}</span> : null}
                </button>
              ) : (
                <Link
                  to={backTo}
                  aria-label={backLabel ? undefined : 'Volver'}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-brand-green transition-colors touch-manipulation active:bg-brand-green/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:hover:bg-brand-green/8 ${!stacked && headerSearch && backLabel ? 'min-w-0 max-w-[38%] shrink' : 'shrink-0'}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                  {backLabel ? <span className={!stacked && headerSearch ? 'truncate' : ''}>{backLabel}</span> : null}
                </Link>
              )
            ) : (
              <span className="w-10 shrink-0" aria-hidden="true" />
            )}
            {stacked ? null : headerSearch ? <div className="min-w-0 flex-1">{headerSearch}</div> : headerStart ? null : <div className="flex-1" />}
            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              {headerEnd}
              {!isSellerPreview ? <BuyerSellerReturnHeaderLink /> : null}
              {!isSellerPreview ? <BuyerHeaderTools /> : null}
            </div>
          </div>
          {stacked && headerMeta ? headerMeta : null}
          {stacked && headerSearch ? <div className="min-w-0">{headerSearch}</div> : null}
        </div>
      </header>

      {showCurrencyTag ? <BuyerCurrencyTag /> : null}

      <div className="page-scroll buyer-scroll relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-y-contain touch-pan-y">
        <div className={`mx-auto w-full max-w-md px-5 pt-4 sm:px-6 lg:max-w-5xl lg:px-10 lg:pt-8 ${flushBottom || pageFooter ? 'flex min-h-full flex-col' : ''} ${scrollPaddingClass}`}>
          {children}
          {pageFooter ? <div className={`mt-auto ${footerPaddingClass}`}>{footer}</div> : null}
        </div>
      </div>

      {!isSellerPreview ? <BuyerSellerReturnFooter /> : null}

      {!isSellerPreview ? <BuyerJabaPanel /> : null}
    </main>
  )
}
