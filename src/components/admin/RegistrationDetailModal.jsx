import { useState } from 'react'
import AdminButton from './AdminButton'
import AdminModal from './AdminModal'
import { BILLING_LABELS, PLAN_TIER_LABELS, REJECTION_REASON, STATUS_LABELS } from '../../constants/admin'
import { normalizePlanTier } from '../../constants/plan'
import { daysUntil, formatDateTime } from '../../lib/dates'
import { formatPrice } from '../../lib/money'
import { adminMuted, adminSubtle } from './adminStyles'

const STATUS_STYLES = {
  pending: 'bg-zinc-700 text-zinc-200',
  approved: 'bg-white text-zinc-950',
  rejected: 'bg-zinc-800 text-zinc-500',
  expired: 'bg-orange-500/20 text-orange-200',
}

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs font-medium text-zinc-500 hover:text-white"
    >
      {copied ? 'Copiado' : `Copiar ${label}`}
    </button>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="border-b border-zinc-800 py-3 last:border-0">
      <dt className={`mb-1 text-xs font-medium uppercase tracking-wide ${adminMuted}`}>
        {label}
      </dt>
      <dd className="text-sm text-zinc-200">{children}</dd>
    </div>
  )
}

export default function RegistrationDetailModal({
  item,
  actionId,
  onClose,
  onApprove,
  onReject,
  onEditSubscription,
  onEditPayment,
  onRenew,
}) {
  const statusClass = STATUS_STYLES[item.status] ?? STATUS_STYLES.pending
  const days = item.subscription_ends_at ? daysUntil(item.subscription_ends_at) : null

  return (
    <AdminModal
      title={item.store_name}
      subtitle={
        <span className={`inline-flex items-center gap-2 ${adminSubtle}`}>
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusClass}`}>
            {STATUS_LABELS[item.status]}
          </span>
          <span>·</span>
          <span>{PLAN_TIER_LABELS[normalizePlanTier(item.plan_tier)]}</span>
          <span>·</span>
          <span>{BILLING_LABELS[item.billing_period]}</span>
        </span>
      }
      onClose={onClose}
    >
      <dl className="mb-6">
        <DetailRow label="ID transferencia">
          <span className="font-mono">{item.transfer_id}</span>
          <span className="mx-2 text-zinc-600">·</span>
          <CopyButton value={item.transfer_id} label="ID" />
        </DetailRow>
        <DetailRow label="Teléfono">{item.phone}</DetailRow>
        <DetailRow label="Plan contratado">
          {PLAN_TIER_LABELS[normalizePlanTier(item.plan_tier)]} · {BILLING_LABELS[item.billing_period]}
        </DetailRow>
        <DetailRow label="Fecha de solicitud">
          {formatDateTime(item.created_at)}
        </DetailRow>
        {(item.status === 'approved' || item.status === 'expired') && (
          <DetailRow label="Monto registrado">
            {item.payment_amount_cup != null ? (
              <span className="text-white">{formatPrice(item.payment_amount_cup, 'USD')}</span>
            ) : (
              <span className="text-amber-400/90">Sin registrar — no aparece en pagos del mes</span>
            )}
            {item.approved_at && (
              <span className={`mt-1 block text-xs ${adminSubtle}`}>
                {item.status === 'expired' ? 'Última aprobación' : 'Aprobada'} ·{' '}
                {formatDateTime(item.approved_at)}
              </span>
            )}
          </DetailRow>
        )}
        {(item.status === 'approved' || item.status === 'expired') && item.subscription_ends_at && (
          <DetailRow label={item.status === 'expired' ? 'Venció el' : 'Suscripción hasta'}>
            <span className={item.status === 'expired' ? 'text-orange-300' : 'text-white'}>
              {formatDateTime(item.subscription_ends_at)}
            </span>
            {item.status === 'approved' && days !== null && days <= 7 && (
              <span className="ml-2 text-xs text-zinc-400">
                ({days < 0 ? 'vencida' : `vence en ${days}d`})
              </span>
            )}
          </DetailRow>
        )}
        {item.status === 'rejected' && (
          <DetailRow label="Motivo de rechazo">
            <span className="text-zinc-400">
              {item.rejection_reason || REJECTION_REASON}
            </span>
          </DetailRow>
        )}
      </dl>

      {item.status === 'pending' && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <AdminButton onClick={() => onApprove(item)}>Aprobar</AdminButton>
          <AdminButton
            variant="danger"
            disabled={actionId === item.id}
            onClick={() => onReject(item)}
          >
            {actionId === item.id ? 'Rechazando…' : 'Rechazar'}
          </AdminButton>
        </div>
      )}

      {item.status === 'approved' && (
        <div className="flex flex-col gap-2">
          <AdminButton variant="secondary" onClick={() => onEditPayment(item)}>
            {item.payment_amount_cup != null ? 'Editar monto pagado' : 'Registrar monto pagado'}
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => onEditSubscription(item)}>
            Editar plan y suscripción
          </AdminButton>
        </div>
      )}

      {item.status === 'expired' && (
        <div className="flex flex-col gap-2">
          <AdminButton onClick={() => onRenew(item)}>Renovar plan</AdminButton>
          <p className={`text-center text-xs ${adminSubtle}`}>
            Al renovar, la tienda vuelve a la pestaña Aprobadas.
          </p>
        </div>
      )}
    </AdminModal>
  )
}
