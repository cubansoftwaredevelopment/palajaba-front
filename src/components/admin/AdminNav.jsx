import { useEffect } from 'react'
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
  mensajes: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  productos: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.3 7 12 12l8.7-5M12 22V12" />
    </svg>
  ),
  banners: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
  finanzas: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
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
  return `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${adminFocusRing} ${
    isActive ? 'bg-brand-green/15 text-brand-green' : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-zinc-50'
  }`
}

export default function AdminNav({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  return (
    <div
      id="admin-nav"
      className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
      inert={!open}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/45 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        aria-label="Cerrar menú"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <nav
        className={`absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col border-r border-brand-green/15 bg-[var(--admin-header)] shadow-[8px_0_32px_rgba(0,0,0,0.28)] transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          paddingTop: 'max(1rem, var(--safe-top))',
          paddingBottom: 'max(1rem, var(--safe-bottom))',
        }}
        aria-label="Secciones del panel"
      >
        <div className="flex items-center justify-between px-4 pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">Menú</p>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-300 hover:bg-zinc-800 ${adminFocusRing}`}
            aria-label="Cerrar menú"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.id} to={item.path} className={({ isActive }) => navLinkClass(isActive)} onClick={onClose}>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center">{NAV_ICONS[item.id]}</span>
              <span className="min-w-0 truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
