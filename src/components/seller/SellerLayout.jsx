import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import SellerPageMotion from '../../motion/SellerPageMotion'
import { sellerMain, sellerMainWithNav } from './sellerStyles'
import SellerLoadingScreen from './SellerLoadingScreen'
import SellerLogoutModal from './SellerLogoutModal'
import SellerNotificationToast from './SellerNotificationToast'
import SellerNotificationsPanel from './SellerNotificationsPanel'
import SellerShell from './SellerShell'
import StatePanel from '../ui/StatePanel'
import { fetchSellerNotifications, fetchSellerOrders, fetchSellerUnreadNotificationCount, markSellerNotificationRead, markSellerSystemNotificationsRead } from '../../lib/api'
import { fetchSellerProfile } from '../../auth/api.js'
import { BRAND_NAME } from '../../constants/branding'
import {
  clearSellerSession,
  getSellerToken,
  setSellerSession,
} from '../../lib/sellerAuth'
import { clearSellerMarketplaceVisit } from '../../lib/sellerMarketplaceNav'
import { getSellerDefaultPath, getSellerNavItems, sellerHasGestores } from '../../lib/planAccess'
import { SellerReadOnlyContext } from './sellerReadOnly'
import { getSellerPlan } from '../../subscriptions/constants.js'
import { requestSellerOrdersRefresh, SELLER_ORDERS_REFRESH_EVENT } from '../../lib/sellerOrdersRefresh'
import { requestSellerProductsRefresh } from '../../lib/sellerProductsRefresh'
import { SELLER_LIVE_POLL_MS } from '../../live/constants'
import {
  connectSellerEvents,
  OPEN_SELLER_NOTIFICATIONS_EVENT,
  startSellerPush,
  stopSellerPush,
} from '../../live/utils'
import { isSessionError, resolveUserFacingError } from '../../lib/userFacingError'

function sellerNoticeToast(notification) {
  const fromAdmin = Boolean(notification.from_admin)
  return {
    id: notification.id,
    title: notification.title,
    content: String(notification.content ?? '').replace(/\s+/g, ' ').trim(),
    fromAdmin,
    senderName: fromAdmin ? BRAND_NAME : '',
    senderLogo: '',
    senderMascot: fromAdmin,
  }
}

