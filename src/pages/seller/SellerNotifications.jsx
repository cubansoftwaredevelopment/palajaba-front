import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import NoticeDateFilter from '../../components/filters/NoticeDateFilter'
import RenewPlanButton from '../../components/seller/RenewPlanButton'
import SellerPageHeader from '../../components/seller/SellerPageHeader'
import {
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerPageWrap,
  sellerSectionGap,
} from '../../components/seller/sellerStyles'
import LoadingState from '../../components/ui/LoadingState'
import NotificationBodyText from '../../components/ui/NotificationBodyText'
import {
  fetchSellerNotifications,
  markSellerNotificationRead,
  markSellerSystemNotificationsRead,
} from '../../lib/api'
import { formatRelativeTime } from '../../lib/dates'
import { getSellerToken } from '../../lib/sellerAuth'
import { runSectionRefresh } from '../../session/sectionStore'
import { useRegisterSectionRefresh } from '../../session/useSectionRefresh'
import { useSectionSnapshot } from '../../session/useSectionSnapshot'

const NOTIFICATION_PAGE = 10
import {
  OPEN_SELLER_NOTIFICATIONS_EVENT,
  SELLER_NOTIFICATIONS_CHANGED_EVENT,
} from '../../live/utils'

const NOTIFICATION_KIND_EXPIRING = 'subscription_expiring'
const NOTIFICATION_KIND_NEW_ORDER = 'new_order'
const ACTION_VIEW_ORDERS = 'view_orders'

function notifyChanged() {
  window.dispatchEvent(new CustomEvent(SELLER_NOTIFICATIONS_CHANGED_EVENT))
}

