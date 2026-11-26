import { useNavigate } from 'react-router-dom'
import RegisterProgress from '../componentes/RegisterProgress.jsx'
import PlanCustomizeView from '../../subscriptions/componentes/PlanCustomizeView.jsx'
import { createCustomPlanCheckout, fetchCustomPlanCheckout } from '../../subscriptions/api.js'
import { getRegisterSteps } from '../utils/constants.js'
import { useFormErrorToast } from '../../shared/componentes/useFormErrorToast.jsx'

export default function RegisterCustomize() {
  const navigate = useNavigate()
  const { showError, toastNode } = useFormErrorToast({ aboveNav: true })

  function continueWithPurchase(purchaseId, billing) {
    navigate('/registro', {
      state: {
        kind: 'custom',
        billing,
        planTier: 'standard',
        qvapayPurchaseId: purchaseId,
      },
    })
  }

  return (
    <>
      <PlanCustomizeView
        backTo="/registro/planes"
        progress={<RegisterProgress currentStep={1} steps={getRegisterSteps('custom')} className="mx-auto mb-4 w-full max-w-sm lg:mb-6" />}
        showError={showError}
        onPay={({ billing, plugins, paymentMethod, transferId }) => createCustomPlanCheckout({
          billing_period: billing,
          plugins,
          payment_method: paymentMethod,
          ...(paymentMethod === 'cup' ? { transfer_id: transferId } : {}),
        })}
        onRefresh={(purchaseId) => fetchCustomPlanCheckout(purchaseId)}
        onContinue={(result, _method, billing) => continueWithPurchase(result.purchase_id, billing)}
      />
      {toastNode}
    </>
  )
}
