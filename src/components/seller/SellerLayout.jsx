import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import SellerLoadingScreen from './SellerLoadingScreen'
import SellerLogoutModal from './SellerLogoutModal'
import SellerNotificationsPanel from './SellerNotificationsPanel'
import SellerShell from './SellerShell'
import StatePanel from '../ui/StatePanel'
import SubscriptionExpiredScreen from './SubscriptionExpiredScreen'
import { ApiError, fetchSellerProfile, fetchSellerNotifications, fetchSellerUnreadNotificationCount, markSellerNotificationRead, markSellerSystemNotificationsRead } from '../../lib/api'
import {
  clearSellerSession,
  getSellerToken,
  setSellerSession,
} from '../../lib/sellerAuth'
import { clearSellerMarketplaceVisit } from '../../lib/sellerMarketplaceNav'
import { getSellerDefaultPath, getSellerNavItems, sellerHasGestores } from '../../lib/planAccess'
import { requestSellerOrdersRefresh } from '../../lib/sellerOrdersRefresh'
import { isSessionError, resolveUserFacingError } from '../../lib/userFacingError'

export default function SellerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
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
    clearSellerMarketplaceVisit()
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

  async function handleMarkAllSystemNotificationsRead() {
    const token = getSellerToken()
    if (!token) return
    try {
      await markSellerSystemNotificationsRead(token)
      const data = await fetchSellerNotifications(token)
      setNotifications(data)
      await refreshUnreadCount()
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
      setLoadError(null)
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
          if (isSessionError(err)) {
            clearSellerSession()
          }
          setLoadError(
            resolveUserFacingError(err, {
              contextTitle: 'No se pudo cargar tu tienda',
              fallbackMessage: 'No pudimos conectar con tu cuenta. Inténtalo de nuevo.',
            }),
          )
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
        renewalContactPhone={expiredInfo.renewal_contact_phone}
        onBack={() => {
          setExpiredInfo(null)
          navigate('/login', { replace: true })
        }}
      />
    )
  }

  if (loadError) {
    return (
      <main className="flex min-h-dvh flex-col bg-brand-white">
        <StatePanel
          variant="fullscreen"
          title={loadError.title}
          message={loadError.message}
          serviceError={loadError.isServiceError}
          onRetry={loadError.canRetry ? () => window.location.reload() : undefined}
        />
      </main>
    )
  }

  const onCompletePage = location.pathname === '/tienda/completar-perfil'
  const isCatalogPreview = location.pathname === '/tienda/catalogo/vista-previa'
  const isCatalogPage = location.pathname.endsWith('/catalogo') && !isCatalogPreview
  const showBottomNav = profile?.profile_completed && !onCompletePage && !isCatalogPreview

  if (!profile?.profile_completed && !onCompletePage) {
    return <Navigate to="/tienda/completar-perfil" replace />
  }

  if (profile?.profile_completed && onCompletePage) {
    return <Navigate to={getSellerDefaultPath(profile)} replace />
  }

  if (
    profile?.profile_completed &&
    location.pathname.startsWith('/tienda/gestores') &&
    !sellerHasGestores(profile)
  ) {
    return <Navigate to={getSellerDefaultPath(profile)} replace />
  }

  const sellerNavItems = getSellerNavItems(profile)

  if (isCatalogPreview) {
    return <Outlet context={{ profile, refreshProfile }} />
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
          onMarkAllSystemRead={handleMarkAllSystemNotificationsRead}
          storeName={profile?.store_name}
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
