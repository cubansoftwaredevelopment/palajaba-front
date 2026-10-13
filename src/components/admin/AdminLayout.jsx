import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../Logo'
import { ADMIN_PAGE_TITLES } from '../../constants/adminNav'
import { clearAdminToken } from '../../lib/adminAuth'
import { readAdminTheme, writeAdminTheme } from './adminTheme'
import { adminHeader, adminMuted, adminPage, adminIconButton, adminIconButtonActive } from './adminStyles'
import AdminNav from './AdminNav'
import LogoutConfirmModal from './LogoutConfirmModal'

function NotificationsLink({ active }) {
  return (
    <Link
      to="/admin/mensajes"
      className={active ? adminIconButtonActive : adminIconButton}
      aria-label="Mensajes y avisos"
      title="Mensajes/Avisos"
    >
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
    </Link>
  )
}

function ThemeToggle({ theme, onToggle }) {
  const light = theme === 'light'
  return (
    <button
      type="button"
      onClick={onToggle}
      className={adminIconButton}
      aria-label={light ? 'Usar tema oscuro' : 'Usar tema claro'}
      title={light ? 'Tema oscuro' : 'Tema claro'}
    >
      {light ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      )}
    </button>
  )
}

function LogoutIconButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className={adminIconButton} aria-label="Cerrar sesión">
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
    </button>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [theme, setTheme] = useState(readAdminTheme)

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    writeAdminTheme(next)
  }

  const title = ADMIN_PAGE_TITLES[location.pathname] ?? 'Panel'
  const onNotificationsPage = location.pathname === '/admin/mensajes'

  function confirmLogout() {
    clearAdminToken()
    setShowLogoutConfirm(false)
    navigate('/admin', { replace: true })
  }

  return (
    <div className={adminPage} data-theme={theme}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-brand-green/10 blur-3xl" />
        <div className="absolute -left-32 bottom-24 h-72 w-72 rounded-full bg-brand-yellow/8 blur-3xl" />
      </div>

      <header className={adminHeader}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Logo
              variant={theme === 'light' ? 'default' : 'admin'}
              className="h-12 w-12 shrink-0 sm:h-14 sm:w-14"
              priority
            />
            <div className="min-w-0">
              <p className={`text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${adminMuted}`}>
                Pa&apos; La Jaba · Admin
              </p>
              <h1 className="truncate text-lg font-semibold text-zinc-50 sm:text-xl">{title}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <NotificationsLink active={onNotificationsPage} />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <LogoutIconButton onClick={() => setShowLogoutConfirm(true)} />
          </div>
        </div>
      </header>

      <div className="relative pb-24">
        <Outlet />
      </div>

      <AdminNav />

      {showLogoutConfirm && (
        <LogoutConfirmModal
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={confirmLogout}
        />
      )}
    </div>
  )
}
