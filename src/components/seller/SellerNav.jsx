import { NavLink } from 'react-router-dom'
import { SELLER_NAV } from '../../constants/sellerNav'
import { sellerFocusRing } from './sellerStyles'

export const SELLER_NAV_ICONS = {
  general: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 16V9M12 16V5M17 16v-3" />
    </svg>
  ),
  catalogo: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
    </svg>
  ),
  pedidos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  perfil: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  ),
}

function bottomLinkClass(isActive) {
  return `flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 py-1.5 text-[0.625rem] font-semibold leading-none transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-green/30 sm:text-xs ${sellerFocusRing} ${
    isActive ? 'text-brand-green' : 'text-brand-carmelita/65 active:text-brand-green'
  }`
}

function sideLinkClass(isActive) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${sellerFocusRing} ${
    isActive
      ? 'bg-brand-green text-brand-white'
      : 'text-brand-carmelita/80 hover:bg-brand-green/8 hover:text-brand-green'
  }`
}

export function SellerBottomNav({ items = SELLER_NAV }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 w-full max-w-[100dvw] border-t border-brand-green/10 bg-brand-white/95 shadow-[0_-4px_24px_rgba(89,128,44,0.08)] backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'max(0.375rem, var(--safe-bottom))' }}
      aria-label="Secciones de tu tienda"
    >
      <div className="mx-auto flex w-full min-w-0 max-w-md items-stretch px-0.5 sm:px-1">
        {items.map((item) => (
          <NavLink key={item.id} to={item.path} end={item.end} className={({ isActive }) => bottomLinkClass(isActive)}>
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors sm:h-9 sm:w-9 sm:rounded-xl ${
                    isActive ? 'bg-brand-green text-brand-white' : 'text-current'
                  }`}
                >
                  {SELLER_NAV_ICONS[item.id]}
                </span>
                <span className="w-full truncate px-0.5 text-center">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function SellerSidebarNav({ items = SELLER_NAV }) {
  return (
    <nav className="hidden lg:flex lg:flex-col lg:gap-1" aria-label="Secciones de tu tienda">
      {items.map((item) => (
        <NavLink key={item.id} to={item.path} end={item.end} className={({ isActive }) => sideLinkClass(isActive)}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-current/10">
            {SELLER_NAV_ICONS[item.id]}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
