import { useEffect, useId, useRef, useState } from 'react'
import {
  buyerDeliveryModal,
  buyerDeliveryModalBody,
  buyerDeliveryModalFooter,
  buyerDeliveryModalHeader,
  buyerDeliveryOverlay,
  buyerJabaWhatsAppBtn,
} from './buyerStyles'
import { orderModalMotionClass, useOrderModalPresence } from './useOrderModalPresence'

export default function BuyerPhoneCheckoutModal({
  picker,
  checkoutSubmitting = false,
  onClose,
  onConfirm,
}) {
  const titleId = useId()
  const open = Boolean(picker)
  const shownPickerRef = useRef(picker)
  if (picker) shownPickerRef.current = picker
  const shownPicker = picker ?? shownPickerRef.current
  const { present, closing } = useOrderModalPresence(open)
  const motionClass = orderModalMotionClass(closing)
  const phones = shownPicker?.phones ?? []
  const [selectedKey, setSelectedKey] = useState(() => phones[0]?.key ?? '')

  useEffect(() => {
    if (!picker) return undefined

    setSelectedKey(picker.phones?.[0]?.key ?? '')

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [picker, onClose])

  if (!present || !shownPicker) return null

  const selected = phones.find((item) => item.key === selectedKey) ?? phones[0]

  async function handleConfirm() {
    if (!selected?.phone || checkoutSubmitting) return
    await onConfirm(selected)
  }

  return (
    <div className={`${buyerDeliveryOverlay} ${motionClass}`} role="presentation" onClick={onClose}>
      <div
        className={buyerDeliveryModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={buyerDeliveryModalHeader}>
          <h2 id={titleId} className="font-display text-lg font-bold text-brand-green">
            ¿Con quién coordinas?
          </h2>
          <p className="mt-1 text-sm text-brand-carmelita/85">
            Elige el número de WhatsApp para enviar tu pedido. El pedido queda registrado en la tienda.
          </p>
        </div>

        <div className={buyerDeliveryModalBody}>
          <ul className="flex flex-col gap-2" role="radiogroup" aria-label="Números de contacto">
            {phones.map((option) => {
              const checked = option.key === (selected?.key ?? '')
              return (
                <li key={option.key}>
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors touch-manipulation ${
                      checked
                        ? 'border-brand-green/35 bg-brand-green/[0.06]'
                        : 'border-brand-green/12 bg-brand-white active:bg-brand-green/[0.03]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="checkout-phone"
                      className="h-4 w-4 shrink-0 border-brand-green/30 text-brand-green focus:ring-brand-green/25"
                      checked={checked}
                      onChange={() => setSelectedKey(option.key)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-brand-green">{option.label}</span>
                      <span className="mt-0.5 block text-xs text-brand-carmelita/80">{option.phone}</span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>

        <div className={buyerDeliveryModalFooter}>
          <button
            type="button"
            onClick={onClose}
            disabled={checkoutSubmitting}
            className="min-h-11 rounded-full border border-brand-green/20 px-4 text-sm font-semibold text-brand-green touch-manipulation active:bg-brand-green/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selected?.phone || checkoutSubmitting}
            className={buyerJabaWhatsAppBtn}
          >
            {checkoutSubmitting ? 'Enviando…' : 'Continuar por WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  )
}
