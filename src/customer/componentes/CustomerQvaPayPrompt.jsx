import { useRef, useState } from 'react'
import Checkbox from '../../shared/componentes/Checkbox.jsx'
import BuyerModalPortal from '../../buyer/componentes/BuyerModalPortal.jsx'
import { useDismissibleModal } from '../../buyer/componentes/useOrderModalPresence.js'
import { buyerDeliveryModal, buyerDeliveryModalFooter, buyerDeliveryModalHeader, buyerDeliveryOverlay } from '../../buyer/componentes/buyerStyles.js'
import BuyerMotionFrame from '../../motion/BuyerMotionFrame'
import { useSheetExitMs } from '../../motion/presets'

export default function CustomerQvaPayPrompt({
  open,
  onAddUser,
  onDone,
  title = 'Usuario de QvaPay',
  description = 'Agrega y verifica tu usuario de QvaPay para hacer compras más sencillas y seguras con las tiendas disponibles.',
  addLabel = 'Agregar usuario',
}) {
  const hideOnCloseRef = useRef(false)
  const exitMs = useSheetExitMs()
  const { dismiss, closing, sheetProps } = useDismissibleModal(() => {
    const hide = hideOnCloseRef.current
    hideOnCloseRef.current = false
    onDone(hide)
  }, exitMs, { motion: true })
  const [hideNextTime, setHideNextTime] = useState(false)
  if (!open) return null

  function accept() {
    hideOnCloseRef.current = hideNextTime
    dismiss()
  }

  return (
    <BuyerModalPortal>
      <BuyerMotionFrame
        split
        overlayAs="button"
        closing={closing}
        sheetProps={sheetProps}
        overlayClassName={buyerDeliveryOverlay}
        panelClassName={buyerDeliveryModal}
        overlayProps={{ type: 'button', 'aria-label': 'Cerrar aviso', onClick: dismiss }}
        panelProps={{ role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'qvapay-prompt-title' }}
      >
        <div className={buyerDeliveryModalHeader}>
          <h2 id="qvapay-prompt-title" className="text-lg font-bold text-brand-green">{title}</h2>
        </div>
        <div className="px-4 py-3 text-sm leading-relaxed text-brand-carmelita">
          <p>{description}</p>
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
            {addLabel}
          </button>
          <button type="button" className="min-h-11 rounded-xl bg-brand-green px-3 font-bold text-white" onClick={accept}>
            Listo
          </button>
        </div>
      </BuyerMotionFrame>
    </BuyerModalPortal>
  )
}
