import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import SellerPageMotion from '../../motion/SellerPageMotion'
import { SectionRefreshProvider } from '../../session/SectionRefresh'
import { runSectionRefresh } from '../../session/sectionStore'
import { useSectionRefreshing, useSectionSnapshot } from '../../session/useSectionSnapshot'
import { sellerMain, sellerMainWithNav } from './sellerStyles.js'
import SellerLoadingScreen from './SellerLoadingScreen.jsx'
import SellerLogoutModal from './SellerLogoutModal.jsx'
import SellerNotificationToast from './SellerNotificationToast.jsx'
import SellerShell from './SellerShell.jsx'
import StatePanel from '../../shared/componentes/StatePanel.jsx'
import { fetchSellerUnreadNotificationCount } from '../../seller/api.js'
import { fetchSellerProfile } from '../../auth/api.js'
import { resolveMediaUrl } from '../../shared/utils/media.js'
import { BRAND_NAME } from '../../shared/utils/branding.js'
import {
  clearSellerSession,
  getSellerProfile,
  getSellerToken,
  setSellerSession,
} from '../utils/sellerAuth.js'
import { clearSellerMarketplaceVisit } from '../utils/sellerMarketplaceNav.js'
import { getSellerDefaultPath, getSellerNavItems, sellerHasGestores } from '../../subscriptions/utils/planAccess.js'
import { SellerReadOnlyContext } from './sellerReadOnly.js'
import { getSellerPlan } from '../../subscriptions/utils/constants.js'
import { requestSellerOrdersRefresh } from '../utils/sellerOrdersRefresh.js'
import { requestSellerProductsRefresh } from '../utils/sellerProductsRefresh.js'
import {
  connectSellerEvents,
  OPEN_SELLER_NOTIFICATIONS_EVENT,
  SELLER_NOTIFICATIONS_CHANGED_EVENT,
  startSellerPush,
  stopSellerPush,
} from '../../live/utils'
import { isSessionError, resolveUserFacingError } from '../../shared/utils/userFacingError.js'

function sellerSectionKey(pathname) {
  if (pathname === '/tienda') return 'general'
  if (pathname.startsWith('/tienda/catalogo/vista-previa')) return 'catalog-preview'
  if (pathname.startsWith('/tienda/catalogo')) return 'catalog'
  if (pathname.startsWith('/tienda/pedidos')) return 'orders'
  if (pathname.startsWith('/tienda/notificaciones')) return 'notifications'
  if (pathname.startsWith('/tienda/clientes')) return 'customers'
  if (pathname.startsWith('/tienda/gestores')) return 'gestores'
  if (pathname.startsWith('/tienda/mensajeros')) return 'mensajeros'
  if (pathname.startsWith('/tienda/estadisticas')) return 'stats'
  if (pathname.startsWith('/tienda/perfil')) return 'profile'
  return null
}

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
  const { snapshot: shellSnapshot, commit: commitShell } = useSectionSnapshot('seller', 'shell')
  const rememberedProfile = shellSnapshot?.data?.profile ?? getSellerProfile()
  const [profile, setProfile] = useState(rememberedProfile)
  const [loading, setLoading] = useState(!rememberedProfile)
  const [loadError, setLoadError] = useState(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [liveToasts, setLiveToasts] = useState([])
  const [notificationCount, setNotificationCount] = useState(shellSnapshot?.data?.notificationCount ?? 0)
  const [pendingOrderCount, setPendingOrderCount] = useState(shellSnapshot?.data?.pendingOrderCount ?? 0)
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

  function openNotifications() {
    navigate('/tienda/notificaciones')
  }

  useEffect(() => {
    function onOpenFromPush() {
      openNotifications()
    }
    function onNotificationsChanged() {
      void refreshUnreadCount()
    }
    window.addEventListener(OPEN_SELLER_NOTIFICATIONS_EVENT, onOpenFromPush)
    window.addEventListener(SELLER_NOTIFICATIONS_CHANGED_EVENT, onNotificationsChanged)
    return () => {
      window.removeEventListener(OPEN_SELLER_NOTIFICATIONS_EVENT, onOpenFromPush)
      window.removeEventListener(SELLER_NOTIFICATIONS_CHANGED_EVENT, onNotificationsChanged)
    }
  }, [navigate, refreshUnreadCount])

  useEffect(() => {
    if (profile) return undefined
    let cancelled = false

    async function load() {
      setLoadError(null)
      setLoading(true)
      try {
        const data = await refreshProfile()
        if (!cancelled) setProfile(data)
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
  }, [profile, refreshProfile])

  useEffect(() => {
    if (!profile) return
    commitShell({ profile, notificationCount, pendingOrderCount })
  }, [profile, notificationCount, pendingOrderCount, commitShell])

  useEffect(() => {
    if (!profile?.profile_completed) return undefined

    const token = getSellerToken()
    if (token) startSellerPush(token)
    const stopEvents = token
      ? connectSellerEvents(token, (notification) => {
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
          if (Number.isFinite(Number(event.unread_count))) {
            const next = Number(event.unread_count)
            previousNotificationCountRef.current = next
            setNotificationCount(next)
          }
          if (event.resources?.includes('orders')) requestSellerOrdersRefresh()
          if (event.resources?.includes('products')) requestSellerProductsRefresh()
        })
      : () => {}

    return () => {
      stopEvents()
    }
  }, [profile?.profile_completed])

  const sectionKey = sellerSectionKey(location.pathname)
  const sectionRefreshing = useSectionRefreshing('seller', sectionKey)
  const refreshVisibleShell = useCallback(() => {
    const key = sectionKey || 'shell'
    return runSectionRefresh('seller', key, () => refreshProfile())
  }, [refreshProfile, sectionKey])

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

  const fillPage = isCatalogPage || isCatalogPreview

  return (
    <SellerReadOnlyContext.Provider value={readOnly}>
      <SectionRefreshProvider fallback={refreshVisibleShell}>
      <SellerShell
        refreshing={sectionRefreshing}
        storeName={profile.store_name}
        planName={getSellerPlan(profile).name}
        subscriptionActive={profile.subscription_active}
        onLogout={() => setShowLogoutConfirm(true)}
        onNotifications={openNotifications}
        notificationsActive={location.pathname === '/tienda/notificaciones'}
        notificationCount={notificationCount}
        pendingOrderCount={pendingOrderCount}
        showBottomNav={showBottomNav}
        catalogLayout={fillPage}
        hideChrome={isCatalogPreview}
        navItems={sellerNavItems}
        profilePhotoUrl={resolveMediaUrl(profile.profile_photo_url) || ''}
      >
        <SellerPageMotion
          context={{ profile, refreshProfile }}
          fill={fillPage}
          scroll={showBottomNav && !fillPage}
          contentClassName={fillPage ? '' : (showBottomNav ? sellerMainWithNav : sellerMain)}
        />
      </SellerShell>
      </SectionRefreshProvider>

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
