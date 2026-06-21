import { Link } from 'react-router-dom'
import { useBuyerMarketplaceHub } from '../../lib/buyerMarketplaceHub'
import { getSellerReturnPath, isSellerBrowsingMarketplace } from '../../lib/sellerMarketplaceNav'

const STORE_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    aria-hidden="true"
    className="shrink-0"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </svg>
)

export function BuyerSellerReturnHeaderLink() {
  if (!isSellerBrowsingMarketplace()) return null

  return (
    <Link
      to={getSellerReturnPath()}
      className="hidden min-h-10 items-center justify-center gap-1.5 rounded-full border border-brand-green/22 bg-brand-green/[0.06] px-3 text-sm font-semibold text-brand-green transition-colors touch-manipulation active:bg-brand-green/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 lg:inline-flex lg:hover:bg-brand-green/10"
    >
      {STORE_ICON}
      <span>Mi tienda</span>
    </Link>
  )
}

export function BuyerSellerReturnFooter() {
  if (!isSellerBrowsingMarketplace()) return null

  const marketplaceHub = useBuyerMarketplaceHub()

  return (
    <nav
      className={
        marketplaceHub
          ? 'fixed inset-x-0 bottom-[calc(4.25rem+var(--safe-bottom))] z-20 border-t border-brand-carmelita/15 bg-brand-white/95 px-4 py-2 backdrop-blur-md lg:hidden'
          : 'relative z-20 shrink-0 border-t border-brand-carmelita/15 bg-brand-white/95 px-4 py-2 backdrop-blur-md lg:hidden'
      }
      style={marketplaceHub ? undefined : { paddingBottom: 'max(0.5rem, var(--safe-bottom))' }}
      aria-label="Volver al panel de vendedor"
    >
      <Link
        to={getSellerReturnPath()}
        className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-xl border border-brand-carmelita/18 bg-brand-carmelita/[0.05] px-4 py-2.5 text-sm font-semibold text-brand-carmelita transition-colors touch-manipulation active:bg-brand-carmelita/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-carmelita/25"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {STORE_ICON}
        <span>Volver a mi tienda</span>
      </Link>
    </nav>
  )
}
