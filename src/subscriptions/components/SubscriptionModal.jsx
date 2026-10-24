import { useEffect, useMemo, useState } from 'react'

import AdminButton from '../../components/admin/AdminButton'
import AdminDatePicker from '../../components/admin/AdminDatePicker'
import AdminModal from '../../components/admin/AdminModal'
import AdminSelect from '../../components/admin/AdminSelect'
import { useDismissibleModal } from '../../components/buyer/useOrderModalPresence'
import Checkbox from '../../components/ui/Checkbox'
import { adminAlertError, adminLabel, adminSubtle } from '../../components/admin/adminStyles'
import { BILLING_LABELS, PLAN_TIER_LABELS } from '../../constants/admin.js'
import { getSellerPlan, normalizePlanTier, PLAN_TIER_ORDER } from '../constants.js'
import { parseCupInput } from '../../lib/money'
import { usePlanPricing } from '../../lib/usePlanPricing'
import {
  addBillingPeriod,
  formatDateForApi,
  formatDateLabel,
  parseApiDate,
  startOfDay,
} from '../../lib/dates'
import {
  approveRegistration,
  fetchAdminRegistrationGestores,
  renewRegistration,
  updateRegistrationSubscription,
} from '../api.js'
import {
  buildReplaceSubscriptionBody,
  isKeepSelectionInvalid,
  listActiveGestores,
  needsGestorKeepPicker,
  toggleKeepGestorId,
} from '../context.js'
import { maxGestoresForPlan } from '../../lib/gestorPlanLimits'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { getAdminToken } from '../../lib/adminAuth'

function PlanFields({ planTier, billingPeriod, onPlanTierChange, onBillingPeriodChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="subscription-plan-tier" className={adminLabel}>
          Plan
        </label>
        <AdminSelect
          id="subscription-plan-tier"
          value={planTier}
          onChange={onPlanTierChange}
          dropdownZIndex={70}
          options={PLAN_TIER_ORDER.map((tier) => ({ value: tier, label: PLAN_TIER_LABELS[tier] }))}
        />
      </div>
      <div>
        <label htmlFor="subscription-billing-period" className={adminLabel}>
          Facturación
        </label>
        <AdminSelect
          id="subscription-billing-period"
          value={billingPeriod}
          onChange={onBillingPeriodChange}
          dropdownZIndex={70}
          options={[
            { value: 'monthly', label: BILLING_LABELS.monthly },
            { value: 'quarterly', label: BILLING_LABELS.quarterly },
            { value: 'yearly', label: BILLING_LABELS.yearly },
          ]}
        />
      </div>
    </div>
  )
}