function NotificationIcon({ kind }) {
  const isExpiring = kind === NOTIFICATION_KIND_EXPIRING
  const isNewOrder = kind === NOTIFICATION_KIND_NEW_ORDER
  const shellClass = isExpiring
    ? 'bg-brand-yellow/25 text-brand-carmelita'
    : isNewOrder
      ? 'bg-brand-yellow/20 text-brand-green'
      : 'bg-brand-green/10 text-brand-green'

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${shellClass}`}
      aria-hidden="true"
    >
      {isExpiring ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ) : isNewOrder ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )}
    </div>
  )
}

function NotificationCard({ notification, onMarkRead, storeName = '' }) {
  const unread = !notification.read_at
  const hasViewOrdersAction =
    notification.action_label && notification.action_type === ACTION_VIEW_ORDERS
  const hasRenewAction =
    notification.action_label && notification.action_type === 'renew_subscription'

  async function handleOpen() {
    if (unread) await onMarkRead(notification.id)
  }

  return (
    <article className="py-4">
      <div className="flex items-start gap-3">
        <NotificationIcon kind={notification.kind} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {unread ? (
              <span className="rounded-full bg-brand-carmelita px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.04em] text-brand-white">
                Nueva
              </span>
            ) : null}
            <h3 className="text-sm font-bold text-brand-green">{notification.title}</h3>
          </div>
          <p className="mt-1 text-[0.7rem] font-medium text-brand-carmelita/70">
            {formatRelativeTime(notification.created_at)}
          </p>
          <NotificationBodyText
            text={notification.content}
            className="mt-2 whitespace-pre-line text-sm leading-relaxed text-brand-carmelita/90"
          />
          {(hasViewOrdersAction || hasRenewAction) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {hasViewOrdersAction ? (
                <Link
                  to="/tienda/pedidos"
                  onClick={handleOpen}
                  className={`${sellerBtnPrimary} !min-h-9 !w-auto !px-4 !py-2 !text-xs`}
                >
                  {notification.action_label}
                </Link>
              ) : null}
              {hasRenewAction ? (
                <RenewPlanButton
                  className="!min-h-9 !w-auto !px-4 !py-2 !text-xs"
                  size="compact"
                  storeName={storeName}
                />
              ) : null}
            </div>
          )}
          {unread && !hasViewOrdersAction && !hasRenewAction ? (
            <button
              type="button"
              onClick={handleOpen}
              className={`mt-3 ${sellerBtnSecondary} !min-h-9 !w-auto !px-4 !py-2 !text-xs`}
            >
              Marcar como leída
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default function SellerNotifications() {
  const { profile } = useOutletContext()
  const storeName = profile?.store_name || ''
  const { snapshot, commit, skipInitialRef } = useSectionSnapshot('seller', 'notifications')
  const cachedNotes = snapshot?.data
  const [notifications, setNotifications] = useState(cachedNotes?.items ?? [])
  const [hasMore, setHasMore] = useState(Boolean(cachedNotes?.hasMore))
  const [loading, setLoading] = useState(snapshot == null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [dateFrom, setDateFrom] = useState(snapshot?.query?.dateFrom ?? '')
  const [dateTo, setDateTo] = useState(snapshot?.query?.dateTo ?? '')
  const [markingAll, setMarkingAll] = useState(false)
  const notificationsRef = useRef(notifications)
  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read_at).length,
    [notifications],
  )
  const unreadSystemCount = useMemo(
    () => notifications.filter((item) => !item.read_at && !item.from_admin).length,
    [notifications],
  )
  const datesActive = Boolean(dateFrom || dateTo)

  const loadNotifications = useCallback(async ({ silent = false, append = false, offset = 0 } = {}) => {
    const token = getSellerToken()
    if (!token) return
    if (append) setLoadingMore(true)
    else if (!silent && notificationsRef.current.length === 0) setLoading(true)
    try {
      const page = await fetchSellerNotifications(token, {
        dateFrom,
        dateTo,
        offset,
        limit: NOTIFICATION_PAGE,
        paged: true,
      })
      const items = Array.isArray(page?.items) ? page.items : []
      const next = append ? [...notificationsRef.current, ...items] : items
      setNotifications(next)
      setHasMore(Boolean(page?.has_more))
      commit({ items: next, hasMore: Boolean(page?.has_more) }, { dateFrom, dateTo })
    } catch {
      if (!silent && !append) {
        setNotifications([])
        setHasMore(false)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [dateFrom, dateTo, commit])

  useEffect(() => {
    if (skipInitialRef.current) return
    void loadNotifications()
  }, [loadNotifications])

  useRegisterSectionRefresh(() => runSectionRefresh('seller', 'notifications', () => loadNotifications({ silent: true })))

  useEffect(() => {
    function onOpen() {
      void loadNotifications()
    }
    window.addEventListener(OPEN_SELLER_NOTIFICATIONS_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_SELLER_NOTIFICATIONS_EVENT, onOpen)
  }, [loadNotifications])

  async function handleMarkRead(notificationId) {
    const token = getSellerToken()
    if (!token) return
    try {
      const updated = await markSellerNotificationRead(token, notificationId)
      const next = notifications.map((item) => (item.id === updated.id ? updated : item))
      setNotifications(next)
      commit({ items: next, hasMore }, { dateFrom, dateTo })
      notifyChanged()
    } catch {
      notifyChanged()
    }
  }

  async function handleMarkAllSystemRead() {
    const token = getSellerToken()
    if (!token || unreadSystemCount === 0 || markingAll) return
    setMarkingAll(true)
    try {
      await markSellerSystemNotificationsRead(token)
      await loadNotifications()
      notifyChanged()
    } catch {
      notifyChanged()
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className={`${sellerPageWrap} ${sellerSectionGap}`}>
      <SellerPageHeader
        title="Notificaciones"
        subtitle="Pedidos nuevos, pagos y avisos de tu tienda."
        align="start"
        action={unreadCount > 0 ? (
          <span className="rounded-full bg-brand-carmelita px-2.5 py-0.5 text-[0.65rem] font-bold text-brand-white">
            {unreadCount} sin leer
          </span>
        ) : null}
      />

      <NoticeDateFilter
        from={dateFrom}
        to={dateTo}
        onChange={(from, to) => {
          setDateFrom(from)
          setDateTo(to)
        }}
      />

      {!loading && unreadSystemCount > 0 ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleMarkAllSystemRead}
            disabled={markingAll}
            className={`${sellerBtnSecondary} !min-h-9 !w-auto !px-3 !py-2 !text-xs`}
          >
            {markingAll ? 'Marcando…' : 'Marcar todas como leídas'}
          </button>
        </div>
      ) : null}

      {loading && notifications.length === 0 ? (
        <LoadingState variant="compact" message="Cargando avisos…" className="py-14" />
      ) : null}

      {!loading && notifications.length === 0 ? (
        <div className="flex flex-col items-center px-2 py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-yellow/20 text-brand-green">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="font-display text-lg font-bold text-brand-green">
            {datesActive ? 'Sin avisos' : 'Estás al día'}
          </p>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-brand-carmelita/85">
            {datesActive
              ? 'No hay avisos en esas fechas.'
              : 'Cuando llegue un pedido o haya novedades sobre tu suscripción, aparecerán aquí.'}
          </p>
        </div>
      ) : null}

      {notifications.length > 0 ? (
        <ul className="flex flex-col divide-y divide-neutral-300">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <NotificationCard
                notification={notification}
                onMarkRead={handleMarkRead}
                storeName={storeName}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {hasMore ? (
        <button
          type="button"
          onClick={() => loadNotifications({ append: true, offset: notifications.length, silent: true })}
          disabled={loadingMore}
          className={`${sellerBtnSecondary} mx-auto !min-h-10 !w-auto !px-4 !py-2 !text-sm`}
        >
          {loadingMore ? 'Cargando…' : 'Cargar más avisos'}
        </button>
      ) : null}
    </div>
  )
}
