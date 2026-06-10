import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import SellerLoadingScreen from './SellerLoadingScreen'
import SellerLogoutModal from './SellerLogoutModal'
import SellerNotificationsPanel from './SellerNotificationsPanel'
import SellerShell from './SellerShell'
import SubscriptionExpiredScreen from './SubscriptionExpiredScreen'
import { ApiError, fetchSellerProfile, fetchSellerNotifications, fetchSellerUnreadNotificationCount, markSellerNotificationRead } from '../../lib/api'
import {
  clearSellerSession,
  getSellerToken,
  setSellerSession,
} from '../../lib/sellerAuth'
import { getSellerDefaultPath, getSellerNavItems } from '../../lib/planAccess'
import { requestSellerOrdersRefresh } from '../../lib/sellerOrdersRefresh'

export default function SellerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [expiredInfo, setExpiredInfo] = useState(null)
  const previousNotificationCountRef = useRef(null)

  const refreshProfile = useCallback(async () => {
    const token = getSellerToken()
    if (!token) return null
    const data = await fetchSellerProfile(token)
    setSellerSession(token, data)
    setProfile(data)
    return data
  }, [])

  function confirmLogout() {
    clearSellerSession()
    setShowLogoutConfirm(false)
    navigate('/login', { replace: true })
  }

  async function refreshUnreadCount() {
    const token = getSellerToken()
    if (!token) return
    try {
      const data = await fetchSellerUnreadNotificationCount(token)
      const previous = previousNotificationCountRef.current
      previousNotificationCountRef.current = data.count
      setNotificationCount(data.count)
      if (previous !== null && data.count > previous) {
        requestSellerOrdersRefresh()
      }
    } catch {
      previousNotificationCountRef.current = 0
      setNotificationCount(0)
    }
  }

  async function loadNotifications() {
    const token = getSellerToken()
    if (!token) return
    setNotificationsLoading(true)
    try {
      const data = await fetchSellerNotifications(token)
      setNotifications(data)
      await refreshUnreadCount()
    } catch {
      setNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }

  async function handleMarkNotificationRead(notificationId) {
    const token = getSellerToken()
    if (!token) return
    try {
      const updated = await markSellerNotificationRead(token, notificationId)
      setNotifications((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setNotificationCount((count) => Math.max(0, count - 1))
    } catch {
      await refreshUnreadCount()
    }
  }

  async function openNotifications() {
    setShowNotifications(true)
    await loadNotifications()
  }

  function closeNotifications() {
    setShowNotifications(false)
    refreshUnreadCount()
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError('')
      setLoading(true)
      try {
        const data = await refreshProfile()
        if (!cancelled) {
          setProfile(data)
          await refreshUnreadCount()
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.code === 'subscription_expired') {
            clearSellerSession()
            setExpiredInfo(err.data)
            return
          }
          if (err.message.includes('autenticado') || err.message.includes('Token')) {
            clearSellerSession()
          }
          setError(err.message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [refreshProfile])

  useEffect(() => {
    if (!profile?.profile_completed) return undefined

    function handleVisible() {
      if (document.visibilityState === 'visible') {
        refreshUnreadCount()
      }
    }

    const intervalId = window.setInterval(refreshUnreadCount, 45_000)
    document.addEventListener('visibilitychange', handleVisible)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisible)
    }
  }, [profile?.profile_completed])

  if (loading) {
    return <SellerLoadingScreen />
  }

  if (expiredInfo) {
    return (
      <SubscriptionExpiredScreen
        storeName={expiredInfo.store_name}
        subscriptionEndsAt={expiredInfo.subscription_ends_at}
        onBack={() => {
          setExpiredInfo(null)
          navigate('/login', { replace: true })
        }}
      />
    )
  }

  if (error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-brand-white px-6 text-center">
        <p className="max-w-xs text-sm leading-relaxed text-brand-carmelita" role="alert">
          {error}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full border border-brand-green/22 px-5 py-2.5 text-sm font-semibold text-brand-green touch-manipulation active:bg-brand-yellow/10"
        >
          Reintentar
        </button>
      </main>
    )
  }

  const onCompletePage = location.pathname === '/tienda/completar-perfil'
  const isCatalogPage = location.pathname.endsWith('/catalogo')
  const showBottomNav = profile?.profile_completed && !onCompletePage

  if (!profile?.profile_completed && !onCompletePage) {
    return <Navigate to="/tienda/completar-perfil" replace />
  }

  if (profile?.profile_completed && onCompletePage) {
    return <Navigate to={getSellerDefaultPath(profile)} replace />
  }

  const sellerNavItems = getSellerNavItems(profile)
  const isGeneralPage = location.pathname === '/tienda' || location.pathname === '/tienda/'

  if (profile?.profile_completed && isGeneralPage && !sellerNavItems.some((item) => item.id === 'general')) {
    return <Navigate to="/tienda/catalogo" replace />
  }

  return (
    <>
      <SellerShell
        storeName={profile.store_name}
        onLogout={() => setShowLogoutConfirm(true)}
        onNotifications={openNotifications}
        notificationCount={notificationCount}
        showBottomNav={showBottomNav}
        catalogLayout={isCatalogPage}
        navItems={sellerNavItems}
      >
        <Outlet context={{ profile, refreshProfile }} />
      </SellerShell>

      {showNotifications && (
        <SellerNotificationsPanel
          notifications={notifications}
          loading={notificationsLoading}
          onClose={closeNotifications}
          onMarkRead={handleMarkNotificationRead}
        />
      )}

      {showLogoutConfirm && (
        <SellerLogoutModal
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={confirmLogout}
        />
      )}
    </>
  )
}
