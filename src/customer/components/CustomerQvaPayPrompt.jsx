import { useState } from 'react'
import Checkbox from '../../components/ui/Checkbox'
import BuyerModalPortal from '../../buyer/components/BuyerModalPortal'
import { useDismissibleModal } from '../../buyer/components/useOrderModalPresence'
import { buyerDeliveryModal, buyerDeliveryModalFooter, buyerDeliveryModalHeader, buyerDeliveryOverlay } from '../../buyer/components/buyerStyles'

export default function CustomerQvaPayPrompt({ open, onAddUser, onDone }) {
  const { dismiss, motionClass } = useDismissibleModal(() => onDone(false))
  const [hideNextTime, setHideNextTime] = useState(false)
  if (!open) return null

  return (
    <BuyerModalPortal>
      <button type="button" className={`${buyerDeliveryOverlay} ${motionClass}`} aria-label="Cerrar aviso" onClick={dismiss} />
      <div role="dialog" aria-modal="true" aria-labelledby="qvapay-prompt-title" className={`${buyerDeliveryModal} ${motionClass}`}>
        <div className={buyerDeliveryModalHeader}>
          <h2 id="qvapay-prompt-title" className="text-lg font-bold text-brand-green">Usuario de QvaPay</h2>
        </div>
        <div className="px-4 py-3 text-sm leading-relaxed text-brand-carmelita">
          <p>Agrega y verifica tu usuario de QvaPay en el perfil para poder pagar y recibir devoluciones.</p>
          <label className="mt-4 flex cursor-pointer items-center gap-2.5 font-semibold">
            <Checkbox
              id="qvapay-hide-prompt"
              checked={hideNextTime}
              onChange={(event) => setHideNextTime(event.target.checked)}
            />
            No volver a mostrar este aviso
          </label>
        </div>
        <div className={`${buyerDeliveryModalFooter} grid grid-cols-2 gap-2`}>
          <button type="button" className="min-h-11 rounded-xl border border-brand-green/20 px-3 font-bold text-brand-green" onClick={onAddUser}>
            Agregar usuario
          </button>
          <button type="button" className="min-h-11 rounded-xl bg-brand-green px-3 font-bold text-white" onClick={() => onDone(hideNextTime)}>
            Listo
          </button>
        </div>
      </div>
    </BuyerModalPortal>
  )
}
