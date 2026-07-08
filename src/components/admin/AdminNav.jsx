import { NavLink } from 'react-router-dom'
import { ADMIN_NAV } from '../../constants/adminNav'
import { adminFocusRing } from './adminStyles'

const NAV_ICONS = {
  estadisticas: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 16V9M12 16V5M17 16v-3" />
    </svg>
  ),
  solicitudes: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  descuentos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  ),
  notificaciones: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  mensajes: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  configuracion: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
}

function navLinkClass(isActive) {
  return `flex min-w-0 flex-1 basis-0 flex-col items-center gap-0.5 px-1 py-2.5 text-[0.65rem] font-medium transition-colors sm:gap-1 sm:py-3 sm:text-xs ${adminFocusRing} ${
    isActive ? 'text-brand-green' : 'text-zinc-500 hover:text-zinc-300'
  }`
}

function iconShellClass(isActive) {
  return `flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all sm:h-9 sm:w-9 ${
    isActive
      ? 'bg-brand-green/15 text-brand-green ring-1 ring-brand-green/25 shadow-[0_0_20px_rgba(89,128,44,0.15)]'
      : 'text-current'
  }`
}

export default function AdminNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 w-full max-w-[100dvw] border-t border-brand-green/10 bg-[#0b0e0a]/92 shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md"
      style={{ paddingBottom: 'max(0.375rem, var(--safe-bottom))' }}
      aria-label="Secciones del panel"
    >
      <div className="mx-auto flex w-full min-w-0 max-w-3xl px-0.5">
        {ADMIN_NAV.map((item) => (
          <NavLink key={item.id} to={item.path} className={({ isActive }) => navLinkClass(isActive)}>
            {({ isActive }) => (
              <>
                <span className={iconShellClass(isActive)}>{NAV_ICONS[item.id]}</span>
                <span className="w-full truncate text-center">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
