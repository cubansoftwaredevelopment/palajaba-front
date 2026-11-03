import { NavLink } from 'react-router-dom'
import { CUSTOMER_NAV } from './customerNav.jsx'

export default function CustomerNavigation({ mobile = false, hasOrderWarning = false }) {
  return (
    <nav className={mobile ? 'fixed bottom-0 left-0 right-0 z-30 border-t border-brand-green/10 bg-brand-white/95 shadow-[0_-4px_24px_rgba(89,128,44,0.08)] backdrop-blur-md lg:hidden' : 'hidden lg:flex lg:flex-col lg:gap-1'} style={mobile ? { paddingBottom: 'max(0.375rem, var(--safe-bottom))' } : undefined} aria-label="Secciones de tu cuenta">
      <div className={mobile ? 'mx-auto flex w-full max-w-md items-stretch px-1' : 'flex flex-col gap-1'}>
        {CUSTOMER_NAV.map((item) => <NavLink key={item.id} to={item.path} className={mobile ? 'min-w-0 flex-1' : 'block'}>
          {({ isActive }) => <span className={mobile
            ? `flex flex-col items-center justify-center gap-0.5 py-1.5 text-[0.625rem] font-semibold text-center touch-manipulation ${isActive ? 'text-brand-green' : 'text-brand-carmelita/65'}`
            : `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-brand-green text-white' : 'text-brand-carmelita/80 hover:bg-brand-green/8 hover:text-brand-green'}`}>
            <span className={mobile ? `relative flex h-9 w-9 items-center justify-center rounded-xl ${isActive ? 'bg-brand-green text-white' : ''}` : 'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-current/10'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.icon}</svg>
              {item.id === 'pedidos' && hasOrderWarning ? <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[0.65rem] font-extrabold leading-none text-white ring-2 ring-brand-white" aria-label="Pedidos que requieren atención">!</span> : null}
            </span>
            <span className={mobile ? 'w-full truncate px-0.5' : ''}>{item.label}</span>
          </span>}
        </NavLink>)}
      </div>
    </nav>
  )
}
