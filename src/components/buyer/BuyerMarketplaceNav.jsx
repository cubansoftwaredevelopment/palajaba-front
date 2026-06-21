import { NavLink } from 'react-router-dom'
import { BUYER_MARKETPLACE_NAV } from '../../constants/buyerMarketplaceNav'
import { buyerMarketplaceNavItem, buyerMarketplaceNavShell } from './buyerStyles'

const ICONS = {
  marketplace: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  negocios: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
}

export default function BuyerMarketplaceNav() {
  return (
    <nav className={buyerMarketplaceNavShell} aria-label="Secciones de compra">
      <div className="mx-auto flex w-full min-w-0 max-w-md items-stretch px-1 sm:max-w-lg lg:max-w-5xl">
        {BUYER_MARKETPLACE_NAV.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.end}
            className={({ isActive }) => buyerMarketplaceNavItem(isActive)}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors sm:h-9 sm:w-9 sm:rounded-xl ${
                    isActive ? 'bg-brand-green text-brand-white' : 'text-current'
                  }`}
                >
                  {ICONS[item.id]}
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
