import Logo from '../Logo'
import { SellerBottomNav, SellerSidebarNav } from './SellerNav'
import {
  sellerContent,
  sellerFocusRing,
  sellerHeader,
  sellerHeaderInner,
  sellerMain,
  sellerMainCatalog,
  sellerMainWithNav,
  sellerScrollArea,
  sellerShell,
  sellerSidebar,
  sellerSidebarLogoWrap,
} from './sellerStyles'

function HeaderIconButton({ onClick, ariaLabel, children, badge = 0 }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-carmelita/70 transition-colors touch-manipulation active:bg-brand-green/8 active:text-brand-green ${sellerFocusRing}`}
      aria-label={ariaLabel}
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

function NotificationsButton({ onClick, unreadCount = 0 }) {
  return (
    <HeaderIconButton onClick={onClick} ariaLabel="Notificaciones" badge={unreadCount}>
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
  storeName,
  onLogout,
  onNotifications,
  notificationCount = 0,
  showBottomNav = false,
  catalogLayout = false,
  children,
  footer,
}) {
  const mainClassName = catalogLayout
    ? sellerMainCatalog
    : showBottomNav
      ? sellerMainWithNav
      : sellerMain
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
        {!catalogLayout && (
          <>
            <div
              className="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full bg-brand-yellow/12 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -left-24 bottom-32 h-56 w-56 rounded-full bg-brand-green/8 blur-3xl lg:bottom-12 lg:left-64"
              aria-hidden="true"
            />
          </>
        )}

        {showBottomNav && (
          <aside className={sellerSidebar}>
            <div className={sellerSidebarLogoWrap}>
              <Logo className="h-20 w-20 shrink-0 xl:h-24 xl:w-24" priority />
            </div>
            <SellerSidebarNav />
          </aside>
        )}

        <div className={contentClassName}>
          <header className={`${sellerHeader} shrink-0 shadow-[0_1px_0_rgba(89,128,44,0.06)]`}>
            <div className={sellerHeaderInner}>
              <Logo
                className={`h-9 w-9 shrink-0 sm:h-10 sm:w-10 ${showBottomNav ? 'lg:hidden' : ''}`}
                priority
              />
              <p className="min-w-0 flex-1 truncate font-display text-sm font-bold text-brand-green sm:text-base lg:text-lg">
                Bienvenido{' '}
                <span className="text-brand-carmelita">{storeName}</span>
              </p>
              <div className="flex shrink-0 items-center">
                <NotificationsButton onClick={onNotifications} unreadCount={notificationCount} />
                {onLogout && <LogoutButton onClick={onLogout} />}
              </div>
            </div>
          </header>

          {catalogLayout ? (
            <main className={mainClassName}>{children}</main>
          ) : useFixedViewport ? (
            <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className={sellerScrollArea}>
                <div className={mainClassName}>{children}</div>
              </div>
            </main>
          ) : (
            <main className={mainClassName}>{children}</main>
          )}

          {footer && <div className="sm:hidden">{footer}</div>}
        </div>
      </div>

      {showBottomNav && <SellerBottomNav />}
    </>
  )
}