export default function SellerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [liveToasts, setLiveToasts] = useState([])
  const profileNoticesToastedRef = useRef(false)
  const [notifications, setNotifications] = useState([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [pendingOrderCount, setPendingOrderCount] = useState(0)
  const previousNotificationCountRef = useRef(null)

  const refreshProfile = useCallback(async () => {
    const token = getSellerToken()
    if (!token) return null
    const data = await fetchSellerProfile(token)
    setSellerSession(token, data)
    setProfile(data)
    return data
  }, [])

  async function confirmLogout() {
    await stopSellerPush()
    clearSellerMarketplaceVisit()
    clearSellerSession()
    setShowLogoutConfirm(false)
    navigate('/', { replace: true })
  }

  const refreshPendingOrderCount = useCallback(async () => {
    const token = getSellerToken()
    if (!token) return
    try {
      const orders = await fetchSellerOrders(token, { limit: 1 })
      setPendingOrderCount(orders.pending_count ?? 0)
    } catch {
      // Mantén el último conteo durante fallos temporales de red.
    }
  }, [])

  const refreshUnreadCount = useCallback(async () => {
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
  }, [])

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
    function onOpenFromPush() {
      void openNotifications()
    }
    window.addEventListener(OPEN_SELLER_NOTIFICATIONS_EVENT, onOpenFromPush)
    return () => window.removeEventListener(OPEN_SELLER_NOTIFICATIONS_EVENT, onOpenFromPush)
  }, [])

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
          await refreshPendingOrderCount()
        }
      } catch (err) {
        if (!cancelled) {
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
  }, [refreshProfile, refreshPendingOrderCount, refreshUnreadCount])

  useEffect(() => {
    if (!profile?.profile_completed) return undefined

    function handleVisible() {
      if (document.visibilityState === 'visible') {
        refreshUnreadCount()
        refreshPendingOrderCount()
        refreshProfile().catch(() => {})
      }
    }

    function handleOrdersRefresh() {
      refreshPendingOrderCount()
    }

    const intervalId = window.setInterval(() => {
      refreshUnreadCount()
      refreshProfile().catch(() => {})
    }, SELLER_LIVE_POLL_MS)
    document.addEventListener('visibilitychange', handleVisible)
    window.addEventListener(SELLER_ORDERS_REFRESH_EVENT, handleOrdersRefresh)

    const token = getSellerToken()
    if (token) startSellerPush(token)
    const stopEvents = token
      ? connectSellerEvents(token, (notification) => {
          setNotifications((current) => {
            if (current.some((item) => item.id === notification.id)) return current
            return [notification, ...current]
          })
          if (!notification.read_at) {
            setNotificationCount((count) => {
              const next = count + 1
              previousNotificationCountRef.current = next
              return next
            })
          }
          if (notification.kind === 'new_order' || notification.kind === 'qvapay_evidence_rejected') {
            requestSellerOrdersRefresh()
          }
          setLiveToasts((current) => (
            current.some((item) => item.id === notification.id)
              ? current
              : [sellerNoticeToast(notification), ...current]
          ))
        }, (event) => {
          if (Number.isFinite(Number(event.pending_order_count))) {
            setPendingOrderCount(Number(event.pending_order_count))
          }
          if (event.resources?.includes('orders')) requestSellerOrdersRefresh()
          if (event.resources?.includes('products')) requestSellerProductsRefresh()
        })
      : () => {}

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisible)
      window.removeEventListener(SELLER_ORDERS_REFRESH_EVENT, handleOrdersRefresh)
      stopEvents()
    }
  }, [profile?.profile_completed, refreshPendingOrderCount, refreshProfile, refreshUnreadCount])

  useEffect(() => {
    if (location.pathname === '/tienda/perfil') return undefined
    if (!profile?.profile_completed || profileNoticesToastedRef.current) return undefined
    profileNoticesToastedRef.current = true
    const token = getSellerToken()
    if (!token) return undefined
    let cancelled = false
    fetchSellerNotifications(token)
      .then((data) => {
        if (cancelled) return
        const unread = (Array.isArray(data) ? data : []).filter((item) => !item.read_at)
        if (!unread.length) return
        setLiveToasts((current) => {
          const seen = new Set(current.map((item) => item.id))
          const incoming = unread
            .filter((item) => !seen.has(item.id))
            .map((item) => sellerNoticeToast(item))
          return incoming.length ? [...incoming, ...current] : current
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [location.pathname, profile?.profile_completed])

  if (loading) {
    return <SellerLoadingScreen />
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
  const readOnly = profile?.subscription_active === false

  if (isCatalogPreview) {
    return (
      <SellerReadOnlyContext.Provider value={readOnly}>
      <>
        <SellerPageMotion context={{ profile, refreshProfile }} />
        <SellerNotificationToast
          toasts={liveToasts}
          onDone={(id) => setLiveToasts((current) => current.filter((item) => item.id !== id))}
          onOpen={() => {
            setLiveToasts([])
            openNotifications()
          }}
        />
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
      </>
      </SellerReadOnlyContext.Provider>
    )
  }

  return (
    <SellerReadOnlyContext.Provider value={readOnly}>
      <SellerShell
        storeName={profile.store_name}
        planName={getSellerPlan(profile).name}
        subscriptionActive={profile.subscription_active}
        onLogout={() => setShowLogoutConfirm(true)}
        onNotifications={openNotifications}
        notificationCount={notificationCount}
        pendingOrderCount={pendingOrderCount}
        showBottomNav={showBottomNav}
        catalogLayout={isCatalogPage}
        navItems={sellerNavItems}
      >
        <SellerPageMotion
          context={{ profile, refreshProfile }}
          fill={isCatalogPage}
          scroll={showBottomNav && !isCatalogPage}
          contentClassName={isCatalogPage ? '' : (showBottomNav ? sellerMainWithNav : sellerMain)}
        />
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

      <SellerNotificationToast
        toasts={liveToasts}
        aboveNav={showBottomNav}
        onDone={(id) => setLiveToasts((current) => current.filter((item) => item.id !== id))}
        onOpen={() => {
          setLiveToasts([])
          openNotifications()
        }}
      />

      {showLogoutConfirm && (
        <SellerLogoutModal
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={confirmLogout}
        />
      )}
    </SellerReadOnlyContext.Provider>
  )
}
