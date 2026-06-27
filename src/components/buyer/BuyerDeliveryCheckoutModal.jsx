import { useEffect, useId, useState } from 'react'
import PhoneField from '../auth/PhoneField'
import { alertErrorClass } from '../auth/formStyles'
import {
  getBuyerDeliveryDefaults,
  saveBuyerDeliveryDefaults,
  validateDeliveryForm,
} from '../../lib/buyerDelivery'
import { getBuyerLocation } from '../../lib/buyerLocation'
import {
  buyerDeliveryFieldLabel,
  buyerDeliveryInput,
  buyerDeliveryModal,
  buyerDeliveryModalBody,
  buyerDeliveryModalFooter,
  buyerDeliveryModalHeader,
  buyerDeliveryOverlay,
  buyerDeliveryTextarea,
  buyerJabaDeliveryBtn,
  buyerJabaWhatsAppBtn,
} from './buyerStyles'

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function BuyerDeliveryCheckoutModal({
  checkout,
  checkoutSubmitting = false,
  onClose,
  onConfirm,
  onPickup,
}) {
  const titleId = useId()
  const location = getBuyerLocation()
  const [form, setForm] = useState(() => getBuyerDeliveryDefaults())
  const [error, setError] = useState('')

  useEffect(() => {
    if (!checkout) return undefined

    setForm(getBuyerDeliveryDefaults())
    setError('')

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [checkout, onClose])

  if (!checkout) return null

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    if (error) setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateDeliveryForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    const delivery = {
      recipient_name: form.recipient_name.trim(),
      address: form.address.trim(),
      phone_primary: form.phone_primary,
      phone_secondary: form.phone_secondary,
      notes: form.notes.trim(),
    }

    saveBuyerDeliveryDefaults(form)
    await onConfirm(delivery)
  }

  async function handlePickup() {
    if (checkoutSubmitting) return
    await onPickup?.()
  }

  const zoneHint =
    location?.municipality?.name && location?.province?.name
      ? `${location.municipality.name}, ${location.province.name}`
      : null

  return (
    <>
      <button type="button" className={buyerDeliveryOverlay} aria-label="Cerrar formulario de domicilio" onClick={onClose} />

      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={buyerDeliveryModal}>
        <div className={buyerDeliveryModalHeader}>
          <h2 id={titleId} className="font-display text-lg font-bold text-brand-green">
            Pedido a domicilio
          </h2>
          <p className="mt-1 text-xs font-medium text-brand-carmelita/80">
            {checkout.storeName} · todos los productos incluyen domicilio
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className={buyerDeliveryModalBody}>
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="delivery-recipient" className={buyerDeliveryFieldLabel}>
                  Nombre de quien recibe <span className="text-brand-carmelita">*</span>
                </label>
                <input
                  id="delivery-recipient"
                  type="text"
                  value={form.recipient_name}
                  onChange={(event) => updateField('recipient_name', event.target.value)}
                  className={buyerDeliveryInput}
                  placeholder="Ej. María López"
                  autoComplete="name"
                  required
                />
              </div>

              <div>
                <label htmlFor="delivery-address" className={buyerDeliveryFieldLabel}>
                  Dirección de entrega <span className="text-brand-carmelita">*</span>
                </label>
                <textarea
                  id="delivery-address"
                  value={form.address}
                  onChange={(event) => updateField('address', event.target.value)}
                  className={buyerDeliveryTextarea}
                  placeholder={
                    zoneHint
                      ? `Calle, número, reparto… (${zoneHint})`
                      : 'Calle, número, entre calles, reparto…'
                  }
                  required
                />
              </div>

              <PhoneField
                id="delivery-phone-primary"
                label="Teléfono de contacto"
                value={form.phone_primary}
                onChange={(value) => updateField('phone_primary', value)}
              />

              <PhoneField
                id="delivery-phone-secondary"
                label="Teléfono adicional (opcional)"
                value={form.phone_secondary}
                onChange={(value) => updateField('phone_secondary', value)}
                required={false}
              />

              <div>
                <label htmlFor="delivery-notes" className={buyerDeliveryFieldLabel}>
                  Detalles adicionales
                </label>
                <textarea
                  id="delivery-notes"
                  value={form.notes}
                  onChange={(event) => updateField('notes', event.target.value)}
                  className={buyerDeliveryTextarea}
                  placeholder="Ej. casa de color verde, llamar al llegar, timbre roto…"
                />
              </div>

              {error ? <p className={alertErrorClass}>{error}</p> : null}
            </div>
          </div>

          <div className={buyerDeliveryModalFooter}>
            <button type="submit" disabled={checkoutSubmitting} className={buyerJabaWhatsAppBtn}>
              <WhatsAppIcon />
              {checkoutSubmitting ? 'Registrando pedido…' : 'Enviar pedido a domicilio'}
            </button>
            {onPickup ? (
              <button
                type="button"
                onClick={handlePickup}
                disabled={checkoutSubmitting}
                className={buyerJabaDeliveryBtn}
              >
                {checkoutSubmitting ? 'Registrando pedido…' : 'Coordinar sin domicilio'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              disabled={checkoutSubmitting}
              className="text-sm font-semibold text-brand-carmelita/80 underline-offset-2 active:text-brand-green lg:hover:text-brand-green lg:hover:underline disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
