import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../shared/componentes/Button.jsx'
import PlanCustomizeView from '../../subscriptions/componentes/PlanCustomizeView.jsx'
import { createPluginAddonCheckout, fetchSubscriptionQvaPayCheckout } from '../../subscriptions/api.js'
import { normalizeBillingPeriod } from '../../subscriptions/utils/constants.js'
import { useFormErrorToast } from '../../shared/componentes/useFormErrorToast.jsx'
import { fetchSellerProfile } from '../../auth/api.js'
import { getSellerProfile, getSellerToken } from '../utils/sellerAuth.js'

function ownedPluginIds(profile) {
  const access = profile?.plugin_access
  if (!access) return []
  return Object.entries(access)
    .filter(([, value]) => value == null || Number(value) > 0)
    .map(([id]) => id)
}

function formatDate(value) {
  if (!value) return 'la fecha de vencimiento de tu plan'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'la fecha de vencimiento de tu plan'
  return date.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function SellerPlanCustomize() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showError, toastNode } = useFormErrorToast({ aboveNav: true })
  const [profile, setProfile] = useState(() => getSellerProfile())
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    const token = getSellerToken()
    if (!token) return undefined
    let mounted = true
    fetchSellerProfile(token)
      .then((next) => {
        if (mounted) setProfile(next)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  if (profile && profile.profile_completed === false) {
    return <Navigate to="/tienda/completar-perfil" replace />
  }

  const billing = normalizeBillingPeriod(profile?.billing_period)

  function goBack() {
    if (location.key !== 'default') {
      navigate(-1)
      return
    }
    navigate('/tienda/perfil')
  }

  return (
    <>
      <PlanCustomizeView
        onBack={goBack}
        eyebrow="Tu plan"
        title="Personalización de plan"
        description="Elige las funciones y revisa cada precio en USD y CUP."
        initialBilling={billing}
        ownedPluginIds={ownedPluginIds(profile)}
        billingLocked
        cupButtonLabel="Confirmar transferencia"
        paidButtonLabel="Ya pagué"
        statusMessage={statusMessage}
        showError={showError}
        confirmCheckout={({ proceed, cancel }) => (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-2xl bg-brand-white p-5">
              <h4 className="font-display text-xl font-bold text-brand-green">Este complemento vence con tu plan</h4>
              <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/85">
                Se apaga el {formatDate(profile?.subscription_ends_at)}, el mismo día que tu plan. No se prorratea.
              </p>
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="secondary" onClick={cancel}>Volver</Button>
                <Button type="button" onClick={proceed}>Continuar al pago</Button>
              </div>
            </div>
          </div>
        )}
        onPay={({ plugins, paymentMethod, transferId }) => createPluginAddonCheckout(getSellerToken(), {
          billing_period: billing,
          plugins,
          payment_method: paymentMethod,
          ...(paymentMethod === 'cup' ? { transfer_id: transferId } : {}),
        })}
        onRefresh={(purchaseId) => fetchSubscriptionQvaPayCheckout(getSellerToken(), purchaseId)}
        onContinue={(_result, method) => {
          setStatusMessage(method === 'cup'
            ? 'Recibimos el identificador. El complemento queda pendiente de confirmación.'
            : 'El complemento ya está en tu plan.')
        }}
      />
      {toastNode}
    </>
  )
}
