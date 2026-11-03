import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { fetchCustomerOrders, fetchCustomerProfile, addCustomerAddress, updateCustomerAddress, deleteCustomerAddress, uploadCustomerPhoto, startCustomerEmailOtp, startCustomerPhoneOtp, confirmCustomerContactOtp, updateCustomerIdentityCard, fetchCustomerPaymentNotifications, markCustomerPaymentNotificationRead, decideCustomerOrderEvidence } from '../api.js'
import { clearCustomerSession, getCustomerToken, updateCustomerProfile } from '../../lib/customerAuth'
import { fetchMarketplaceProduct } from '../api.js'
import { getBuyerLocation } from '../../lib/buyerLocation'
import { resolveMediaUrl } from '../../lib/media'
import { formatPrice } from '../../lib/money'
import { canRespondToQvaPayEvidence, QVAPAY_EVIDENCE_WARNING } from '../../lib/qvapayEvidence.js'
import BuyerOrderLocationMap from '../components/BuyerOrderLocationMap'
import BuyerProductCard from '../components/BuyerProductCard'
import BuyerModalPortal from '../components/BuyerModalPortal'
import Logo from '../../components/Logo'
import SellerLogoutModal from '../../components/seller/SellerLogoutModal'
import SellerNotificationToast from '../../components/seller/SellerNotificationToast'
import { orderModalMotionClass, useDismissibleModal, useOrderModalPresence } from '../components/useOrderModalPresence'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { connectCustomerEvents, startCustomerPush, stopCustomerPush } from '../../live/utils'
import { fetchRenewalContactPhone } from '../../subscriptions/api.js'
import { buildWhatsAppUrl } from '../../lib/whatsappOrder'
import { openExternalUrl } from '../../lib/nativeApp'
import SellerFilterDropdown from '../../components/seller/SellerFilterDropdown'
import SellerModalPortal from '../../components/seller/SellerModalPortal'
import { sellerModalOverlay, sellerModalSheet } from '../../components/seller/sellerStyles'
import AdminDateRangeControls, { rangeForPeriod } from '../../components/admin/AdminDateRangeControls'

const sectionClass = 'rounded-2xl border border-brand-green/10 bg-brand-white p-4 shadow-sm sm:p-6'
const statusLabel = { pending_confirmation: 'Por procesar', completed: 'Completado', cancelled: 'Cancelado' }
function getBuyerOrderStatusLabel(order) {
  const evidenceStatus = order.payment_method === 'qvapay' ? order.qvapay?.evidence?.status : null
  if (evidenceStatus === 'pending') return 'Evidencia enviada'
  if (evidenceStatus === 'rejected') return 'Evidencia rechazada'
  return statusLabel[order.status] || order.status
}

function needsBuyerOrderAttention(order) {
  return order.payment_method === 'qvapay'
    && ['pending', 'rejected'].includes(order.qvapay?.evidence?.status)
}

function orderIsInRange(order, range) {
  if (!range?.from || !range?.to) return true
  const date = new Date(order.created_at)
  const from = new Date(range.from)
  const to = new Date(range.to)
  if ([date, from, to].some((value) => Number.isNaN(value.getTime()))) return false
  from.setHours(0, 0, 0, 0)
  to.setHours(23, 59, 59, 999)
  return date >= from && date <= to
}

