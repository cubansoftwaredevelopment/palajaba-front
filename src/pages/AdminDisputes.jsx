import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminButton from '../components/admin/AdminButton'
import AdminModal from '../components/admin/AdminModal'
import Checkbox from '../components/ui/Checkbox'
import LoadingState from '../components/ui/LoadingState'
import {
  adminAlertError,
  adminAlertSuccess,
  adminBadgeApproved,
  adminBadgePending,
  adminChoice,
  adminFocusRing,
  adminInput,
  adminLabel,
  adminMuted,
  adminSection,
} from '../components/admin/adminStyles'
import { getAdminToken } from '../lib/adminAuth'
import { downloadAdminDisputeReport, fetchAdminDispute, fetchAdminDisputes, ruleAdminDispute } from '../lib/api'
import { quoteRefund } from '../lib/refundQuote'
import { resolveMediaUrl } from '../lib/media'

const STATUS_LABEL = { open: 'Por resolver', ruled: 'Resuelta' }
const WINNER_LABEL = { seller: 'A favor de la tienda', buyer: 'A favor del comprador' }
const ORDER_STATUS = {
  pending_confirmation: 'Por procesar',
  completed: 'Compra realizada',
  cancelled: 'Cancelado',
}
const EVIDENCE_STATUS = {
  pending: 'Evidencia enviada',
  rejected: 'Evidencia rechazada',
  accepted: 'Evidencia aceptada',
  expired: 'Plazo vencido',
  closed: 'Cerrada',
}
const RELEASE_STATUS = {
  held: 'Pago retenido',
  released: 'Pago liberado',
  refunded: 'Pago devuelto',
  transferring: 'Transfiriendo',
  retry: 'Reintento de transferencia',
}
const PRODUCT_STATUS = { publico: 'Público', agotado: 'Agotado', borrado: 'Borrado' }
const PAYMENT_METHOD = { contact: 'Contacto', qvapay: 'QvaPay' }
const REPORT_PARTY = { buyer: 'Comprador', seller: 'Tienda' }

