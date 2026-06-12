import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatRelativeTime } from '../../lib/dates'
import RenewPlanButton from './RenewPlanButton'
import SellerModalPortal from './SellerModalPortal'
import LoadingState from '../ui/LoadingState'
import {
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerFocusRing,
  sellerNotificationsOverlay,
  sellerNotificationsPanel,
} from './sellerStyles'

const NOTIFICATION_KIND_EXPIRING = 'subscription_expiring'
const NOTIFICATION_KIND_NEW_ORDER = 'new_order'
const ACTION_VIEW_ORDERS = 'view_orders'

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

function NotificationCard({ notification, onClose, onMarkRead }) {
  const unread = !notification.read_at
  const isExpiring = notification.kind === NOTIFICATION_KIND_EXPIRING
  const isNewOrder = notification.kind === NOTIFICATION_KIND_NEW_ORDER
  const hasViewOrdersAction =
    notification.action_label && notification.action_type === ACTION_VIEW_ORDERS
  const hasRenewAction =
    notification.action_label && notification.action_type === 'renew_subscription'

  async function handleOpen() {
    if (unread) {
      await onMarkRead(notification.id)
    }
  }

  const cardClass = unread
    ? isExpiring
      ? 'border-brand-carmelita/22 bg-gradient-to-br from-brand-yellow/14 to-brand-white'
      : isNewOrder
        ? 'border-brand-yellow/28 bg-gradient-to-br from-brand-yellow/10 to-brand-white'
        : 'border-brand-green/18 bg-brand-green/[0.03]'
    : 'border-brand-green/10 bg-brand-white'

  return (
    <article
      className={`overflow-hidden rounded-2xl border shadow-[0_2px_10px_rgba(89,128,44,0.04)] ${cardClass} ${
        unread ? 'border-l-[3px] border-l-brand-carmelita' : ''
      }`}
    >
      <div className="flex items-start gap-3 p-4">
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

          <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">
            {notification.content}
          </p>

          {(hasViewOrdersAction || hasRenewAction) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {hasViewOrdersAction ? (
                <Link
                  to="/tienda/pedidos"
                  onClick={() => {
                    handleOpen()
                    onClose()
                  }}
                  className={`${sellerBtnPrimary} !min-h-9 !px-4 !py-2 !text-xs`}
                >
                  {notification.action_label}
                </Link>
              ) : null}
              {hasRenewAction ? (
                <RenewPlanButton
                  className="!min-h-9 !px-4 !py-2 !text-xs"
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
              className={`mt-3 ${sellerBtnSecondary} !min-h-9 !px-4 !py-2 !text-xs`}
            >
              Marcar como leída
            </button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default function SellerNotificationsPanel({
  notifications,
  loading,
  onClose,
  onMarkRead,
  onMarkAllSystemRead,
  storeName = '',
}) {
  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read_at).length,
    [notifications],
  )
  const unreadSystemCount = useMemo(
    () => notifications.filter((item) => !item.read_at && !item.from_admin).length,
    [notifications],
  )
  const [markingAll, setMarkingAll] = useState(false)

  async function handleMarkAllSystemRead() {
    if (unreadSystemCount === 0 || markingAll) return
    setMarkingAll(true)
    try {
      await onMarkAllSystemRead()
    } finally {
      setMarkingAll(false)
    }
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <SellerModalPortal>
      <div
        className={sellerNotificationsOverlay}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose()
        }}
      >
        <div
          className={`${sellerNotificationsPanel} h-[min(88dvh,40rem)]`}
          onMouseDown={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="seller-notifications-title"
        >
          <div className="shrink-0 border-b border-brand-green/8 px-5 py-4">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-brand-green/15 sm:hidden" aria-hidden="true" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="seller-notifications-title" className="font-display text-xl font-bold text-brand-green">
                    Notificaciones
                  </h2>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-brand-carmelita px-2.5 py-0.5 text-[0.65rem] font-bold text-brand-white">
                      {unreadCount} sin leer
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-brand-carmelita/80">
                  Pedidos nuevos, pagos y avisos de tu tienda.
                </p>
                {!loading && unreadSystemCount > 0 ? (
                  <button
                    type="button"
                    onClick={handleMarkAllSystemRead}
                    disabled={markingAll}
                    className={`mt-3 ${sellerBtnSecondary} !min-h-9 !px-3 !py-2 !text-xs`}
                  >
                    {markingAll ? 'Marcando…' : 'Marcar todas como leídas'}
                  </button>
                ) : null}
                {!loading && unreadCount > unreadSystemCount ? (
                  <p className="mt-2 text-[0.65rem] text-brand-carmelita/65">
                    Los avisos del administrador debes marcarlos uno a uno.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-carmelita/60 touch-manipulation active:bg-brand-green/8 active:text-brand-carmelita ${sellerFocusRing}`}
                aria-label="Cerrar notificaciones"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {loading ? (
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
                <p className="font-display text-lg font-bold text-brand-green">Estás al día</p>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-brand-carmelita/85">
                  Cuando llegue un pedido o haya novedades sobre tu suscripción, aparecerán aquí.
                </p>
              </div>
            ) : null}

            {!loading && notifications.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <NotificationCard
                      notification={notification}
                      onClose={onClose}
                      onMarkRead={onMarkRead}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-brand-green/8 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button type="button" onClick={onClose} className={`${sellerBtnSecondary} w-full`}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </SellerModalPortal>
  )
}