const CUSTOMER_NAV = [
  { id: 'pedidos', path: '/cliente/pedidos', label: 'Mis pedidos', icon: <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" /> },
  { id: 'favoritos', path: '/cliente/favoritos', label: 'Guardados', icon: <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-4-6 4V4.75Z" /> },
  { id: 'direcciones', path: '/cliente/direcciones', label: 'Direcciones', icon: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></> },
  { id: 'perfil', path: '/cliente/perfil', label: 'Perfil', icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></> },
]

function formatDate(value) {
  const dateValue = parseDateValue(value)
  if (!dateValue) return '—'
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(dateValue)
}

function parseDateValue(value) {
  if (!value) return null
  let parsed
  if (typeof value === 'string') {
    const normalized = value.trim().replace(/(\.\d{3})\d+/, '$1')
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
    parsed = new Date(isDateOnly
      ? `${normalized}T00:00:00`
      : hasTimezone ? normalized : `${normalized}Z`)
  } else {
    parsed = new Date(value)
  }
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function QvaPayReleaseCountdown({ deadline, compact = false }) {
  const [now, setNow] = useState(Date.now)
  const deadlineMs = parseDateValue(deadline)?.getTime()

  useEffect(() => {
    if (!deadlineMs) return undefined
    setNow(Date.now())
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [deadlineMs])

  if (!deadlineMs) return null
  const remainingMs = deadlineMs - now
  if (remainingMs <= 0) {
    return (
      <p className={compact ? 'mt-2 pl-1 text-xs font-semibold text-amber-900' : 'mt-2 text-sm font-semibold text-amber-900'}>
        El plazo venció. La liberación del pago está en proceso.
      </p>
    )
  }

  const totalSeconds = Math.floor(remainingMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const countdown = days > 0
    ? `${days} d ${String(hours).padStart(2, '0')} h ${String(minutes).padStart(2, '0')} min ${String(seconds).padStart(2, '0')} s`
    : `${String(hours).padStart(2, '0')} h ${String(minutes).padStart(2, '0')} min ${String(seconds).padStart(2, '0')} s`

  return (
    <p className={compact ? 'mt-2 pl-1 text-xs font-semibold text-amber-900' : 'mt-2 text-sm font-semibold text-amber-900'} aria-live="off">
      Liberación automática del pago en: <span className="tabular-nums">{countdown}</span>
    </p>
  )
}

function EvidenceNode({ node }) {
  if (!node) return null
  if (node.type === 'text') {
    let child = node.text || ''
    for (const mark of node.marks || []) {
      if (mark.type === 'bold') child = <strong>{child}</strong>
      else if (mark.type === 'italic') child = <em>{child}</em>
      else if (mark.type === 'strike') child = <s>{child}</s>
    }
    return child
  }
  if (node.type === 'image') return <img src={node.attrs?.src} alt="Imagen de evidencia" className="my-2 max-h-72 rounded-xl object-contain" />
  const children = (node.content || []).map((child, index) => <EvidenceNode key={`${child.type}-${index}`} node={child} />)
  if (node.type === 'paragraph') return <p className="my-2 min-h-4">{children}</p>
  if (node.type === 'heading') return <h4 className="my-2 font-bold">{children}</h4>
  if (node.type === 'bulletList') return <ul className="my-2 list-disc pl-5">{children}</ul>
  if (node.type === 'orderedList') return <ol className="my-2 list-decimal pl-5">{children}</ol>
  if (node.type === 'listItem') return <li>{children}</li>
  if (node.type === 'blockquote') return <blockquote className="my-2 border-l-2 border-brand-green/30 pl-3">{children}</blockquote>
  if (node.type === 'hardBreak') return <br />
  return <>{children}</>
}

function EvidenceContent({ content }) {
  return <div className="prose prose-sm max-w-none break-words text-brand-carmelita">{(content?.content || []).map((node, index) => <EvidenceNode key={`${node.type}-${index}`} node={node} />)}</div>
}

function getEvidenceSupportWhatsAppUrl(phone, order) {
  const message = `Hola, necesito ayuda con la evidencia rechazada del pedido #${String(order?.id || '').slice(-6).toUpperCase()} en Pa' La Jaba.`
  return buildWhatsAppUrl(phone, message) || `https://wa.me/?text=${encodeURIComponent(message)}`
}

function normalizedPhoneDigits(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.startsWith('53') && digits.length === 10 ? digits.slice(2) : digits
}

function CustomerOrderDetailModal({ order, onClose, onUpdated }) {
  const { dismiss, motionClass } = useDismissibleModal(onClose)
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [decisionError, setDecisionError] = useState('')
  const [supportAvailable, setSupportAvailable] = useState(false)
  const [supportPhone, setSupportPhone] = useState('')
  const qvapay = order.qvapay
  const evidence = qvapay?.evidence
  const supportUrl = getEvidenceSupportWhatsAppUrl(supportPhone, order)

  useEffect(() => {
    let cancelled = false
    fetchRenewalContactPhone()
      .then((data) => { if (!cancelled) setSupportPhone(data?.renewal_contact_phone || '') })
      .catch(() => { if (!cancelled) setSupportPhone('') })
    return () => { cancelled = true }
  }, [order.id])

  useEffect(() => {
    setSupportAvailable(evidence?.status === 'rejected')
  }, [evidence?.status, order.id])

  async function decideEvidence(accept) {
    setDecisionLoading(true); setDecisionError('')
    try {
      await decideCustomerOrderEvidence(order.id, accept, getCustomerToken())
      if (!accept) setSupportAvailable(true)
      await onUpdated?.()
    } catch (cause) { setDecisionError(getUserFacingMessage(cause, 'No pudimos guardar tu respuesta.')) }
    finally { setDecisionLoading(false) }
  }

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [dismiss])

  return (
    <BuyerModalPortal>
      <div
        className={`fixed inset-0 z-[120] flex items-end justify-center bg-brand-green/25 p-0 backdrop-blur-[3px] sm:items-center sm:p-4 ${motionClass}`}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) dismiss()
        }}
      >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-order-detail-title"
        className="relative flex max-h-[min(92dvh,44rem)] min-h-0 w-full max-w-2xl animate-fade-in flex-col overflow-y-auto rounded-t-3xl border border-brand-green/12 bg-brand-white p-5 shadow-[0_24px_60px_rgba(89,128,44,0.22)] sm:rounded-3xl sm:p-6"
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-brand-green/15 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-carmelita/60">Detalle del pedido</p>
            <h2 id="customer-order-detail-title" className="mt-1 text-xl font-bold text-brand-green">{order.store_name}</h2>
            <p className="mt-1 text-sm text-brand-carmelita/70">{formatDate(order.created_at)}</p>
          </div>
          <button type="button" onClick={dismiss} aria-label="Cerrar detalle" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl text-brand-carmelita/70 hover:bg-brand-green/10">×</button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-green/5 p-3">
          <span className="text-sm font-semibold">Estado</span>
          <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">{getBuyerOrderStatusLabel(order)}</span>
        </div>

        {order.payment_method === 'qvapay' ? (
          <section className="mt-4 rounded-2xl border border-brand-green/12 bg-brand-green/[0.035] p-4">
            <h3 className="font-bold text-brand-green">Pago protegido por Pa’ La Jaba</h3>
            {qvapay?.payment_status === 'awaiting_payment' && qvapay.invoice_url ? (
              <a href={qvapay.invoice_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-green px-4 font-bold text-white">Abrir factura QvaPay</a>
            ) : null}
            {qvapay?.payment_status === 'paid' && evidence?.status !== 'pending' && evidence?.status !== 'accepted' && evidence?.status !== 'expired' ? (
              <p className="mt-2 text-sm text-brand-carmelita">El pago está retenido. La tienda aún debe enviar la evidencia de entrega.</p>
            ) : null}
            {canRespondToQvaPayEvidence(qvapay) ? (
              <>
                <p className="mt-2 text-sm font-semibold text-brand-carmelita">La evidencia vence: {formatDate(evidence.deadline)}.</p>
                {evidence.status === 'pending' ? <QvaPayReleaseCountdown deadline={evidence.deadline} /> : null}
                <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold leading-relaxed text-amber-950">
                  {QVAPAY_EVIDENCE_WARNING}
                </div>
                <div className="mt-3 rounded-xl border border-brand-green/10 bg-white p-3"><EvidenceContent content={evidence.content} /></div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" disabled={decisionLoading} onClick={() => decideEvidence(false)} className="min-h-11 min-w-0 rounded-xl border border-brand-green/20 px-2 py-2 text-center text-xs font-bold leading-tight text-brand-green disabled:opacity-50 sm:text-sm">{decisionLoading ? 'Guardando…' : 'No recibí el pedido · Rechazar'}</button>
                  <button type="button" disabled={decisionLoading} onClick={() => decideEvidence(true)} className="min-h-11 min-w-0 rounded-xl bg-brand-green px-2 py-2 text-center text-xs font-bold leading-tight text-white disabled:opacity-50 sm:text-sm">{decisionLoading ? 'Guardando…' : 'Recibí el pedido · Aceptar'}</button>
                </div>
              </>
            ) : null}
            {evidence?.status === 'rejected' ? <p className="mt-2 text-sm text-brand-carmelita">Rechazaste la evidencia. El pago sigue retenido mientras contactas a soporte o la tienda envía otra evidencia.</p> : null}
            {supportAvailable || evidence?.status === 'rejected' ? <a className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-green/20 px-4 font-bold text-brand-green" href={supportUrl} onClick={(event) => { event.preventDefault(); openExternalUrl(supportUrl) }} target="_blank" rel="noreferrer">Contactar soporte de Pa’ La Jaba</a> : null}
            {decisionError ? <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{decisionError}</p> : null}
          </section>
        ) : null}

        <h3 className="mt-5 font-bold">Artículos</h3>
        <ul className="mt-2 divide-y divide-brand-green/10 rounded-xl border border-brand-green/10 px-3">
          {(order.items ?? []).map((item, index) => (
            <li key={`${item.product_id ?? item.name}-${index}`} className="flex items-start justify-between gap-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-green/5 ring-1 ring-brand-green/10">
                  {item.image_url ? (
                    <img src={resolveMediaUrl(item.image_url, { width: 160 })} alt={item.name || 'Artículo del pedido'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-brand-carmelita/55">Sin foto</div>
                  )}
                </div>
                <div className="min-w-0">
                <p className="font-medium">{item.name || 'Producto'}</p>
                <p className="mt-0.5 text-xs text-brand-carmelita/65">{item.quantity} × {formatPrice(item.unit_price, item.currency)}</p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold">{formatPrice(item.line_total ?? item.unit_price * item.quantity, item.currency)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 divide-y divide-brand-green/10 rounded-xl border border-brand-green/10 px-3">
          {(order.subtotals ?? []).map((entry) => (
            <div key={entry.currency} className="flex justify-between gap-4 py-3 text-sm">
              <dt>Subtotal de artículos · {entry.currency}</dt>
              <dd className="font-bold">{formatPrice(entry.amount, entry.currency)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 py-3 text-sm">
            <dt>Mensajería</dt>
            <dd className="text-right font-bold">{order.delivery_requested && order.delivery_price != null ? formatPrice(order.delivery_price, order.delivery_currency || 'CUP') : 'No solicitada · 0'}</dd>
          </div>
        </dl>

        {order.completed_at ? <p className="mt-4 text-xs text-brand-carmelita/65">Completado: {formatDate(order.completed_at)}</p> : null}
      </section>
      </div>
    </BuyerModalPortal>
  )
}

function CustomerNavigation({ mobile = false, hasOrderWarning = false }) {
  return (
    <nav className={mobile ? 'fixed bottom-0 left-0 right-0 z-30 border-t border-brand-green/10 bg-brand-white/95 shadow-[0_-4px_24px_rgba(89,128,44,0.08)] backdrop-blur-md lg:hidden' : 'hidden lg:flex lg:flex-col lg:gap-1'} style={mobile ? { paddingBottom: 'max(0.375rem, var(--safe-bottom))' } : undefined} aria-label="Secciones de tu cuenta">
      <div className={mobile ? 'mx-auto flex w-full max-w-md items-stretch px-1' : 'flex flex-col gap-1'}>
        {CUSTOMER_NAV.map((item) => <NavLink key={item.id} to={item.path} className={mobile ? 'min-w-0 flex-1' : 'block'}>
          {({ isActive }) => <span className={mobile
            ? `flex flex-col items-center justify-center gap-0.5 py-1.5 text-[0.625rem] font-semibold text-center touch-manipulation ${isActive ? 'text-brand-green' : 'text-brand-carmelita/65'}`
            : `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-brand-green text-white' : 'text-brand-carmelita/80 hover:bg-brand-green/8 hover:text-brand-green'}`}>
            <span className={mobile ? `relative flex h-9 w-9 items-center justify-center rounded-xl ${isActive ? 'bg-brand-green text-white' : ''}` : 'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-current/10'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.icon}</svg>
              {item.id === 'pedidos' && hasOrderWarning ? <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[0.65rem] font-extrabold leading-none text-white ring-2 ring-brand-white" aria-label="Pedidos que requieren atención">!</span> : null}
            </span>
            <span className={mobile ? 'w-full truncate px-0.5' : ''}>{item.label}</span>
          </span>}
        </NavLink>)}
      </div>
    </nav>
  )
}

export default function CustomerAccount() {
  const navigate = useNavigate()
  const location = useLocation()
  const section = location.pathname === '/cliente/avisos'
    ? 'avisos'
    : CUSTOMER_NAV.find((item) => item.path === location.pathname)?.id || 'perfil'
  const token = getCustomerToken()
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [paymentNotifications, setPaymentNotifications] = useState([])
  const [liveNotificationToast, setLiveNotificationToast] = useState(null)
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsError, setNotificationsError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [favoriteProducts, setFavoriteProducts] = useState([])
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFiltersOpen, setOrderFiltersOpen] = useState(false)
  const { present: orderFiltersPresent, closing: orderFiltersClosing } = useOrderModalPresence(orderFiltersOpen)
  const [storeFilter, setStoreFilter] = useState('')
  const [productFilters, setProductFilters] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [datePeriod, setDatePeriod] = useState('daily')
  const [dateRange, setDateRange] = useState(() => rangeForPeriod('daily'))
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [addressOpen, setAddressOpen] = useState(false)
  const { present: addressPresent, closing: addressClosing } = useOrderModalPresence(addressOpen)
  const addressMotionClass = orderModalMotionClass(addressClosing)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressText, setAddressText] = useState('')
  const [point, setPoint] = useState(null)
  const [savingAddress, setSavingAddress] = useState(false)
  const [contactDraft, setContactDraft] = useState({ email: '', phone: '', identity_card: '' })
  const [contactChallenge, setContactChallenge] = useState(null)
  const [contactCode, setContactCode] = useState('')
  const [contactLoading, setContactLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  const loadPaymentNotifications = useCallback(async () => {
    setNotificationsLoading(true)
    setNotificationsError('')
    try {
      const notifications = await fetchCustomerPaymentNotifications(token)
      setPaymentNotifications(Array.isArray(notifications) ? notifications : [])
    } catch (cause) {
      setNotificationsError(getUserFacingMessage(cause, 'No pudimos cargar tus avisos.'))
      setPaymentNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }, [token])

  const refreshCustomerOrders = useCallback(async () => {
    try {
      const customerOrders = await fetchCustomerOrders(token)
      setOrders(customerOrders)
      setSelectedOrder((current) => current
        ? customerOrders.find((order) => order.id === current.id) ?? current
        : current)
    } catch {
      /* El siguiente evento o la actualización manual volverá a sincronizar los pedidos. */
    }
  }, [token])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [customer, customerOrders] = await Promise.all([
        fetchCustomerProfile(token), fetchCustomerOrders(token),
      ])
      setProfile(customer)
      setContactDraft({ email: customer.email || '', phone: customer.phone || '', identity_card: customer.identity_card || '' })
      updateCustomerProfile(customer)
      setOrders(customerOrders)
      setSelectedOrder((current) => current ? customerOrders.find((order) => order.id === current.id) ?? current : current)
      void loadPaymentNotifications()
      const location = getBuyerLocation()
      const ids = customer.favorite_product_ids ?? []
      const savedById = new Map((customer.favorites ?? []).map((product) => [product.id, product]))
      if (location?.province?.id && location?.municipality?.id && ids.length) {
        const results = await Promise.allSettled(ids.map((productId) => fetchMarketplaceProduct({ productId, provinceId: location.province.id, municipalityId: location.municipality.id })))
        setFavoriteProducts(results.map((result, index) => {
          if (result.status !== 'fulfilled') {
            return { ...(savedById.get(ids[index]) ?? { id: ids[index], name: 'Oferta guardada' }), unavailable_in_municipality: location.municipality.name }
          }
          return result.value.pickup_required
            ? { ...result.value, warning_municipality: location.municipality.name }
            : result.value
        }))
      } else {
        setFavoriteProducts(ids.map((id) => ({ ...(savedById.get(id) ?? { id, name: 'Oferta guardada' }), unavailable_in_municipality: true })))
      }
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos cargar tu cuenta.'))
    } finally { setLoading(false) }
  }, [loadPaymentNotifications, token])

  useEffect(() => {
    queueMicrotask(() => { void load() })
  }, [load])

  useEffect(() => {
    if (!token) return undefined
    void startCustomerPush(token)
    return () => { void stopCustomerPush(token) }
  }, [token])

  useEffect(() => {
    if (!token) return undefined
    return connectCustomerEvents(token, (notification) => {
      setPaymentNotifications((current) => current.some((item) => item.id === notification.id)
        ? current
        : [notification, ...current])
      setLiveNotificationToast({
        id: notification.id,
        title: notification.title,
        content: notification.content,
      })
      void refreshCustomerOrders()
    }, () => {
      void refreshCustomerOrders()
      void loadPaymentNotifications()
    })
  }, [loadPaymentNotifications, refreshCustomerOrders, token])

  async function openPaymentNotification(notification) {
    try {
      const updated = notification.read_at ? notification : await markCustomerPaymentNotificationRead(token, notification.id)
      setPaymentNotifications((current) => current.map((item) => item.id === notification.id ? updated : item))
      const order = orders.find((item) => item.id === notification.order_id)
      if (order) setSelectedOrder(order)
      else await load()
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos abrir la notificación.'))
    }
  }

  async function saveAddress(event) {
    event.preventDefault()
    if (!point) {
      setError('Marca la ubicación de esta dirección en el mapa.')
      return
    }
    setSavingAddress(true)
    setError('')
    try {
      const addressPayload = {
        label: addressText.trim().slice(0, 48),
        address: addressText.trim(),
        latitude: point.lat,
        longitude: point.lng,
      }
      const next = editingAddress
        ? await updateCustomerAddress(token, editingAddress.id, addressPayload)
        : await addCustomerAddress(token, addressPayload)
      setProfile(next)
      updateCustomerProfile(next)
      setAddressOpen(false)
      setEditingAddress(null)
      setAddressText('')
      setPoint(null)
    } catch (cause) { setError(getUserFacingMessage(cause, 'No pudimos guardar la dirección.')) }
    finally { setSavingAddress(false) }
  }

  async function removeAddress(id) {
    try {
      const next = await deleteCustomerAddress(token, id)
      setProfile(next)
      updateCustomerProfile(next)
    } catch (cause) { setError(getUserFacingMessage(cause, 'No pudimos eliminar la dirección.')) }
  }

  function openNewAddress() {
    setEditingAddress(null)
    setAddressText('')
    setPoint(null)
    setAddressOpen(true)
  }

  function openEditAddress(address) {
    setEditingAddress(address)
    setAddressText(address.address || '')
    setPoint(address.latitude != null && address.longitude != null
      ? { lat: address.latitude, lng: address.longitude }
      : null)
    setAddressOpen(true)
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const next = await uploadCustomerPhoto(token, file)
      setProfile(next)
      updateCustomerProfile(next)
    } catch (cause) { setError(getUserFacingMessage(cause, 'No pudimos actualizar la foto.')) }
    event.target.value = ''
  }

  async function startContactChange(kind) {
    setContactLoading(true)
    setProfileError('')
    setProfileMessage('')
    try {
      const result = kind === 'email'
        ? await startCustomerEmailOtp(token, contactDraft.email.trim().toLowerCase())
        : await startCustomerPhoneOtp(token, contactDraft.phone)
      if (result.otp_bypassed) {
        const updated = await confirmCustomerContactOtp(token, result.challenge_id, '000000')
        setProfile(updated)
        setContactDraft((current) => ({ ...current, email: updated.email, phone: updated.phone, identity_card: updated.identity_card }))
        updateCustomerProfile(updated)
        setProfileMessage(kind === 'email' ? 'Correo actualizado.' : 'Teléfono actualizado.')
      } else {
        setContactChallenge({ id: result.challenge_id, kind })
        setContactCode('')
        setProfileMessage(result.message)
      }
    } catch (cause) {
      setProfileError(getUserFacingMessage(cause, 'No pudimos iniciar la verificación.'))
    } finally { setContactLoading(false) }
  }

  async function confirmContactChange(event) {
    event.preventDefault()
    setContactLoading(true)
    setProfileError('')
    try {
      const updated = await confirmCustomerContactOtp(token, contactChallenge.id, contactCode)
      setProfile(updated)
      setContactDraft((current) => ({ ...current, email: updated.email, phone: updated.phone, identity_card: updated.identity_card }))
      updateCustomerProfile(updated)
      setContactChallenge(null)
      setContactCode('')
      setProfileMessage(contactChallenge.kind === 'email' ? 'Correo verificado y actualizado.' : 'Teléfono verificado y actualizado.')
    } catch (cause) {
      setProfileError(getUserFacingMessage(cause, 'No pudimos verificar el código.'))
    } finally { setContactLoading(false) }
  }

  async function saveIdentityCard(event) {
    event.preventDefault()
    setContactLoading(true)
    setProfileError('')
    setProfileMessage('')
    try {
      const updated = await updateCustomerIdentityCard(token, contactDraft.identity_card)
      setProfile(updated)
      setContactDraft((current) => ({ ...current, identity_card: updated.identity_card }))
      updateCustomerProfile(updated)
      setProfileMessage('Carnet actualizado.')
    } catch (cause) {
      setProfileError(getUserFacingMessage(cause, 'No pudimos actualizar el carnet.'))
    } finally { setContactLoading(false) }
  }

  function logout() {
    clearCustomerSession()
    navigate('/', { replace: true })
  }

  const unreadNotificationCount = paymentNotifications.filter((notification) => !notification.read_at).length
  const hasOrderWarning = orders.some(needsBuyerOrderAttention)
  const orderFilterOptions = useMemo(() => ({
    stores: [...new Set(orders.map((order) => order.store_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    products: [...new Set(orders.flatMap((order) => (order.items || []).map((item) => item.name).filter(Boolean)))].sort((a, b) => a.localeCompare(b, 'es')),
    statuses: [...new Set(orders.map(getBuyerOrderStatusLabel).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    currencies: [...new Set(orders.flatMap((order) => [order.payment_currency, ...(order.subtotals || []).map((entry) => entry.currency)].filter(Boolean)))].sort(),
  }), [orders])
  const visibleCustomerOrders = useMemo(() => {
    const query = orderSearch.trim().toLocaleLowerCase('es')
    return orders.filter((order) => {
      const searchable = [
        order.store_name,
        order.id?.slice(-6),
        getBuyerOrderStatusLabel(order),
        ...(order.items || []).map((item) => item.name),
      ].filter(Boolean).join(' ').toLocaleLowerCase('es')
      if (query && !searchable.includes(query)) return false
      if (storeFilter && order.store_name !== storeFilter) return false
      if (productFilters.length && !order.items?.some((item) => productFilters.includes(item.name))) return false
      if (statusFilter && getBuyerOrderStatusLabel(order) !== statusFilter) return false
      if (currencyFilter && order.payment_currency !== currencyFilter && !order.subtotals?.some((entry) => entry.currency === currencyFilter)) return false
      if (deliveryFilter === 'yes' && !order.delivery_requested) return false
      if (deliveryFilter === 'no' && order.delivery_requested) return false
      if (dateFilterEnabled && !orderIsInRange(order, dateRange)) return false
      return true
    })
  }, [orders, orderSearch, storeFilter, productFilters, statusFilter, currencyFilter, deliveryFilter, dateFilterEnabled, dateRange])
  const activeOrderFilterCount = [storeFilter, ...productFilters, statusFilter, currencyFilter, deliveryFilter].filter(Boolean).length + (dateFilterEnabled ? 1 : 0)

  return (
    <div className="min-h-dvh bg-brand-green/[0.035] text-brand-carmelita lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-brand-green/10 bg-brand-white/70 px-3 py-6 lg:block">
        <Link
          to="/comprar"
          className="mb-8 block px-3 text-sm font-bold text-brand-green"
        >
          ← Seguir comprando
        </Link>
        <CustomerNavigation hasOrderWarning={hasOrderWarning} />
      </aside>
      <main className="min-w-0 flex-1 pb-[calc(5.5rem+var(--safe-bottom))] lg:pb-8">
        <header className="z-20 shrink-0 border-b border-brand-green/8 bg-brand-white/95 px-4 pt-[max(0.75rem,var(--safe-top))] pb-3 backdrop-blur-md sm:px-5 lg:px-8 lg:pt-[max(1rem,var(--safe-top))] lg:pb-4">
          <div className="mx-auto flex w-full max-w-md items-center gap-2.5 sm:gap-3 lg:max-w-none">
            <Logo className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
            <p className="min-w-0 flex-1 truncate font-display text-sm font-bold text-brand-green sm:text-base lg:text-lg">
              Bienvenido{' '}
              <span className="text-brand-carmelita">{profile?.full_name || ''}</span>
            </p>
            <NavLink
              to="/cliente/avisos"
              aria-label={unreadNotificationCount ? `Notificaciones, ${unreadNotificationCount} sin leer` : 'Notificaciones'}
              title="Notificaciones"
              className={({ isActive }) => `relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-carmelita/70 transition-colors touch-manipulation active:bg-brand-green/8 active:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35 ${isActive ? 'bg-brand-green/8 text-brand-green' : ''}`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotificationCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-carmelita px-1 text-[0.6rem] font-bold leading-none text-brand-white">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              ) : null}
            </NavLink>
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-carmelita/70 transition-colors touch-manipulation active:bg-brand-green/8 active:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </button>
          </div>
        </header>
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
          <header className="mb-6">
            <div>
              <Link
                to="/comprar"
                className="text-sm font-bold text-brand-green lg:hidden"
              >
                ← Seguir comprando
              </Link>
              <h1 className="mt-2 font-display text-3xl font-bold">
                {section === 'avisos'
                  ? 'Avisos'
                  : CUSTOMER_NAV.find((item) => item.id === section)?.label || 'Mi cuenta'}
              </h1>
            </div>
          </header>
          {error ? (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}
          {loading ? (
            <div className={sectionClass}>Cargando tu cuenta…</div>
          ) : profile ? (
            <div className="grid gap-4">
              {section === "perfil" ? (
                <>
                  <section
                    className={`${sectionClass} relative isolate overflow-hidden`}
                  >
                    <div
                      className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-brand-yellow/25 blur-3xl"
                      aria-hidden="true"
                    />
                    <div
                      className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-brand-green/15 blur-3xl"
                      aria-hidden="true"
                    />
                    <div className="relative z-10">
                      <h2 className="mb-4 text-lg font-bold">Mi perfil</h2>
                      <div className="flex items-center gap-4">
                        <label
                          className="group relative block h-20 w-20 shrink-0 cursor-pointer rounded-full"
                          aria-label="Cambiar foto de perfil"
                        >
                          {profile.profile_photo_url ? (
                            <img
                              src={resolveMediaUrl(profile.profile_photo_url)}
                              alt="Foto de perfil"
                              className="h-20 w-20 rounded-full object-cover ring-2 ring-white shadow-lg"
                            />
                          ) : (
                            <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-yellow/35 text-2xl font-bold text-brand-green ring-2 ring-white shadow-lg">
                              {profile.full_name?.[0]}
                            </span>
                          )}
                          <span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-brand-green text-white shadow-md transition group-hover:bg-brand-carmelita">
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden="true"
                            >
                              <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
                              <circle cx="12" cy="13" r="3" />
                            </svg>
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={uploadPhoto}
                          />
                        </label>
                        <p className="text-sm text-brand-carmelita/75">
                          Toca tu foto para cambiarla.
                        </p>
                      </div>
                      <p className="mt-5 text-sm">
                        <span className="text-brand-carmelita/60">Nombre</span>
                        <br />
                        <strong>{profile.full_name}</strong>
                      </p>
                    </div>
                  </section>

                  {profileError ? (
                    <p
                      role="alert"
                      className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                    >
                      {profileError}
                    </p>
                  ) : null}
                  {profileMessage ? (
                    <p
                      role="status"
                      className="rounded-xl bg-brand-green/10 p-3 text-sm text-brand-green"
                    >
                      {profileMessage}
                    </p>
                  ) : null}

                  <section className={sectionClass}>
                    <h2 className="mb-4 text-lg font-bold">
                      Datos de contacto
                    </h2>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void startContactChange("email");
                      }}
                      className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
                    >
                      <label className="text-sm font-semibold">
                        Correo electrónico
                        <input
                          type="email"
                          required
                          maxLength={254}
                          value={contactDraft.email}
                          onChange={(event) =>
                            setContactDraft((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={
                          contactLoading ||
                          contactDraft.email.trim().toLowerCase() ===
                          profile.email
                        }
                        className="min-h-11 rounded-xl bg-brand-green px-4 font-bold text-white disabled:opacity-50"
                      >
                        Verificar correo
                      </button>
                    </form>
                    {contactChallenge?.kind === "email" ? (
                      <form
                        onSubmit={confirmContactChange}
                        className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end"
                      >
                        <label className="text-sm font-semibold">
                          Código enviado al nuevo correo
                          <input
                            required
                            minLength={4}
                            maxLength={8}
                            inputMode="numeric"
                            value={contactCode}
                            onChange={(event) =>
                              setContactCode(event.target.value)
                            }
                            className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 px-3 py-2"
                          />
                        </label>
                        <button
                          disabled={contactLoading}
                          className="min-h-11 rounded-xl bg-brand-carmelita px-4 font-bold text-white disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => void startContactChange("email")}
                          className="min-h-11 rounded-xl border border-brand-green/20 px-4 text-sm font-semibold"
                        >
                          Reenviar
                        </button>
                      </form>
                    ) : null}
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void startContactChange("phone");
                      }}
                      className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
                    >
                      <label className="text-sm font-semibold">
                        Teléfono
                        <input
                          type="tel"
                          required
                          value={contactDraft.phone}
                          onChange={(event) =>
                            setContactDraft((current) => ({
                              ...current,
                              phone: event.target.value,
                            }))
                          }
                          className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={
                          contactLoading ||
                          normalizedPhoneDigits(contactDraft.phone) ===
                          normalizedPhoneDigits(profile.phone)
                        }
                        className="min-h-11 rounded-xl bg-brand-green px-4 font-bold text-white disabled:opacity-50"
                      >
                        Verificar teléfono
                      </button>
                    </form>
                    {contactChallenge?.kind === "phone" ? (
                      <form
                        onSubmit={confirmContactChange}
                        className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end"
                      >
                        <label className="text-sm font-semibold">
                          Código enviado al nuevo teléfono
                          <input
                            required
                            minLength={4}
                            maxLength={8}
                            inputMode="numeric"
                            value={contactCode}
                            onChange={(event) =>
                              setContactCode(event.target.value)
                            }
                            className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 px-3 py-2"
                          />
                        </label>
                        <button
                          disabled={contactLoading}
                          className="min-h-11 rounded-xl bg-brand-carmelita px-4 font-bold text-white disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => void startContactChange("phone")}
                          className="min-h-11 rounded-xl border border-brand-green/20 px-4 text-sm font-semibold"
                        >
                          Reenviar
                        </button>
                      </form>
                    ) : null}
                  </section>

                  <section className={sectionClass}>
                    <h2 className="mb-4 text-lg font-bold">
                      Carnet de identidad
                    </h2>
                    <form
                      onSubmit={saveIdentityCard}
                      className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
                    >
                      <label className="text-sm font-semibold">
                        Número de carnet
                        <input
                          required
                          maxLength={64}
                          value={contactDraft.identity_card}
                          onChange={(event) =>
                            setContactDraft((current) => ({
                              ...current,
                              identity_card: event.target.value,
                            }))
                          }
                          className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2"
                        />
                      </label>
                      <button
                        disabled={
                          contactLoading ||
                          contactDraft.identity_card.trim() ===
                          profile.identity_card
                        }
                        className="min-h-11 rounded-xl bg-brand-green px-4 font-bold text-white disabled:opacity-50"
                      >
                        Guardar carnet
                      </button>
                    </form>
                  </section>
                </>
              ) : null}

              {section === "direcciones" ? (
                <section className={sectionClass}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold">Direcciones guardadas</h2>
                    <button
                      type="button"
                      onClick={openNewAddress}
                      aria-label="Agregar dirección"
                      title="Agregar dirección"
                      className="grid h-10 w-10 place-items-center rounded-full bg-brand-green text-white shadow-sm transition hover:bg-brand-carmelita focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 focus-visible:ring-offset-2"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                  {profile.addresses?.length ? (
                    <ul className="space-y-3">
                      {profile.addresses.map((address) => (
                        <li
                          key={address.id}
                          className="flex items-stretch justify-between gap-3 rounded-xl bg-brand-green/[0.04] p-3"
                        >
                          <button
                            type="button"
                            onClick={() => openEditAddress(address)}
                            aria-label={`Editar dirección ${address.label}`}
                            className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
                          >
                            <p className="font-semibold">{address.label}</p>
                            <p className="text-sm text-brand-carmelita/75">
                              {address.address}
                            </p>
                            {address.latitude != null ? (
                              <p className="mt-1 text-xs text-brand-carmelita/60">
                                Pin guardado
                              </p>
                            ) : null}
                          </button>
                          <div className="flex shrink-0 items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditAddress(address)}
                              aria-label={`Editar dirección ${address.label}`}
                              title="Editar dirección"
                              className="grid h-9 w-9 place-items-center rounded-full text-brand-green transition hover:bg-brand-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="m15 5 4 4M4 20l4.5-1 10.7-10.7a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAddress(address.id)}
                              aria-label={`Eliminar dirección ${address.label}`}
                              title="Eliminar dirección"
                              className="grid h-9 w-9 place-items-center rounded-full text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-brand-carmelita/70">
                      Aún no guardas direcciones.
                    </p>
                  )}
                </section>
              ) : null}

              {section === "pedidos" ? (
                <section className="space-y-3">
                  {orders.length ? (
                    <>
                      <div className="relative">
                        <label>
                          <span className="sr-only">Buscar pedidos</span>
                          <input
                            value={orderSearch}
                            onChange={(event) => setOrderSearch(event.target.value)}
                            placeholder="Buscar por tienda, producto o pedido"
                            className="min-h-11 w-full rounded-xl border border-brand-green/15 bg-brand-white py-2 pl-11 pr-14 text-sm text-brand-carmelita placeholder:text-brand-carmelita/45 focus:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/15"
                          />
                        </label>
                        {orderSearch ? (
                          <button
                            type="button"
                            onClick={() => setOrderSearch('')}
                            aria-label="Limpiar búsqueda"
                            title="Limpiar búsqueda"
                            className="absolute left-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-brand-carmelita/60 transition hover:bg-brand-green/8 hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setOrderFiltersOpen(true)}
                          aria-expanded={orderFiltersOpen}
                          aria-label="Filtrar pedidos"
                          title="Filtrar pedidos"
                          className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg border border-brand-green/15 bg-brand-white text-brand-green shadow-sm"
                        >
                          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16l-6.2 7v5l-3.6 2v-7L4 5Z" /></svg>
                          {activeOrderFilterCount ? <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-green px-1 text-[9px] font-bold leading-none text-white">{activeOrderFilterCount}</span> : null}
                        </button>
                      </div>
                      {visibleCustomerOrders.length ? (
                        <ul className="grid gap-3 md:grid-cols-2">
                      {visibleCustomerOrders.map((order) => {
                        const evidenceStatus = order.payment_method === 'qvapay' ? order.qvapay?.evidence?.status : null
                        const highlighted = needsBuyerOrderAttention(order)
                        return (
                        <li key={order.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            aria-label={`Ver detalle del pedido de ${order.store_name}`}
                            className={`relative w-full overflow-hidden rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 ${highlighted ? evidenceStatus === 'rejected' ? 'border-red-300 bg-red-50/75 shadow-[0_4px_18px_rgba(185,28,28,0.09)] hover:border-red-400' : 'border-amber-300 bg-amber-50/75 shadow-[0_4px_18px_rgba(180,83,9,0.09)] hover:border-amber-400' : 'border-brand-green/10 bg-brand-white hover:border-brand-green/40 hover:bg-brand-green/5'}`}
                          >
                          {highlighted ? <span className={`absolute inset-y-0 left-0 w-1 ${evidenceStatus === 'rejected' ? 'bg-red-600' : 'bg-amber-500'}`} aria-hidden="true" /> : null}
                          <div className="flex justify-between gap-3 pl-1">
                            <strong>{order.store_name}</strong>
                            <span className={`inline-flex shrink-0 items-center gap-1 text-right text-xs font-bold ${evidenceStatus === 'rejected' ? 'text-red-800' : evidenceStatus === 'pending' ? 'text-amber-900' : 'text-brand-green'}`}>
                              {highlighted ? <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[0.65rem] font-extrabold leading-none text-white ${evidenceStatus === 'rejected' ? 'bg-red-700' : 'bg-amber-700'}`} aria-hidden="true">!</span> : null}
                              {getBuyerOrderStatusLabel(order)}
                            </span>
                          </div>
                          <p className="mt-1 pl-1 text-xs text-brand-carmelita/60">
                            {formatDate(order.created_at)}
                          </p>
                          {evidenceStatus === 'pending' ? (
                            <QvaPayReleaseCountdown deadline={order.qvapay?.evidence?.deadline} compact />
                          ) : null}
                          <p className="mt-2 pl-1 text-sm">
                            {order.items
                              ?.map((item) => `${item.quantity} × ${item.name}`)
                              .join(", ")}
                          </p>
                          <p className="mt-2 pl-1 text-xs text-brand-carmelita/70">
                            {order.subtotals
                              ?.map((entry) =>
                                formatPrice(entry.amount, entry.currency),
                              )
                              .join(" · ")}
                          </p>
                          </button>
                        </li>
                      )})}
                        </ul>
                      ) : (
                        <p className="rounded-2xl border border-brand-green/10 bg-brand-white p-4 text-sm text-brand-carmelita/70">No hay pedidos que coincidan con la búsqueda o los filtros.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-brand-carmelita/70">
                      Aún no tienes pedidos.
                    </p>
                  )}
                </section>
              ) : null}

              {section === "avisos" ? (
                <section className="space-y-3">
                  {notificationsLoading ? <div className={sectionClass}><p className="text-sm text-brand-carmelita/70">Cargando avisos…</p></div> : null}
                  {!notificationsLoading && notificationsError ? (
                    <div className={`${sectionClass} space-y-3`}>
                      <p role="alert" className="text-sm text-brand-carmelita">{notificationsError}</p>
                      <button type="button" onClick={loadPaymentNotifications} className="min-h-10 rounded-xl bg-brand-green px-4 text-sm font-bold text-brand-white">Reintentar</button>
                    </div>
                  ) : null}
                  {!notificationsLoading && !notificationsError && paymentNotifications.length ? paymentNotifications.map((notification) => (
                    <button key={notification.id} type="button" onClick={() => openPaymentNotification(notification)} className={`w-full rounded-2xl border p-4 text-left transition ${notification.read_at ? 'border-brand-green/10 bg-brand-white' : 'border-brand-green/25 bg-brand-green/[0.04]'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <strong className="text-brand-green">{notification.title}</strong>
                        {!notification.read_at ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-green" aria-label="Sin leer" /> : null}
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm text-brand-carmelita">{notification.content}</p>
                      <p className="mt-2 text-xs text-brand-carmelita/60">{formatDate(notification.created_at)} · Toca para abrir el pedido</p>
                    </button>
                  )) : null}
                  {!notificationsLoading && !notificationsError && !paymentNotifications.length ? <div className={sectionClass}><p className="text-sm text-brand-carmelita/70">No tienes avisos de pagos.</p></div> : null}
                </section>
              ) : null}

              {section === "favoritos" ? (
                <section className="space-y-4">
                  {favoriteProducts.length ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {favoriteProducts.map((product) => (
                        <BuyerProductCard
                          key={product.id}
                          product={product}
                          allowBuyAfterWarning={Boolean(
                            product.warning_municipality,
                          )}
                          buyWarning={
                            product.warning_municipality
                              ? `La tienda no ofrece entrega en ${product.warning_municipality}. Debes recoger esta oferta${product.pickup_municipality_name ? ` en ${product.pickup_municipality_name}` : ""}.`
                              : product.unavailable_in_municipality === true
                                ? "No pudimos comprobar que esta oferta esté disponible para tu municipio. Configura tu municipio y vuelve a intentarlo."
                                : product.unavailable_in_municipality
                                  ? `No pudimos comprobar que esta oferta esté disponible en ${product.unavailable_in_municipality}. Cambia tu municipio para buscarla en su zona.`
                                  : ""
                          }
                          onFavoriteChange={(isFavorite) => {
                            if (!isFavorite)
                              setFavoriteProducts((current) =>
                                current.filter(
                                  (item) => item.id !== product.id,
                                ),
                              );
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-brand-carmelita/70">
                      Aún no tienes favoritos.
                    </p>
                  )}
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>
      <CustomerNavigation mobile hasOrderWarning={hasOrderWarning} />

      {orderFiltersPresent ? (
        <SellerModalPortal>
          <div
            className={`${sellerModalOverlay} ${orderModalMotionClass(orderFiltersClosing)}`}
            role="presentation"
            onMouseDown={(event) => { if (event.target === event.currentTarget) setOrderFiltersOpen(false) }}
          >
            <section
              className={`${sellerModalSheet} h-auto max-h-[80dvh] max-w-2xl overflow-visible`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="customer-order-filters-title"
            >
              <header className="flex items-center justify-between border-b border-brand-green/10 px-5 py-4">
                <div>
                  <h2 id="customer-order-filters-title" className="font-display text-lg font-bold text-brand-green">Filtrar pedidos</h2>
                  <p className="mt-1 text-xs text-brand-carmelita/75">Combina los criterios que quieras aplicar.</p>
                </div>
                <button type="button" onClick={() => setOrderFiltersOpen(false)} aria-label="Cerrar filtros" className="grid h-10 w-10 place-items-center rounded-full text-xl text-brand-carmelita/60 hover:bg-brand-green/5">×</button>
              </header>
              <div className="grid flex-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                <SellerFilterDropdown label="Tienda" placeholder="Todas las tiendas" options={orderFilterOptions.stores} value={storeFilter} onChange={setStoreFilter} />
                <SellerFilterDropdown label="Productos · selección múltiple" placeholder="Todos los productos" options={orderFilterOptions.products} value={productFilters} onChange={setProductFilters} multiple />
                <SellerFilterDropdown label="Estado" placeholder="Todos los estados" options={orderFilterOptions.statuses} value={statusFilter} onChange={setStatusFilter} />
                <SellerFilterDropdown label="Moneda" placeholder="Todas las monedas" options={orderFilterOptions.currencies} value={currencyFilter} onChange={setCurrencyFilter} />
                <SellerFilterDropdown label="Domicilio" placeholder="Todos" options={['Sí', 'No']} value={deliveryFilter === 'yes' ? 'Sí' : deliveryFilter === 'no' ? 'No' : ''} onChange={(value) => setDeliveryFilter(value === 'Sí' ? 'yes' : value === 'No' ? 'no' : '')} />
                <div className="sm:col-span-2">
                  <p className="mb-2 text-xs font-semibold text-brand-green">Fecha del pedido</p>
                  <AdminDateRangeControls
                    inline
                    period={datePeriod}
                    onPeriodChange={(period) => { setDatePeriod(period); setDateFilterEnabled(true) }}
                    range={dateRange}
                    onRangeChange={(nextRange, nextPeriod) => {
                      if (nextRange) {
                        setDateRange(nextRange)
                        setDatePeriod(nextPeriod || 'custom')
                        setDateFilterEnabled(true)
                      } else {
                        setDatePeriod('daily')
                        setDateRange(rangeForPeriod('daily'))
                        setDateFilterEnabled(false)
                      }
                    }}
                    applyPeriodToRange
                  />
                </div>
              </div>
              <footer className="flex justify-between gap-3 border-t border-brand-green/10 p-4">
                <button type="button" onClick={() => { setStoreFilter(''); setProductFilters([]); setStatusFilter(''); setCurrencyFilter(''); setDeliveryFilter(''); setDatePeriod('daily'); setDateRange(rangeForPeriod('daily')); setDateFilterEnabled(false) }} className="min-h-10 rounded-xl border border-brand-green/15 px-4 text-sm font-semibold text-brand-green">Limpiar filtros</button>
                <button type="button" onClick={() => setOrderFiltersOpen(false)} className="min-h-10 rounded-xl bg-brand-green px-5 text-sm font-semibold text-white">Ver pedidos</button>
              </footer>
            </section>
          </div>
        </SellerModalPortal>
      ) : null}

      {selectedOrder ? <CustomerOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdated={load} /> : null}
      {logoutOpen ? <SellerLogoutModal onClose={() => setLogoutOpen(false)} onConfirm={logout} /> : null}
      <SellerNotificationToast
        toast={liveNotificationToast}
        aboveNav
        onDone={(id) => setLiveNotificationToast((current) => current?.id === id ? null : current)}
        onOpen={() => { setLiveNotificationToast(null); navigate('/cliente/avisos') }}
      />

      {addressPresent ? (
        <div
          className={`fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-3 ${addressMotionClass}`}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAddressOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className={`flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-y-auto rounded-t-3xl bg-brand-white p-5 shadow-xl sm:rounded-3xl sm:p-6 ${addressClosing ? 'motion-safe:animate-address-sheet-out' : 'motion-safe:animate-address-sheet-in'}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingAddress ? "Editar dirección" : "Nueva dirección"}
              </h2>
              <button
                type="button"
                onClick={() => setAddressOpen(false)}
                aria-label="Cerrar"
                className="text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={saveAddress} className="mt-4 flex flex-col gap-3">
              <label className="text-sm font-semibold">
                Dirección física
                <input
                  required
                  maxLength={300}
                  value={addressText}
                  onChange={(event) => setAddressText(event.target.value)}
                  placeholder="Calle, número, reparto…"
                  className="mt-1 w-full rounded-xl border border-brand-green/20 px-3 py-2"
                />
              </label>
              <BuyerOrderLocationMap
                initialCoords={point}
                onChange={(coords) => setPoint(coords)}
                heightClass="h-80 sm:h-[28rem]"
              />
              <button
                disabled={savingAddress}
                className="min-h-11 rounded-xl bg-brand-green font-bold text-white disabled:opacity-60"
              >
                {savingAddress
                  ? "Guardando…"
                  : editingAddress
                    ? "Guardar cambios"
                    : "Guardar dirección"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
