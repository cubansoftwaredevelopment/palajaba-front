import { useState } from 'react'
import AdminButton from './AdminButton'
import AdminDatePicker from './AdminDatePicker'
import AdminModal from './AdminModal'
import { adminAlertError, adminLabel } from './adminStyles'
import { BILLING_LABELS, PLAN_TIER_LABELS } from '../../constants/admin'
import { getPlanPrice, normalizePlanTier } from '../../constants/plan'
import { parseCupInput } from '../../lib/money'
import {
  addBillingPeriod,
  formatDateForApi,
  parseApiDate,
  startOfDay,
} from '../../lib/dates'
import { approveRegistration, updateSubscriptionEnd } from '../../lib/api'
import { getAdminToken } from '../../lib/adminAuth'

export default function SubscriptionModal({ registration, mode, onClose, onSuccess }) {
  const isEdit = mode === 'edit'
  const initialDate = isEdit
    ? parseApiDate(registration.subscription_ends_at)
    : startOfDay(addBillingPeriod(new Date(), registration.billing_period))

  const [endsAt, setEndsAt] = useState(initialDate ?? startOfDay(new Date()))
  const planTier = normalizePlanTier(registration.plan_tier)
  const [paymentAmount, setPaymentAmount] = useState(
    () => String(getPlanPrice(planTier, registration.billing_period)?.amount ?? ''),
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const suggestedAmount = getPlanPrice(planTier, registration.billing_period)?.amount

  async function handleSubmit(e) {
    e.preventDefault()
    if (!endsAt) {
      setError('Selecciona la fecha de fin de suscripción.')
      return
    }

    const endDate = formatDateForApi(endsAt)
    if (!endDate) {
      setError('La fecha seleccionada no es válida.')
      return
    }

    const amountCup = isEdit ? null : parseCupInput(paymentAmount)
    if (!isEdit && amountCup == null) {
      setError('Indica el monto real que pagó la tienda (en USD).')
      return
    }

    setError('')
    setLoading(true)

    try {
      const token = getAdminToken()
      const updated = isEdit
        ? await updateSubscriptionEnd(token, registration.id, endDate)
        : await approveRegistration(token, registration.id, endDate, amountCup)
      onSuccess(updated)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminModal
      title={isEdit ? 'Editar suscripción' : 'Aprobar solicitud'}
      subtitle={`${registration.store_name} · ${PLAN_TIER_LABELS[planTier]} · ${BILLING_LABELS[registration.billing_period]}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isEdit && (
          <div>
            <label htmlFor="payment-amount-cup" className={adminLabel}>
              Monto pagado (USD)
            </label>
            <input
              id="payment-amount-cup"
              type="text"
              inputMode="numeric"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={suggestedAmount ? String(suggestedAmount) : '2'}
              className="w-full min-h-12 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-base text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              required
            />
            <p className="mt-2 text-xs text-zinc-500">
              Importe real de la transferencia. Si pagó varios meses por adelantado,
              registra el total (p. ej. 3 meses = {suggestedAmount ? suggestedAmount * 3 : '3× el plan'}).
              Referencia del plan: {suggestedAmount?.toLocaleString('es')} USD.
            </p>
          </div>
        )}

        <div>
          <p className={`mb-2 ${adminLabel}`}>Suscripción válida hasta</p>
          <AdminDatePicker value={endsAt} onChange={setEndsAt} />
          <p className="mt-2 text-xs text-zinc-500">
            {isEdit
              ? 'Extiende o acorta el periodo activo.'
              : 'Ajusta la fecha si cubre más de un mes o un año (p. ej. pago por 3 meses).'}
          </p>
        </div>

        {error && (
          <p className={adminAlertError} role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <AdminButton type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </AdminButton>
          <AdminButton
            type="submit"
            disabled={loading || !endsAt || (!isEdit && !parseCupInput(paymentAmount))}
          >
            {loading ? 'Guardando…' : isEdit ? 'Guardar' : 'Aprobar'}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  )
}
