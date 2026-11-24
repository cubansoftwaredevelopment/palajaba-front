import SectionRefreshMascot from '../SectionRefreshMascot'
import Logo from '../Logo'
import { SellerBottomNav, SellerSidebarNav } from './SellerNav'
import {
  sellerContent,
  sellerFocusRing,
  sellerHeader,
  sellerHeaderInner,
  sellerMainCatalog,
  sellerShell,
  sellerSidebar,
  sellerSidebarLogoWrap,
} from './sellerStyles'

function HeaderIconButton({ onClick, ariaLabel, children, badge = 0, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors touch-manipulation active:bg-brand-green/8 active:text-brand-green ${sellerFocusRing} ${
        active ? 'bg-brand-green/10 text-brand-green' : 'text-brand-carmelita/70'
      }`}
      aria-label={ariaLabel}
      aria-current={active ? 'page' : undefined}
    >
      {children}
      {badge > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-carmelita px-1 text-[0.6rem] font-bold leading-none text-brand-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}

function NotificationsButton({ onClick, unreadCount = 0, active = false }) {
  return (
    <HeaderIconButton onClick={onClick} ariaLabel="Notificaciones" badge={unreadCount} active={active}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    </HeaderIconButton>
  )
}

function LogoutButton({ onClick }) {
  return (
    <HeaderIconButton onClick={onClick} ariaLabel="Cerrar sesión">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" x2="9" y1="12" y2="12" />
      </svg>
    </HeaderIconButton>
  )
}

export default function SellerShell({
  planName,
  subscriptionActive = true,
  onLogout,
  onNotifications,
  notificationsActive = false,
  notificationCount = 0,
  pendingOrderCount = 0,
  showBottomNav = false,
  catalogLayout = false,
  hideChrome = false,
  navItems,
  profilePhotoUrl = '',
  refreshing = false,
  children,
  footer,
}) {
  const useFixedViewport = catalogLayout || showBottomNav
  const shellClassName = useFixedViewport
    ? `${sellerShell} seller-shell-viewport h-dvh max-h-dvh overflow-hidden`
    : `${sellerShell} overflow-x-hidden`
  const contentClassName = useFixedViewport
    ? `${sellerContent} min-h-0 flex-1 overflow-hidden`
    : sellerContent
  return (
    <>
      <div className={shellClassName}>
        <div
          className="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full bg-brand-yellow/12 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-24 bottom-32 h-56 w-56 rounded-full bg-brand-green/8 blur-3xl lg:bottom-12 lg:left-64"
          aria-hidden="true"
        />

        {showBottomNav && (
          <aside className={sellerSidebar}>
            <div className={sellerSidebarLogoWrap}>
              <Logo className="h-20 w-20 shrink-0 xl:h-24 xl:w-24" priority />
            </div>
            <SellerSidebarNav items={navItems} pendingOrderCount={pendingOrderCount} profilePhotoUrl={profilePhotoUrl} />
          </aside>
        )}

        <div className={contentClassName}>
          {hideChrome ? null : (
          <header className={`${sellerHeader} shrink-0 shadow-[0_1px_0_rgba(89,128,44,0.06)]`}>
            <div className={`${sellerHeaderInner} relative`}>
              <Logo
                className={`h-9 w-9 shrink-0 sm:h-10 sm:w-10 ${showBottomNav ? 'lg:hidden' : ''}`}
                priority
              />
              <div className="pointer-events-none absolute inset-x-0 flex justify-center">
                <div className="pointer-events-auto flex flex-col items-center gap-0.5">
                  <span className={`rounded-full px-2 py-1 text-[0.55rem] font-extrabold uppercase tracking-wide sm:px-2.5 sm:text-[0.65rem] ${subscriptionActive ? 'bg-brand-green/10 text-brand-green' : 'bg-amber-100 text-amber-800'}`} role="status">
                    {subscriptionActive ? 'Activa' : 'Inactiva'}
                  </span>
                  <span className="whitespace-nowrap text-[0.55rem] font-semibold leading-tight text-brand-carmelita/85 sm:text-[0.62rem]">
                    Plan {planName}
                  </span>
                </div>
              </div>
              <div className="ml-auto flex shrink-0 items-center">
                <NotificationsButton onClick={onNotifications} unreadCount={notificationCount} active={notificationsActive} />
                {onLogout && <LogoutButton onClick={onLogout} />}
              </div>
            </div>
          </header>
          )}

          {!hideChrome && !subscriptionActive ? (
            <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-semibold text-amber-900" role="status">
              Tu suscripción está inactiva. Puedes ver la cuenta y pedir un plan. El resto está en solo lectura.
            </p>
          ) : null}

          {catalogLayout ? (
            <main className={`${sellerMainCatalog} relative`}>
              <SectionRefreshMascot active={refreshing} />
              {children}
            </main>
          ) : (
            <main className={useFixedViewport ? 'relative min-h-0 flex-1 overflow-hidden' : 'relative min-h-0 flex-1'}>
              <SectionRefreshMascot active={refreshing} />
              {children}
            </main>
          )}

          {footer && <div className="sm:hidden">{footer}</div>}
        </div>
      </div>

      {showBottomNav && <SellerBottomNav items={navItems} pendingOrderCount={pendingOrderCount} profilePhotoUrl={profilePhotoUrl} />}
    </>
  )
}