function formatWhen(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function orderStatusLabel(status) {
  return ORDER_STATUS[status] || status || 'Sin estado'
}

function PartyFacts({ items }) {
  return (
    <dl className="mt-3 space-y-1.5 text-sm">
      {items.filter((item) => item.value).map((item) => (
        <div key={item.label} className="flex justify-between gap-3">
          <dt className={adminMuted}>{item.label}</dt>
          <dd className="min-w-0 truncate text-right text-zinc-100">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function OrderRow({ order, onOpen }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(order)}
        className={`flex w-full flex-col gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${adminFocusRing} ${
          order.disputed
            ? 'border-brand-yellow/40 bg-brand-yellow/10'
            : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/70'
        }`}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="font-semibold text-zinc-100">#{order.code}</span>
          <span className={order.status === 'completed' ? adminBadgeApproved : adminBadgePending}>
            {orderStatusLabel(order.status)}
          </span>
        </span>
        <span className={`text-xs ${adminMuted}`}>
          {[order.store_name, order.total, formatWhen(order.created_at)].filter(Boolean).join(' · ')}
        </span>
        {order.disputed ? <span className="text-xs font-semibold text-brand-yellow">Pedido en disputa</span> : null}
      </button>
    </li>
  )
}

function OrderList({ orders, onOpen, empty }) {
  if (!orders?.length) return <p className={`text-sm ${adminMuted}`}>{empty}</p>
  return (
    <ul className="space-y-2">
      {orders.map((order) => (
        <OrderRow key={order.id} order={order} onOpen={onOpen} />
      ))}
    </ul>
  )
}

function PartyMotives({ reports }) {
  const byParty = Object.fromEntries((reports || []).filter((report) => report?.party).map((report) => [report.party, report]))
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-100">Motivos</h3>
      {['buyer', 'seller'].map((party) => {
        const report = byParty[party]
        return (
          <article key={party} className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
            <p className="text-sm font-semibold text-zinc-50">{REPORT_PARTY[party]}</p>
            {report?.created_at ? <p className={`mt-1 text-xs ${adminMuted}`}>{formatWhen(report.created_at)}</p> : null}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
              {report?.text || 'Aún no envió su motivo.'}
            </p>
            {report?.images?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {report.images.map((src) => (
                  <a key={src} href={resolveMediaUrl(src)} target="_blank" rel="noreferrer">
                    <img src={resolveMediaUrl(src, { width: 240 })} alt={`Imagen del motivo de ${REPORT_PARTY[party]}`} className="h-20 w-20 rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            ) : null}
          </article>
        )
      })}
    </section>
  )
}

function OrderDetailModal({ order, reports, onClose }) {
  const delivery = order.delivery && typeof order.delivery === 'object' ? order.delivery : null
  return (
    <AdminModal
      title={`Pedido #${order.code}`}
      subtitle={[order.store_name, formatWhen(order.created_at)].filter(Boolean).join(' · ')}
      onClose={onClose}
      panelClassName="max-w-lg"
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <span className={order.status === 'completed' ? adminBadgeApproved : adminBadgePending}>
          {orderStatusLabel(order.status)}
        </span>
        {order.disputed ? <span className={adminBadgePending}>En disputa</span> : null}
        {order.evidence_status ? (
          <span className={adminBadgePending}>{EVIDENCE_STATUS[order.evidence_status] || order.evidence_status}</span>
        ) : null}
        {order.release_status ? (
          <span className={adminBadgeApproved}>{RELEASE_STATUS[order.release_status] || order.release_status}</span>
        ) : null}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className={adminMuted}>Comprador</dt>
        <dd className="text-right text-zinc-100">{order.buyer_name || '—'}</dd>
        <dt className={adminMuted}>Teléfono</dt>
        <dd className="text-right text-zinc-100">{order.buyer_phone || '—'}</dd>
        <dt className={adminMuted}>Pago</dt>
        <dd className="text-right text-zinc-100">
          {[PAYMENT_METHOD[order.payment_method] || order.payment_method, order.payment_currency].filter(Boolean).join(' · ') || '—'}
        </dd>
        <dt className={adminMuted}>Total</dt>
        <dd className="text-right text-zinc-100">{order.total || '—'}</dd>
        <dt className={adminMuted}>Origen</dt>
        <dd className="text-right text-zinc-100">{order.origin === 'manual' ? 'Manual' : 'Plataforma'}</dd>
        <dt className={adminMuted}>Entrega</dt>
        <dd className="text-right text-zinc-100">
          {order.delivery_requested
            ? [order.delivery_price, order.delivery_currency].filter((value) => value != null && value !== '').join(' ') || 'Solicitada'
            : 'Recogida'}
        </dd>
      </dl>
      {delivery ? (
        <p className={`mt-3 text-sm ${adminMuted}`}>
          {[delivery.recipient_name, delivery.address, delivery.phone_primary, delivery.notes].filter(Boolean).join(' · ')}
        </p>
      ) : null}
      <h3 className="mt-5 text-sm font-semibold text-zinc-100">Productos</h3>
      {order.items?.length ? (
        <ul className="mt-2 space-y-2">
          {order.items.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 text-sm">
              <span className="text-zinc-200">
                {item.quantity} × {item.name}
              </span>
              <span className={adminMuted}>
                {[item.line_total ?? item.unit_price, item.currency].filter((value) => value != null && value !== '').join(' ')}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`mt-2 text-sm ${adminMuted}`}>Este pedido no tiene productos registrados.</p>
      )}
      {order.disputed ? <div className="mt-5"><PartyMotives reports={reports} /></div> : null}
    </AdminModal>
  )
}

function usd(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return ''
  return `${number.toFixed(2)} USD`
}

function appliedRuling(rulings) {
  const applied = (rulings || []).filter((item) => (
    item.kind === 'ruling' && (item.outcome === 'completed' || item.outcome === 'buyer_paid_store_pending')
  ))
  return applied.at(-1) || null
}

function returnedToBuyer(ruling) {
  const lines = []
  for (const item of ruling?.items || []) {
    const quantity = Number(item.quantity_before) - Number(item.quantity_after)
    if (quantity > 0) lines.push({ key: item.product_id || item.name, label: `${item.name || 'Producto'} × ${quantity}` })
  }
  if (ruling?.refund_delivery) lines.push({ key: 'envio', label: 'Envío' })
  return lines
}

function validatedToStore(ruling, order) {
  const lines = []
  if (ruling?.winner === 'seller') {
    for (const item of order?.items || []) {
      if (Number(item.quantity) > 0) lines.push({ key: item.product_id || item.name, label: `${item.name || 'Producto'} × ${item.quantity}` })
    }
    if (Number(order?.delivery_amount_usd) > 0 || Number(order?.delivery_price) > 0) lines.push({ key: 'envio', label: 'Envío' })
    return lines
  }
  for (const item of ruling?.items || []) {
    if (Number(item.quantity_after) > 0) lines.push({ key: item.product_id || item.name, label: `${item.name || 'Producto'} × ${item.quantity_after}` })
  }
  if (ruling && !ruling.refund_delivery && Number(ruling.delivery_amount_usd) > 0) lines.push({ key: 'envio', label: 'Envío' })
  return lines
}

function ResolutionLines({ lines }) {
  if (!lines.length) return null
  return (
    <ul className="mt-2 space-y-1 text-sm text-zinc-200">
      {lines.map((line) => <li key={line.key}>{line.label}</li>)}
    </ul>
  )
}

function FinalResolution({ rulings, order }) {
  const ruling = appliedRuling(rulings)
  if (!ruling) return null
  const returned = returnedToBuyer(ruling)
  const validated = validatedToStore(ruling, order)
  const storeAmount = Number(ruling.store_payout_usd)
  const buyerWins = ruling.winner === 'buyer'
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
      <h3 className="text-sm font-semibold text-zinc-50">
        {buyerWins ? 'Fallo a favor del comprador' : 'Fallo a favor de la tienda'}
      </h3>
      {buyerWins ? (
        <div className="mt-3">
          <p className={`text-sm ${adminMuted}`}>Artículos y cantidades</p>
          <ResolutionLines lines={returned} />
          <p className="mt-2 text-sm font-semibold text-zinc-50">Monto: {usd(ruling.buyer_amount_usd)}</p>
        </div>
      ) : null}
      {!buyerWins && returned.length ? (
        <div className="mt-3">
          <p className={`text-sm ${adminMuted}`}>Artículos, cantidades y envío devueltos al comprador</p>
          <ResolutionLines lines={returned} />
          <p className="mt-2 text-sm font-semibold text-zinc-50">Monto: {usd(ruling.buyer_amount_usd)}</p>
        </div>
      ) : null}
      {storeAmount > 0 ? (
        <div className={buyerWins ? 'mt-4' : 'mt-3'}>
          <p className={`text-sm ${adminMuted}`}>Artículos, cantidades y envío validados a la tienda</p>
          <ResolutionLines lines={validated} />
          <p className="mt-2 text-sm font-semibold text-zinc-50">Monto: {usd(storeAmount)}</p>
        </div>
      ) : null}
    </section>
  )
}

function BuyerRefundFields({ order, quantities, refundDelivery, onQuantity, onDelivery }) {
  const preview = quoteRefund({
    items: order.items,
    quantities,
    refundDelivery,
    productsUsd: order.products_amount_usd,
    deliveryUsd: order.delivery_amount_usd,
    feeUsd: order.fee_usd,
    invoiceUsd: order.invoice_amount_usd,
  })
  return (
    <div className="space-y-3">
      <p className={adminLabel}>Qué se devuelve</p>
      <ul className="space-y-2">
        {(order.items || []).map((item) => {
          const quantity = quantities[item.product_id] ?? item.quantity
          return (
            <li key={item.product_id || item.name} className="flex items-center justify-between gap-3 text-sm text-zinc-100">
              <span className="min-w-0 truncate">{item.name}</span>
              <span className="flex items-center gap-2">
                <button type="button" className={adminChoice(false)} disabled={quantity <= 0} onClick={() => onQuantity(item.product_id, quantity - 1)}>−</button>
                <span className="min-w-6 text-center">{quantity}</span>
                <button type="button" className={adminChoice(false)} disabled={quantity >= item.quantity} onClick={() => onQuantity(item.product_id, quantity + 1)}>+</button>
              </span>
            </li>
          )
        })}
      </ul>
      {Number(order.delivery_amount_usd) > 0 ? (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-200">
          <Checkbox tone="admin" checked={refundDelivery} onChange={(event) => onDelivery(event.target.checked)} />
          Devolver el domicilio
        </label>
      ) : null}
      <p className={`text-sm ${adminMuted}`}>
        {preview.changed
          ? `El comprador recibe ${preview.buyerUsd.toFixed(2)} USD, comisión incluida. Lo que quede de productos y domicilio se libera a la tienda.`
          : 'Baja cantidades o devuelve el domicilio. Si no queda nada, se devuelve la factura completa.'}
      </p>
    </div>
  )
}

export default function AdminDisputes() {
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rulingOpen, setRulingOpen] = useState(false)
  const [winner, setWinner] = useState('seller')
  const [reason, setReason] = useState('')
  const [refundQty, setRefundQty] = useState({})
  const [refundDelivery, setRefundDelivery] = useState(false)
  const [ruling, setRuling] = useState(false)
  const [listVersion, setListVersion] = useState(0)
  const [openedOrder, setOpenedOrder] = useState(null)
  const [reportKind, setReportKind] = useState('')

  useEffect(() => {
    const token = getAdminToken()
    if (!token) {
      setError('La sesión del administrador no está activa.')
      setLoading(false)
      return undefined
    }
    let active = true
    fetchAdminDisputes(token)
      .then((data) => {
        if (!active) return
        const rows = Array.isArray(data) ? data : []
        setItems(rows)
        setSelectedId((current) => {
          if (current && rows.some((item) => item.id === current)) return current
          return rows.find((item) => item.status === 'open')?.id || rows[0]?.id || ''
        })
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'No se pudieron cargar las disputas.')
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [listVersion])

  useEffect(() => {
    const token = getAdminToken()
    if (!selectedId || !token) return undefined
    let active = true
    fetchAdminDispute(token, selectedId)
      .then((data) => {
        if (!active) return
        setDetail(data)
        setDetailLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err.message || 'No se pudo cargar la disputa.')
        setDetailLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedId, listVersion])

  function selectDispute(id) {
    if (id === selectedId) return
    setSelectedId(id)
    setDetail(null)
    setDetailLoading(true)
    setError('')
    setSuccess('')
    setOpenedOrder(null)
  }

  async function downloadReport(kind) {
    setReportKind(kind)
    setError('')
    try {
      await downloadAdminDisputeReport(getAdminToken(), selectedId, kind)
    } catch (err) {
      setError(err.message || 'No se pudo descargar el documento.')
    } finally {
      setReportKind('')
    }
  }

  const storePayoutPending = Number(detail?.pending_store_payout_usd) > 0

  async function submitRuling(event) {
    event.preventDefault()
    const retryingStore = Number(detail?.pending_store_payout_usd) > 0
    setRuling(true)
    setError('')
    setSuccess('')
    try {
      const storedReason = (detail?.reason || '').trim()
      const payload = {
        winner: retryingStore ? 'buyer' : winner,
        reason: retryingStore ? (storedReason.length >= 3 ? storedReason : 'Reintento del pago a la tienda.') : reason.trim(),
      }
      if (!retryingStore && payload.winner === 'buyer') {
        const lines = detail?.order?.items || []
        payload.items = lines.map((item) => ({
          product_id: item.product_id,
          quantity: refundQty[item.product_id] ?? item.quantity,
        }))
        payload.refund_delivery = refundDelivery
      }
      await ruleAdminDispute(getAdminToken(), selectedId, payload)
      setSuccess(retryingStore || payload.winner === 'seller' ? 'Pago liberado a la tienda.' : 'Pago devuelto al comprador.')
      setRulingOpen(false)
      setReason('')
      setDetailLoading(true)
      setListVersion((value) => value + 1)
      window.dispatchEvent(new Event('admin-disputes-changed'))
    } catch (err) {
      setError(err.message || 'No se pudo fallar la disputa.')
      setListVersion((value) => value + 1)
    } finally {
      setRuling(false)
    }
  }

  return (
    <section className={adminSection}>
      <div className="mx-auto flex min-h-[calc(100dvh-8.5rem)] w-full max-w-7xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/35">
        <aside className={`flex w-full shrink-0 flex-col border-zinc-800 lg:w-80 lg:border-r ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="border-b border-zinc-800 px-4 py-3">
            <h1 className="text-base font-semibold text-zinc-50">Disputas</h1>
            <p className={`text-xs ${adminMuted}`}>
              {items.filter((item) => item.status === 'open').length} por resolver
            </p>
          </div>
          {loading ? <LoadingState label="Cargando disputas…" /> : null}
          {error && items.length === 0 ? <p className={`${adminAlertError} m-4`} role="alert">{error}</p> : null}
          {!loading && items.length === 0 && !error ? (
            <p className={`px-4 py-6 text-sm ${adminMuted}`}>No hay disputas.</p>
          ) : null}
          <ul className="min-h-0 flex-1 overflow-y-auto" role="listbox" aria-label="Disputas">
            {items.map((item) => {
              const active = item.id === selectedId
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => selectDispute(item.id)}
                    className={`flex w-full flex-col gap-1 border-b border-zinc-800/80 px-4 py-3 text-left transition-colors ${adminFocusRing} ${
                      active ? 'bg-brand-green/12' : 'hover:bg-zinc-900/70'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-zinc-100">#{item.order_code}</span>
                      <span className={item.status === 'open' ? adminBadgePending : adminBadgeApproved}>
                        {STATUS_LABEL[item.status] || item.status}
                      </span>
                    </span>
                    <span className="truncate text-sm text-zinc-300">
                      {[item.buyer_name, item.store_name].filter(Boolean).join(' · ')}
                    </span>
                    <span className="text-xs font-medium text-brand-yellow">{item.parties_label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        <div className={`min-w-0 flex-1 overflow-y-auto ${selectedId ? 'block' : 'hidden lg:block'}`}>
          {!selectedId ? (
            <p className={`px-6 py-10 text-sm ${adminMuted}`}>Selecciona una disputa para ver su información.</p>
          ) : null}
          {selectedId && (detailLoading || !detail) ? <LoadingState label="Cargando disputa…" /> : null}
          {selectedId && detail && !detailLoading ? (
            <div className="space-y-5 p-4 sm:p-6">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedId('')}
                    className={`mb-2 text-sm font-medium text-brand-green lg:hidden ${adminFocusRing}`}
                  >
                    Volver a la lista
                  </button>
                  <h2 className="text-xl font-semibold text-zinc-50">Pedido #{detail.order_code}</h2>
                  <p className="mt-1 text-sm text-brand-yellow">{detail.parties_label}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={detail.status === 'open' ? adminBadgePending : adminBadgeApproved}>
                    {STATUS_LABEL[detail.status] || detail.status}
                  </span>
                  <AdminButton size="sm" variant="secondary" onClick={() => downloadReport('terms')} disabled={Boolean(reportKind)}>
                    {reportKind === 'terms' ? 'Generando…' : 'Términos y condiciones'}
                  </AdminButton>
                  <AdminButton size="sm" variant="secondary" onClick={() => downloadReport('delivery_policy')} disabled={Boolean(reportKind)}>
                    {reportKind === 'delivery_policy' ? 'Generando…' : 'Política de entrega'}
                  </AdminButton>
                  {detail.status === 'open' ? (
                    <AdminButton size="sm" onClick={() => {
                      const lines = detail?.order?.items || []
                      setRefundQty(Object.fromEntries(lines.map((item) => [item.product_id, item.quantity])))
                      setRefundDelivery(false)
                      setRulingOpen(true)
                    }}>{storePayoutPending ? 'Reintentar' : 'Resolver'}</AdminButton>
                  ) : null}
                </div>
              </header>

              {error ? <p className={adminAlertError} role="alert">{error}</p> : null}
              {success ? <p className={adminAlertSuccess} role="status">{success}</p> : null}
              {detail.status === 'ruled' ? (
                <p className={`text-sm ${adminMuted}`}>
                  {WINNER_LABEL[detail.winner] || 'Resuelta'}
                  {detail.reason ? ` · ${detail.reason}` : ''}
                </p>
              ) : null}
              {storePayoutPending ? (
                <p className="rounded-xl border border-brand-yellow/40 bg-brand-yellow/10 px-3 py-2 text-sm text-zinc-100">
                  El comprador ya recibió la devolución. Quedan {usd(detail.pending_store_payout_usd)} por transferir a la tienda.
                </p>
              ) : null}

              {detail.order ? (
                <button
                  type="button"
                  onClick={() => setOpenedOrder(detail.order)}
                  className={`flex w-full flex-col gap-2 rounded-2xl border border-brand-yellow/35 bg-brand-yellow/10 p-4 text-left ${adminFocusRing}`}
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-50">Pedido en disputa</span>
                    <span className={detail.order.status === 'completed' ? adminBadgeApproved : adminBadgePending}>
                      {orderStatusLabel(detail.order.status)}
                    </span>
                  </span>
                  <span className={`text-sm ${adminMuted}`}>
                    {[
                      detail.order.total,
                      PAYMENT_METHOD[detail.order.payment_method] || detail.order.payment_method,
                      EVIDENCE_STATUS[detail.evidence_status],
                      RELEASE_STATUS[detail.release_status],
                    ].filter(Boolean).join(' · ')}
                  </span>
                  <span className="text-xs font-medium text-brand-green">Ver detalle del pedido</span>
                </button>
              ) : null}

              <PartyMotives reports={detail.reports} />
              <FinalResolution rulings={detail.rulings} order={detail.order} />

              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Comprador</h3>
                  <div className="mt-3 flex items-center gap-3">
                    {detail.buyer?.profile_photo_url ? (
                      <img src={detail.buyer.profile_photo_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300">
                        {(detail.buyer?.full_name || '?').slice(0, 1)}
                      </span>
                    )}
                    <p className="font-semibold text-zinc-50">{detail.buyer?.full_name || 'Comprador'}</p>
                  </div>
                  <PartyFacts
                    items={[
                      { label: 'Teléfono', value: detail.buyer?.phone },
                      { label: 'Correo', value: detail.buyer?.email },
                      { label: 'Carnet', value: detail.buyer?.identity_card },
                      { label: 'QvaPay', value: detail.buyer_username },
                    ]}
                  />
                </section>
                <section className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Tienda</h3>
                  <p className="mt-3 font-semibold text-zinc-50">{detail.store?.name || 'Tienda'}</p>
                  <PartyFacts
                    items={[
                      { label: 'Teléfono', value: detail.store?.phone },
                      { label: 'Correo', value: detail.store?.email },
                    ]}
                  />
                  {detail.store?.sales_url ? (
                    <Link to={detail.store.sales_url} className="mt-3 inline-block text-sm font-semibold text-brand-green hover:underline">
                      Ver la tienda
                    </Link>
                  ) : null}
                </section>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-zinc-100">Pedidos del comprador</h3>
                  <OrderList
                    orders={detail.buyer?.orders}
                    onOpen={setOpenedOrder}
                    empty="Este comprador no tiene otros pedidos."
                  />
                </section>
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-zinc-100">Pedidos de la tienda</h3>
                  <OrderList
                    orders={detail.store?.orders}
                    onOpen={setOpenedOrder}
                    empty="Esta tienda no tiene otros pedidos."
                  />
                </section>
              </div>

              <section>
                <h3 className="text-sm font-semibold text-zinc-100">Productos de la tienda</h3>
                {detail.store?.products?.length ? (
                  <ul className="mt-2 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
                    {detail.store.products.map((product) => (
                      <li key={product.id} className="flex items-center gap-3 rounded-xl border border-zinc-800 px-3 py-2">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <span className="h-10 w-10 rounded-lg bg-zinc-800" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-zinc-100">{product.name}</span>
                          <span className={`text-xs ${adminMuted}`}>{PRODUCT_STATUS[product.status] || product.status}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={`mt-2 text-sm ${adminMuted}`}>La tienda no tiene productos.</p>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>

      {openedOrder ? (
        <OrderDetailModal
          order={openedOrder}
          reports={openedOrder.disputed ? detail?.reports : null}
          onClose={() => setOpenedOrder(null)}
        />
      ) : null}

      {rulingOpen && storePayoutPending ? (
        <AdminModal
          title="Reintentar pago a la tienda"
          subtitle={`Pedido #${detail?.order_code || ''} · ${usd(detail.pending_store_payout_usd)}`}
          onClose={() => {
            if (!ruling) setRulingOpen(false)
          }}
          panelClassName="max-w-md"
        >
          <form onSubmit={submitRuling} className="space-y-4">
            {error ? <p className={adminAlertError} role="alert">{error}</p> : null}
            <AdminButton type="submit" disabled={ruling}>
              {ruling ? 'Reintentando…' : 'Reintentar'}
            </AdminButton>
          </form>
        </AdminModal>
      ) : null}

      {rulingOpen && !storePayoutPending ? (
        <AdminModal
          title="Fallar la disputa"
          subtitle={`Pedido #${detail?.order_code || ''}`}
          onClose={() => {
            if (!ruling) setRulingOpen(false)
          }}
          panelClassName="max-w-md"
        >
          <form onSubmit={submitRuling} className="space-y-4">
            <fieldset>
              <legend className={adminLabel}>Fallo</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button type="button" className={adminChoice(winner === 'seller')} onClick={() => setWinner('seller')}>
                  A favor de la tienda
                </button>
                <button type="button" className={adminChoice(winner === 'buyer')} onClick={() => setWinner('buyer')}>
                  A favor del comprador
                </button>
              </div>
            </fieldset>
            {winner === 'buyer' && detail?.order ? (
              <BuyerRefundFields
                order={detail.order}
                quantities={refundQty}
                refundDelivery={refundDelivery}
                onQuantity={(productId, quantity) => setRefundQty((current) => ({ ...current, [productId]: quantity }))}
                onDelivery={setRefundDelivery}
              />
            ) : null}
            <label className="block">
              <span className={adminLabel}>Motivo</span>
              <textarea className={`${adminInput} min-h-24`} value={reason} onChange={(event) => setReason(event.target.value)} required />
            </label>
            {error ? <p className={adminAlertError} role="alert">{error}</p> : null}
            <div className="grid grid-cols-2 gap-2">
              <AdminButton variant="secondary" onClick={() => setRulingOpen(false)} disabled={ruling}>
                Cancelar
              </AdminButton>
              <AdminButton type="submit" disabled={ruling}>
                {ruling ? 'Confirmando…' : 'Confirmar fallo'}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      ) : null}
    </section>
  )
}
