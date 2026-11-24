import NoticeDateFilter from '../../shared/componentes/NoticeDateFilter.jsx'
import LoadingState from '../../shared/componentes/LoadingState.jsx'
import DeadState from '../../shared/componentes/DeadState.jsx'
import NotificationBodyText from '../../shared/componentes/NotificationBodyText.jsx'
import { resolveMediaUrl } from '../../shared/utils/media.js'
import { formatDate } from '../utils/constants.js'
import { useCustomerAccount } from '../context/CustomerAccountContext.jsx'

export default function CustomerNoticesPage() {
  const {
    paymentNotifications,
    notificationsLoading,
    notificationsError,
    noticesHasMore,
    loadingMoreNotices,
    noticeDateFrom,
    setNoticeDateFrom,
    noticeDateTo,
    setNoticeDateTo,
    loadPaymentNotifications,
    handleMarkNotificationRead,
    handleMarkAllNotificationsRead,
    openPaymentNotification,
    unreadNotificationCount,
  } = useCustomerAccount()

  return (
    <section className="space-y-3">
      <NoticeDateFilter
        from={noticeDateFrom}
        to={noticeDateTo}
        onChange={(from, to) => {
          setNoticeDateFrom(from)
          setNoticeDateTo(to)
        }}
      />
      {notificationsLoading && paymentNotifications.length === 0 ? <LoadingState message="Cargando avisos…" size="sm" /> : null}
      {!notificationsLoading && notificationsError ? (
        <DeadState variant="panel" title="Sin resultados" message={notificationsError}>
          <button type="button" onClick={loadPaymentNotifications} className="min-h-10 rounded-xl bg-brand-green px-4 text-sm font-bold text-brand-white">Reintentar</button>
        </DeadState>
      ) : null}
      {!notificationsLoading && !notificationsError && unreadNotificationCount > 0 ? (
        <div className="flex justify-end">
          <button type="button" onClick={handleMarkAllNotificationsRead} className="min-h-9 rounded-full border border-brand-green/20 bg-brand-white px-3 text-xs font-semibold text-brand-green touch-manipulation active:bg-brand-green/8">
            Marcar todas como leídas
          </button>
        </div>
      ) : null}
      {!notificationsError && paymentNotifications.length ? paymentNotifications.map((notification) => (
        <article key={notification.id} className={`w-full rounded-2xl border p-4 text-left ${notification.read_at ? 'border-brand-green/10 bg-brand-white' : 'border-brand-green/25 bg-brand-green/[0.04]'}`}>
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              {notification.store_name ? <span className="block text-xs font-semibold text-brand-carmelita/70">{notification.store_name}</span> : null}
              <strong className="text-brand-green">{notification.title}</strong>
            </span>
            {!notification.read_at ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-green" aria-label="Sin leer" /> : null}
          </div>
          <NotificationBodyText text={notification.content} className="mt-1 whitespace-pre-line text-sm text-brand-carmelita" />
          {Array.isArray(notification.images) && notification.images.length ? (
            <span className="mt-3 flex flex-wrap gap-2">
              {notification.images.map((image) => (
                <img key={image} src={resolveMediaUrl(image)} alt="" className="h-20 w-20 rounded-xl object-cover" />
              ))}
            </span>
          ) : null}
          <p className="mt-2 text-xs text-brand-carmelita/60">{formatDate(notification.created_at)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {notification.order_id ? (
              <button type="button" onClick={() => openPaymentNotification(notification)} className="min-h-9 rounded-xl bg-brand-green px-3 text-xs font-bold text-brand-white touch-manipulation">
                Ver pedido
              </button>
            ) : null}
            {!notification.read_at ? (
              <button type="button" onClick={() => handleMarkNotificationRead(notification)} className="min-h-9 rounded-xl border border-brand-green/20 bg-brand-white px-3 text-xs font-semibold text-brand-green touch-manipulation active:bg-brand-green/8">
                Marcar como leída
              </button>
            ) : null}
          </div>
        </article>
      )) : null}
      {!notificationsLoading && !notificationsError && !paymentNotifications.length ? (
        <DeadState variant="panel" title="Sin resultados" message={noticeDateFrom || noticeDateTo ? 'No hay avisos en esas fechas.' : 'No tienes avisos.'} />
      ) : null}
      {!notificationsError && noticesHasMore ? (
        <div className="flex justify-center">
          <button type="button" onClick={() => loadPaymentNotifications({ append: true, offset: paymentNotifications.length })} disabled={loadingMoreNotices} className="min-h-11 rounded-xl border border-brand-green/20 bg-brand-white px-5 text-sm font-semibold text-brand-green disabled:opacity-60">
            {loadingMoreNotices ? 'Cargando…' : 'Cargar más avisos'}
          </button>
        </div>
      ) : null}
    </section>
  )
}
