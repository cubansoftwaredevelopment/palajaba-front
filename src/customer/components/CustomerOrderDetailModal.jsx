import { useEffect, useState } from 'react'
import BuyerModalPortal from '../../buyer/components/BuyerModalPortal'
import { useDismissibleModal } from '../../buyer/components/useOrderModalPresence'
import { decideCustomerOrderEvidence, openCustomerOrderDispute, uploadCustomerDisputeImage } from '../api.js'
import DisputeSupportModal from '../../buyer/components/DisputeSupportModal'
import { formatDate, getBuyerOrderStatusLabel, getEvidenceSupportWhatsAppUrl } from '../constants.js'
import { getCustomerToken } from '../../lib/customerAuth'
import { resolveMediaUrl } from '../../lib/media'
import { formatPrice } from '../../lib/money'
import { canRespondToQvaPayEvidence, QVAPAY_EVIDENCE_WARNING } from '../../lib/qvapayEvidence.js'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { fetchRenewalContactPhone } from '../../subscriptions/api.js'
import { openExternalUrl } from '../../lib/nativeApp'
import { downloadCustomerOrderDocument } from '../../lib/api.js'
import OrderDocumentDownloads from '../../buyer/components/OrderDocumentDownloads'
import OrderPlatformTerms from '../../buyer/components/OrderPlatformTerms'
import QvaPayReleaseCountdown from './QvaPayReleaseCountdown.jsx'

export default function CustomerOrderDetailModal({ order, onClose, onUpdated }) {
  const { dismiss, motionClass } = useDismissibleModal(onClose)
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [decisionError, setDecisionError] = useState('')
  const [trackedOrderId, setTrackedOrderId] = useState(order.id)
  const [rejectedLocally, setRejectedLocally] = useState(false)
  const [supportPhone, setSupportPhone] = useState('')
  const [supportOpen, setSupportOpen] = useState(false)
  const [supportReportedOrderId, setSupportReportedOrderId] = useState('')
  const [documentDownload, setDocumentDownload] = useState(null)
  const [documentError, setDocumentError] = useState('')
  const qvapay = order.qvapay
  const evidence = qvapay?.evidence
  if (trackedOrderId !== order.id) {
    setTrackedOrderId(order.id)
    setRejectedLocally(false)
  }
  const supportAvailable = rejectedLocally || evidence?.status === 'rejected'
  const supportReported = Boolean(qvapay?.buyer_support_reported) || supportReportedOrderId === order.id
  const supportUrl = getEvidenceSupportWhatsAppUrl(supportPhone, order)

  useEffect(() => {
    let cancelled = false
    fetchRenewalContactPhone()
      .then((data) => { if (!cancelled) setSupportPhone(data?.renewal_contact_phone || '') })
      .catch(() => { if (!cancelled) setSupportPhone('') })
    return () => { cancelled = true }
  }, [order.id])

  function askSupport() {
    if (supportReported) {
      openExternalUrl(supportUrl)
      return
    }
    setSupportOpen(true)
  }

  async function submitSupportReport({ text, files }) {
    const token = getCustomerToken()
    const images = []
    for (const file of files) {
      const uploaded = await uploadCustomerDisputeImage(token, order.id, file)
      if (uploaded?.url) images.push(uploaded.url)
    }
    await openCustomerOrderDispute(token, order.id, { text, images })
    setSupportReportedOrderId(order.id)
  }

  async function downloadDocument(kind) {
    setDocumentDownload(kind)
    setDocumentError('')
    try {
      await downloadCustomerOrderDocument(getCustomerToken(), order.id, kind)
    } catch (cause) {
      setDocumentError(getUserFacingMessage(cause, 'No pudimos descargar el PDF.'))
    } finally {
      setDocumentDownload(null)
    }
  }

  async function decideEvidence(accept) {
    setDecisionLoading(true); setDecisionError('')
    try {
      await decideCustomerOrderEvidence(order.id, accept, getCustomerToken())
      if (!accept) setRejectedLocally(true)
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
            {qvapay?.dispute_winner === 'seller' ? <p className="mt-2 text-sm text-brand-carmelita">La disputa se resolvió a favor de la tienda. El pedido quedó realizado.</p> : null}
            {qvapay?.dispute_winner === 'buyer' ? <p className="mt-2 text-sm text-brand-carmelita">La disputa se resolvió a tu favor. El pedido quedó cancelado.</p> : null}
            {order.status === 'pending_confirmation' && qvapay?.payment_status === 'paid' && evidence?.status !== 'pending' && evidence?.status !== 'accepted' && evidence?.status !== 'expired' ? (
              <p className="mt-2 text-sm text-brand-carmelita">El pago está retenido. La tienda aún debe enviar la evidencia de entrega.</p>
            ) : null}
            {canRespondToQvaPayEvidence(qvapay) ? (
              <>
                <p className="mt-2 text-sm font-semibold text-brand-carmelita">La evidencia vence: {formatDate(evidence.deadline)}.</p>
                {evidence.status === 'pending' ? <QvaPayReleaseCountdown deadline={evidence.deadline} /> : null}
                <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold leading-relaxed text-amber-950">
                  {QVAPAY_EVIDENCE_WARNING}
                </div>
                <OrderDocumentDownloads
                  evidence={evidence}
                  include={['evidence']}
                  downloading={documentDownload}
                  onDownload={downloadDocument}
                  className="mt-3 space-y-2"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" disabled={decisionLoading} onClick={() => decideEvidence(false)} className="min-h-11 min-w-0 rounded-xl border border-brand-green/20 px-2 py-2 text-center text-xs font-bold leading-tight text-brand-green disabled:opacity-50 sm:text-sm">{decisionLoading ? 'Guardando…' : 'No recibí el pedido · Rechazar'}</button>
                  <button type="button" disabled={decisionLoading} onClick={() => decideEvidence(true)} className="min-h-11 min-w-0 rounded-xl bg-brand-green px-2 py-2 text-center text-xs font-bold leading-tight text-white disabled:opacity-50 sm:text-sm">{decisionLoading ? 'Guardando…' : 'Recibí el pedido · Aceptar'}</button>
                </div>
              </>
            ) : null}
            {order.status === 'pending_confirmation' && evidence?.status === 'rejected' ? <p className="mt-2 text-sm text-brand-carmelita">Rechazaste la evidencia. El pago sigue retenido mientras contactas a soporte o la tienda envía otra evidencia.</p> : null}
            {order.status === 'pending_confirmation' && (supportAvailable || evidence?.status === 'rejected') ? <button type="button" onClick={askSupport} className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-brand-green/20 px-4 font-bold text-brand-green">Contactar soporte de Pa’ La Jaba</button> : null}
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

        <OrderDocumentDownloads
          agreements={order.store_agreements}
          evidence={canRespondToQvaPayEvidence(qvapay) ? null : evidence}
          downloading={documentDownload}
          onDownload={downloadDocument}
        />
        <OrderPlatformTerms terms={order.platform_terms} />
        {documentError ? <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{documentError}</p> : null}
        {order.completed_at ? <p className="mt-4 text-xs text-brand-carmelita/65">Completado: {formatDate(order.completed_at)}</p> : null}
      </section>
      <DisputeSupportModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        onSubmit={submitSupportReport}
        whatsappUrl={supportUrl}
      />
      </div>
    </BuyerModalPortal>
  )
}