function GestorKeepPicker({
  gestores,
  loading,
  loadError,
  limit,
  selectedIds,
  onToggle,
}) {
  const active = listActiveGestores(gestores)
  const selectedCount = selectedIds.length

  return (
    <div>
      <p className={`mb-2 ${adminLabel}`}>Gestores que se quedan activos</p>
      <p className={`mb-3 text-xs ${adminSubtle}`}>
        El nuevo plan permite hasta {limit} gestores. Marca cuáles se quedan; los demás se
        desactivan. Elegidos: {selectedCount} de {limit} (hay {active.length} activos).
      </p>
      {loading ? (
        <p className={`text-sm ${adminSubtle}`}>Cargando gestores…</p>
      ) : loadError ? (
        <p className={adminAlertError} role="alert">
          {loadError}
        </p>
      ) : (
        <ul className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/60 p-2">
          {active.map((gestor) => {
            const checked = selectedIds.includes(gestor.id)
            const blocked = !checked && selectedCount >= limit
            return (
              <li key={gestor.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 ${
                    blocked ? 'opacity-50' : 'hover:bg-zinc-900/80'
                  }`}
                >
                  <Checkbox
                    tone="admin"
                    checked={checked}
                    disabled={blocked}
                    onChange={() => onToggle(gestor.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-100">
                      @{gestor.username}
                    </span>
                    <span className={`block text-xs ${adminSubtle}`}>
                      {gestor.phone || (gestor.has_password ? 'Sin teléfono' : 'Pendiente de registro')}
                    </span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default function SubscriptionModal({ registration, mode, onClose: requestClose, onSuccess }) {
  const { dismiss: onClose, motionClass } = useDismissibleModal(requestClose)
  const isEdit = mode === 'edit'
  const isRenew = mode === 'renew'
  const { getPlanPrice } = usePlanPricing()
  const [planTier, setPlanTier] = useState(() => normalizePlanTier(registration.plan_tier))
  const [billingPeriod, setBillingPeriod] = useState(registration.billing_period || 'monthly')

  const initialDate = isRenew
    ? startOfDay(
        addBillingPeriod(
          (() => {
            const currentEnd = parseApiDate(registration.subscription_ends_at)
            const today = startOfDay(new Date())
            return currentEnd && currentEnd.getTime() > today.getTime() ? currentEnd : new Date()
          })(),
          registration.billing_period,
        ),
      )
    : startOfDay(addBillingPeriod(new Date(), billingPeriod))

  const [endsAt, setEndsAt] = useState(initialDate ?? startOfDay(new Date()))
  const [paymentAmount, setPaymentAmount] = useState(
    () => String(getPlanPrice(planTier, billingPeriod)?.amount ?? ''),
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [gestores, setGestores] = useState([])
  const [gestoresLoading, setGestoresLoading] = useState(false)
  const [gestoresError, setGestoresError] = useState('')
  const [keepGestorIds, setKeepGestorIds] = useState([])

  const suggestedAmount = getPlanPrice(planTier, billingPeriod)?.amount
  const currentPlanName = getSellerPlan(registration).name
  const gestorLimit = maxGestoresForPlan(planTier)
  const activeGestores = useMemo(() => listActiveGestores(gestores), [gestores])
  const needsGestorPick = (isEdit || isRenew) && needsGestorKeepPicker(planTier, gestores)
  const replaceEndsAt = useMemo(
    () => startOfDay(addBillingPeriod(new Date(), billingPeriod)),
    [billingPeriod],
  )

  function handleBillingPeriodChange(nextPeriod) {
    setBillingPeriod(nextPeriod)
    if (isEdit) return
    setEndsAt((current) => {
      const anchor = isRenew && current ? current : new Date()
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

  useEffect(() => {
    if (!isEdit && !isRenew) return
    let cancelled = false
    setGestoresLoading(true)
    setGestoresError('')
    fetchAdminRegistrationGestores(getAdminToken(), registration.id)
      .then((data) => {
        if (cancelled) return
        setGestores(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (cancelled) return
        setGestoresError(getUserFacingMessage(err, 'No pudimos cargar los gestores.'))
      })
      .finally(() => {
        if (!cancelled) setGestoresLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isEdit, isRenew, registration.id])

  useEffect(() => {
    setKeepGestorIds((current) => {
      const next = current.filter((id) => activeGestores.some((gestor) => gestor.id === id))
      if (next.length === current.length && next.every((id, index) => id === current[index])) {
        return current
      }
      return next
    })
  }, [activeGestores])

  function toggleKeepGestor(gestorId) {
    setKeepGestorIds((current) => toggleKeepGestorId(current, gestorId, gestorLimit))
  }

  const modalTitle = isRenew
    ? 'Renovar suscripción'
    : isEdit
      ? 'Actualizar suscripción'
      : 'Aprobar solicitud'

  const submitLabel = isRenew ? 'Renovar suscripción' : isEdit ? 'Reemplazar suscripción' : 'Aprobar'
  const keepSelectionInvalid = isKeepSelectionInvalid({
    needsPick: needsGestorPick,
    loading: gestoresLoading,
    loadError: gestoresError,
    selectedIds: keepGestorIds,
    limit: gestorLimit,
  })

  async function handleSubmit(e) {
    e.preventDefault()

    if (needsGestorPick && keepGestorIds.length > gestorLimit) {
      setError(`Elige como máximo ${gestorLimit} gestores para el plan ${PLAN_TIER_LABELS[planTier]}.`)
      return
    }

    if (!isEdit && !endsAt) {
      setError('Selecciona la fecha de fin de suscripción.')
      return
    }

    const endDate = isEdit ? null : formatDateForApi(endsAt)
    if (!isEdit && !endDate) {
      setError('La fecha seleccionada no es válida.')
      return
    }

    const amountCup = isEdit ? null : parseCupInput(paymentAmount, { allowZero: true })
    if (!isEdit && amountCup == null) {
      setError('Indica el monto pagado en CUP (usa 0 si es gratuito).')
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
          keepGestorIds: needsGestorPick ? keepGestorIds : [],
        })
      } else if (isEdit) {
        const replaceBody = buildReplaceSubscriptionBody({
          planTier,
          billingPeriod,
          keepGestorIds,
          needsPick: needsGestorPick,
        })
        updated = await updateRegistrationSubscription(token, registration.id, {
          planTier: replaceBody.plan_tier,
          billingPeriod: replaceBody.billing_period,
          keepGestorIds: replaceBody.keep_gestor_ids,
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
      presenceClass={motionClass}
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

        {isEdit ? (
          <p className={`text-sm ${adminSubtle}`}>
            Está en {currentPlanName}. Al guardar se reemplaza la suscripción actual: empieza hoy
            y queda válida hasta {formatDateLabel(replaceEndsAt)} ({BILLING_LABELS[billingPeriod]}{' '}
            · {PLAN_TIER_LABELS[planTier]}).
          </p>
        ) : null}

        {needsGestorPick ? (
          <GestorKeepPicker
            gestores={gestores}
            loading={gestoresLoading}
            loadError={gestoresError}
            limit={gestorLimit}
            selectedIds={keepGestorIds}
            onToggle={toggleKeepGestor}
          />
        ) : null}

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
              Importe real de la transferencia. Usa <strong className="font-semibold text-zinc-400">0</strong>{' '}
              para tiendas gratuitas. Referencia del plan:{' '}
              {suggestedAmount?.toLocaleString('es')} CUP ({PLAN_TIER_LABELS[planTier]} ·{' '}
              {BILLING_LABELS[billingPeriod]}).
            </p>
          </div>
        )}

        {!isEdit ? (
          <div>
            <p className={`mb-2 ${adminLabel}`}>Suscripción válida hasta</p>
            <AdminDatePicker value={endsAt} onChange={setEndsAt} />
            <p className="mt-2 text-xs text-zinc-500">
              {isRenew
                ? 'Al renovar, la tienda vuelve al estado Aprobada.'
                : 'Al cambiar facturación, la fecha se recalcula (+1 mes, trimestre o año desde hoy).'}
            </p>
          </div>
        ) : null}

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
            disabled={
              loading ||
              keepSelectionInvalid ||
              (!isEdit && (!endsAt || parseCupInput(paymentAmount, { allowZero: true }) == null))
            }
          >
            {loading ? 'Guardando…' : submitLabel}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  )
}
