import { useEffect, useRef } from 'react'
import { Link, Outlet } from 'react-router-dom'
import SectionRefreshMascot from '../../shared/componentes/SectionRefreshMascot.jsx'
import { usePullToRefresh } from '../../shared/componentes/usePullToRefresh.js'
import { useSectionRefreshing } from '../../session/useSectionSnapshot'
import BuyerHeaderTools from '../../buyer/componentes/BuyerHeaderTools.jsx'
import BuyerMarketplaceNav from '../../buyer/componentes/BuyerMarketplaceNav.jsx'
import CustomerOrderDetailModal from '../componentes/CustomerOrderDetailModal.jsx'
import { CUSTOMER_NAV } from '../componentes/customerNav.jsx'
import { CUSTOMER_PURCHASE_REVOKED_MESSAGE } from '../utils/customerAuth.js'
import Logo from '../../shared/componentes/Logo.jsx'
import LoadingState from '../../shared/componentes/LoadingState.jsx'
import { CustomerAccountProvider, useCustomerAccount } from '../context/CustomerAccountContext.jsx'

function CustomerAccountFrame() {
  const {
    section,
    profile,
    loading,
    error,
    selectedOrder,
    setSelectedOrder,
    hasOrderWarning,
    load,
    refreshVisibleSection,
  } = useCustomerAccount()
  const { handlers: pullHandlers } = usePullToRefresh(refreshVisibleSection)
  const accountRefreshing = useSectionRefreshing('customer', section)
  const accountScrollRef = useRef(null)
  const seenSectionRef = useRef(section)

  useEffect(() => {
    if (seenSectionRef.current === section) return
    seenSectionRef.current = section
    accountScrollRef.current?.scrollTo({ top: 0 })
  }, [section])

  const centeredTitle = section === 'pedidos' || section === 'favoritos' || section === 'direcciones'

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-brand-green/[0.035] text-brand-carmelita">
      <main ref={accountScrollRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain pb-[calc(5.5rem+var(--safe-bottom))]" {...pullHandlers}>
        <header className="sticky top-0 z-20 shrink-0 border-b border-brand-green/8 bg-brand-white/95 px-4 pt-[max(0.75rem,var(--safe-top))] pb-3 backdrop-blur-md sm:px-5 lg:px-8 lg:pt-[max(1rem,var(--safe-top))] lg:pb-4">
          <div className="mx-auto flex w-full max-w-md items-center gap-2.5 sm:gap-3 lg:max-w-none">
            <Link
              to="/comprar"
              aria-label="Volver"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-green touch-manipulation active:bg-brand-green/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <Logo className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
            <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
              <BuyerHeaderTools />
            </div>
          </div>
        </header>
        <SectionRefreshMascot active={accountRefreshing} />
        <div className={`mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 ${section === 'perfil' ? 'pt-3' : 'pt-6'}`}>
          {section === 'perfil' ? null : (
            <header className={`mb-6 ${centeredTitle ? 'text-center' : ''}`}>
              <h1 className={centeredTitle
                ? 'font-script text-7xl leading-[1.05] text-brand-carmelita sm:text-8xl'
                : section === 'avisos'
                  ? 'font-script text-4xl leading-[1.15] text-brand-carmelita'
                  : 'font-display text-3xl font-bold'}>
                {section === 'avisos'
                  ? 'Avisos'
                  : CUSTOMER_NAV.find((item) => item.id === section)?.label || 'Mi cuenta'}
              </h1>
            </header>
          )}
          {profile?.purchase_revoked ? (
            <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              {CUSTOMER_PURCHASE_REVOKED_MESSAGE}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          {loading && !profile ? (
            <LoadingState message="Cargando tu cuenta…" />
          ) : profile ? (
            <div className="grid gap-4">
              <Outlet />
            </div>
          ) : null}
        </div>
      </main>
      <BuyerMarketplaceNav orderAttention={hasOrderWarning} />
      {selectedOrder ? <CustomerOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdated={load} /> : null}
    </div>
  )
}

export default function CustomerAccountLayout() {
  return (
    <CustomerAccountProvider>
      <CustomerAccountFrame />
    </CustomerAccountProvider>
  )
}
