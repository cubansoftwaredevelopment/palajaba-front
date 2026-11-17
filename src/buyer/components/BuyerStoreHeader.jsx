import { Link } from 'react-router-dom'
import StoreMark from './StoreMark'

const backClass =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-green touch-manipulation active:bg-brand-green/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25'

function BackChevron() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function BuyerStoreIdentity({ store, backTo, backLabel = 'Volver', onBack }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      {onBack ? (
        <button type="button" onClick={onBack} className={backClass} aria-label={backLabel}>
          <BackChevron />
        </button>
      ) : (
        <Link to={backTo} className={backClass} aria-label={backLabel}>
          <BackChevron />
        </Link>
      )}
      {store?.store_name ? (
        <>
          <StoreMark photoUrl={store.profile_photo_url} storeName={store.store_name} size="md" />
          <span className="truncate font-display text-base font-bold leading-tight text-brand-green">
            {store.store_name}
          </span>
        </>
      ) : null}
    </div>
  )
}

