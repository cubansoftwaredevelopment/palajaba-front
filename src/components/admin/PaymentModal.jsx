import { useState } from 'react'
import AdminButton from './AdminButton'
import AdminModal from './AdminModal'
import { adminAlertError, adminLabel } from './adminStyles'
import { normalizePlanTier } from '../../constants/plan'
import { parseCupInput } from '../../lib/money'
import { usePlanPricing } from '../../lib/usePlanPricing'
import { updateRegistrationPayment } from '../../lib/api'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { getAdminToken } from '../../lib/adminAuth'

export default function PaymentModal({ registration, onClose, onSuccess }) {
  const { getPlanPrice } = usePlanPricing()
  const suggested = getPlanPrice(
    normalizePlanTier(registration.plan_tier),
    registration.billing_period,
  )?.amount
  const [paymentAmount, setPaymentAmount] = useState(
    () => String(registration.payment_amount_cup ?? suggested ?? ''),
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const amountCup = parseCupInput(paymentAmount, { allowZero: true })
    if (amountCup == null) {
      setError('Indica un monto válido en CUP (usa 0 si es gratuito).')
      return
    }

    setError('')
    setLoading(true)
    try {
      const token = getAdminToken()
      const updated = await updateRegistrationPayment(token, registration.id, amountCup)
      onSuccess(updated)
      onClose()
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos registrar el pago.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminModal
      title="Registrar monto pagado"
      subtitle={registration.store_name}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="edit-payment-amount" className={adminLabel}>
            Monto pagado (CUP)
          </label>
          <input
            id="edit-payment-amount"
            type="text"
            inputMode="numeric"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            className="w-full min-h-12 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-base text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            required
          />
          <p className="mt-2 text-xs text-zinc-500">
            Este monto se suma en las estadísticas del mes en que aprobaste la tienda. Usa 0 si no hubo
            pago.
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
          <AdminButton type="submit" disabled={loading || parseCupInput(paymentAmount, { allowZero: true }) == null}>
            {loading ? 'Guardando…' : 'Guardar monto'}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  )
}
