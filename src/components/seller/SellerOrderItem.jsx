import { formatOrderDateTime } from '../../lib/dates'
import { formatPrice } from '../../lib/money'
import { sellerFocusRing } from './sellerStyles'

function formatSubtotals(subtotals = [], paymentCurrency = null) {
  if (paymentCurrency) {
    const total = subtotals.find((entry) => entry.currency === paymentCurrency)
    if (total) return formatPrice(total.amount, paymentCurrency)
  }
  if (!subtotals.length) return '—'
  return subtotals.map((entry) => formatPrice(entry.amount, entry.currency)).join(' + ')
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export default function SellerOrderItem({ order, variant = 'pending', onOpen }) {
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0)
  const isPending = variant === 'pending'
  const orderCode = order.id.slice(-6).toUpperCase()
  const totalLabel = formatSubtotals(order.subtotals, order.payment_currency)

  function handleActivate() {
    onOpen(order)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleActivate()
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={`group flex w-full cursor-pointer items-stretch gap-0 overflow-hidden rounded-2xl border text-left shadow-[0_2px_12px_rgba(89,128,44,0.05)] transition-colors [touch-action:pan-y] active:scale-[0.995] lg:hover:shadow-[0_4px_18px_rgba(89,128,44,0.08)] ${
        isPending
          ? 'border-brand-yellow/25 bg-brand-white active:bg-brand-yellow/10 lg:hover:border-brand-yellow/35'
          : 'border-brand-green/10 bg-brand-white active:bg-brand-green/[0.03] lg:hover:border-brand-green/18'
      } ${sellerFocusRing}`}
    >
      <span
        className={`w-1 shrink-0 ${isPending ? 'bg-brand-yellow' : 'bg-brand-green/35'}`}
        aria-hidden
      />

      <span className="flex min-w-0 flex-1 flex-col gap-2.5 px-4 py-3.5">
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-display text-sm font-bold text-brand-green">
                #{orderCode}
              </span>
              {isPending ? (
                <span className="rounded-full bg-brand-yellow/20 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.05em] text-brand-carmelita">
                  Requiere acción
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-2 py-0.5 text-[0.58rem] font-bold text-brand-green">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Realizada
                </span>
              )}
            </span>
            <span className="mt-1 block text-xs text-brand-carmelita/80">
              {isPending
                ? `Recibido ${formatOrderDateTime(order.created_at)}`
                : `Completada ${formatOrderDateTime(order.completed_at ?? order.updated_at)}`}
            </span>
          </span>

          <span
            className={`shrink-0 text-brand-carmelita/45 transition-transform group-active:translate-x-0.5 lg:group-hover:translate-x-0.5 ${
              isPending ? 'text-brand-carmelita/55' : ''
            }`}
          >
            <ChevronIcon />
          </span>
        </span>

        <span className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-lg bg-brand-green/[0.06] px-2 py-1 font-medium text-brand-carmelita/90">
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </span>
          <span className="font-bold text-brand-green">{totalLabel}</span>
          {order.payment_currency ? (
            <span className="rounded-full border border-brand-green/12 px-2 py-0.5 font-semibold text-brand-green/90">
              {order.payment_currency}
            </span>
          ) : null}
          {order.delivery_requested ? (
            <span className="rounded-full bg-brand-green/[0.08] px-2 py-0.5 font-semibold text-brand-green">
              Domicilio
            </span>
          ) : null}
        </span>
      </span>
    </article>
  )
}
