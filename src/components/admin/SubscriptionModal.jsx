import { useEffect, useState } from 'react'

import AdminButton from './AdminButton'

import AdminDatePicker from './AdminDatePicker'

import AdminModal from './AdminModal'

import { adminAlertError, adminInput, adminLabel } from './adminStyles'

import { BILLING_LABELS, PLAN_TIER_LABELS } from '../../constants/admin'

import { normalizePlanTier, PLAN_TIER_ORDER } from '../../constants/plan'

import { parseCupInput } from '../../lib/money'
import { usePlanPricing } from '../../lib/usePlanPricing'

import {

  addBillingPeriod,

  formatDateForApi,

  parseApiDate,

  startOfDay,

} from '../../lib/dates'

import {

  approveRegistration,

  renewRegistration,

  updateRegistrationSubscription,

} from '../../lib/api'

import { getUserFacingMessage } from '../../lib/userFacingError'

import { getAdminToken } from '../../lib/adminAuth'



function PlanFields({ planTier, billingPeriod, onPlanTierChange, onBillingPeriodChange }) {

  return (

    <div className="grid gap-4 sm:grid-cols-2">

      <div>

        <label htmlFor="subscription-plan-tier" className={adminLabel}>

          Plan

        </label>

        <select

          id="subscription-plan-tier"

          value={planTier}

          onChange={(event) => onPlanTierChange(event.target.value)}

          className={adminInput}

        >

          {PLAN_TIER_ORDER.map((tier) => (

            <option key={tier} value={tier}>

              {PLAN_TIER_LABELS[tier]}

            </option>

          ))}

        </select>

      </div>

      <div>

        <label htmlFor="subscription-billing-period" className={adminLabel}>

          Facturación

        </label>

        <select

          id="subscription-billing-period"

          value={billingPeriod}

          onChange={(event) => onBillingPeriodChange(event.target.value)}

          className={adminInput}

        >

          <option value="monthly">{BILLING_LABELS.monthly}</option>

          <option value="yearly">{BILLING_LABELS.yearly}</option>

        </select>

      </div>

    </div>

  )

}



export default function SubscriptionModal({ registration, mode, onClose, onSuccess }) {

  const isEdit = mode === 'edit'

  const isRenew = mode === 'renew'

  const { getPlanPrice } = usePlanPricing()

  const [planTier, setPlanTier] = useState(() => normalizePlanTier(registration.plan_tier))

  const [billingPeriod, setBillingPeriod] = useState(registration.billing_period || 'monthly')



  const initialDate = isRenew
    ? startOfDay(addBillingPeriod(new Date(), registration.billing_period))
    : isEdit
      ? parseApiDate(registration.subscription_ends_at) ?? startOfDay(new Date())
      : startOfDay(addBillingPeriod(new Date(), billingPeriod))



  const [endsAt, setEndsAt] = useState(initialDate ?? startOfDay(new Date()))

  const [paymentAmount, setPaymentAmount] = useState(

    () => String(getPlanPrice(planTier, billingPeriod)?.amount ?? ''),

  )

  const [error, setError] = useState('')

  const [loading, setLoading] = useState(false)



  const suggestedAmount = getPlanPrice(planTier, billingPeriod)?.amount

  function handleBillingPeriodChange(nextPeriod) {
    setBillingPeriod(nextPeriod)
    setEndsAt((current) => {
      const anchor = isEdit && current ? current : new Date()
      return startOfDay(addBillingPeriod(anchor, nextPeriod))
    })
  }

  useEffect(() => {
    if (isEdit || isRenew) return
    setEndsAt(startOfDay(addBillingPeriod(new Date(), billingPeriod)))
  }, [billingPeriod, isEdit, isRenew])



  useEffect(() => {

    if (isEdit) return

    setPaymentAmount(String(suggestedAmount ?? ''))

  }, [isEdit, planTier, billingPeriod, suggestedAmount])



  const modalTitle = isRenew

    ? 'Renovar suscripción'

    : isEdit

      ? 'Editar suscripción'

      : 'Aprobar solicitud'



  const submitLabel = isRenew ? 'Renovar plan' : isEdit ? 'Guardar cambios' : 'Aprobar'



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

      setError('Indica el monto real que pagó la tienda (en CUP).')

      return

    }



    setError('')

    setLoading(true)



    try {

      const token = getAdminToken()

      let updated



      if (isRenew) {

        updated = await renewRegistration(token, registration.id, {

          subscriptionEndsAt: endDate,

          paymentAmountCup: amountCup,

          planTier,

          billingPeriod,

        })

      } else if (isEdit) {

        updated = await updateRegistrationSubscription(token, registration.id, {

          subscriptionEndsAt: endDate,

          planTier,

          billingPeriod,

        })

      } else {

        updated = await approveRegistration(token, registration.id, endDate, amountCup)

      }



      onSuccess(updated)

      onClose()

    } catch (err) {

      setError(

        getUserFacingMessage(

          err,

          isRenew

            ? 'No pudimos renovar la suscripción.'

            : 'No pudimos actualizar la suscripción.',

        ),

      )

    } finally {

      setLoading(false)

    }

  }



  return (

    <AdminModal

      title={modalTitle}

      subtitle={`${registration.store_name}${isRenew ? ' · suscripción vencida' : ''}`}

      onClose={onClose}

    >

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {(isEdit || isRenew) && (

          <PlanFields

            planTier={planTier}

            billingPeriod={billingPeriod}

            onPlanTierChange={setPlanTier}

            onBillingPeriodChange={handleBillingPeriodChange}

          />

        )}



        {!isEdit && (

          <div>

            <label htmlFor="payment-amount-cup" className={adminLabel}>

              Monto pagado (CUP)

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

              Importe real de la transferencia. Referencia del plan:{' '}

              {suggestedAmount?.toLocaleString('es')} CUP ({PLAN_TIER_LABELS[planTier]} ·{' '}

              {BILLING_LABELS[billingPeriod]}).

            </p>

          </div>

        )}



        <div>

          <p className={`mb-2 ${adminLabel}`}>Suscripción válida hasta</p>

          <AdminDatePicker value={endsAt} onChange={setEndsAt} />

          <p className="mt-2 text-xs text-zinc-500">

            {isRenew

              ? 'Al renovar, la tienda vuelve al estado Aprobada.'

              : isEdit

                ? 'Al cambiar facturación, se suma 1 mes o 1 año a la fecha de vencimiento actual.'

                : 'Al cambiar facturación, la fecha se recalcula (+1 mes o +1 año desde hoy).'}

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

            {loading ? 'Guardando…' : submitLabel}

          </AdminButton>

        </div>

      </form>

    </AdminModal>

  )

}


