import { useEffect, useId, useRef, useState } from 'react'
import PhoneField from '../auth/PhoneField'
import { alertErrorClass } from '../auth/formStyles'
import {
  getBuyerDeliveryDefaults,
  saveBuyerDeliveryDefaults,
  validateDeliveryAddress,
  validateDeliveryContact,
  validateDeliveryForm,
} from '../../lib/buyerDelivery'
import { getBuyerLocation } from '../../lib/buyerLocation'
import { formatPhoneDigits, PHONE_PREFIX } from '../../lib/phone'
import { useLiveLocation } from '../../live/context/LiveLocationContext.jsx'
import { buildOpenStreetMapUrl } from '../../lib/openStreetMap'
import BuyerOrderLocationMap from './BuyerOrderLocationMap'
import { orderModalMotionClass, useOrderModalPresence } from './useOrderModalPresence'
import {
  buyerDeliveryFieldLabel,
  buyerDeliveryInput,
  buyerDeliveryModal,
  buyerDeliveryModalBody,
  buyerDeliveryModalFooter,
  buyerDeliveryModalHeader,
  buyerDeliveryOverlay,
  buyerDeliveryTextarea,
  buyerJabaPrimaryBtn,
  buyerJabaSecondaryBtn,
  buyerJabaWhatsAppBtn,
} from './buyerStyles'

const STEP_TITLES = ['Quién recibe', 'Dónde entregamos', 'Confirmar pedido']

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function formatContact(digits) {
  if (!digits) return null
  return `${PHONE_PREFIX} ${formatPhoneDigits(digits)}`
}

export default function BuyerDeliveryCheckoutModal({
  checkout,
  checkoutSubmitting = false,
  onClose,
  onConfirm,
}) {
  const titleId = useId()
  const location = getBuyerLocation()
  const { coords } = useLiveLocation()
  const [point, setPoint] = useState(null)
  const [mapSession, setMapSession] = useState(0)
  const [step, setStep] = useState(1)
  const [pickup, setPickup] = useState(false)
  const open = Boolean(checkout)
  const shownCheckoutRef = useRef(checkout)
  if (checkout) shownCheckoutRef.current = checkout
  const shownCheckout = checkout ?? shownCheckoutRef.current
  const { present, closing } = useOrderModalPresence(open)
  const motionClass = orderModalMotionClass(closing)
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setMapSession((current) => current + 1)
      setPoint(null)
      setPickup(false)
      setStep(1)
    }
  }
  const mapUrl = buildOpenStreetMapUrl(point?.lat, point?.lng)
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

  if (!present || !shownCheckout) return null

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    if (error) setError('')
  }

  function goBack() {
    setError('')
    if (step === 3) setPickup(false)
    setStep((current) => Math.max(1, current - 1))
  }

  function goNextFromContact() {
    const validationError = validateDeliveryContact(form)
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setStep(2)
  }

  function goNextFromAddress(skipLocation) {
    if (!skipLocation) {
      const validationError = validateDeliveryAddress(form)
      if (validationError) {
        setError(validationError)
        return
      }
    }
    if (skipLocation) setPoint(null)
    setPickup(skipLocation)
    setError('')
    setStep(3)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (step === 1) {
      goNextFromContact()
      return
    }
    if (step === 2) {
      goNextFromAddress(false)
      return
    }

    if (pickup) {
      const validationError = validateDeliveryContact(form)
      if (validationError) {
        setError(validationError)
        return
      }

      saveBuyerDeliveryDefaults(form)
      await onConfirm({
        mode: 'pickup',
        recipient_name: form.recipient_name.trim(),
        phone_primary: form.phone_primary,
        phone_secondary: form.phone_secondary,
        notes: form.notes.trim(),
      })
      return
    }

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
    if (mapUrl && point) {
      delivery.latitude = point.lat
      delivery.longitude = point.lng
    }

    saveBuyerDeliveryDefaults(form)
    await onConfirm(delivery)
  }

  const zoneHint =
    location?.municipality?.name && location?.province?.name
      ? `${location.municipality.name}, ${location.province.name}`
      : null
  const primaryPhone = formatContact(form.phone_primary)
  const secondaryPhone = formatContact(form.phone_secondary)

  return (
    <>
      <button
        type="button"
        className={`${buyerDeliveryOverlay} ${motionClass}`}
        aria-label="Cerrar formulario de domicilio"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${buyerDeliveryModal} ${motionClass} ${step === 2 ? '!h-[min(92dvh,52rem)] !max-h-[min(92dvh,52rem)]' : ''}`}
      >
        <div className={buyerDeliveryModalHeader}>
          <div className="flex items-start gap-1">
            {step > 1 ? (
              <button
                type="button"
                onClick={goBack}
                disabled={checkoutSubmitting}
                aria-label="Atrás"
                className="-ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-green active:bg-brand-yellow/30 disabled:opacity-50"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M15 18 9 12l6-6" />
                </svg>
              </button>
            ) : null}
            <div className="min-w-0">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-carmelita">
                Paso {step} de 3
              </p>
              <h2 id={titleId} className="font-display text-lg font-bold text-brand-green">
                {STEP_TITLES[step - 1]}
              </h2>
              <p className="mt-1 text-xs font-medium text-brand-carmelita">
                {shownCheckout.storeName} · {pickup ? 'recoger en la tienda' : 'pedido a domicilio'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className={`${buyerDeliveryModalBody} ${step === 2 ? 'flex flex-col' : ''}`}>
            {step === 1 ? (
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
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <div className="shrink-0">
                  <label htmlFor="delivery-address" className={buyerDeliveryFieldLabel}>
                    Dirección de entrega <span className="text-brand-carmelita">*</span>
                  </label>
                  <input
                    id="delivery-address"
                    type="text"
                    value={form.address}
                    onChange={(event) => updateField('address', event.target.value)}
                    className={buyerDeliveryInput}
                    placeholder={
                      zoneHint
                        ? `Calle, número, reparto… (${zoneHint})`
                        : 'Calle, número, entre calles, reparto…'
                    }
                    autoComplete="street-address"
                    required
                  />
                </div>
                <div className="flex min-h-0 flex-1 flex-col">
                  <p className={buyerDeliveryFieldLabel}>Ubicación en el mapa</p>
                  <BuyerOrderLocationMap
                    key={mapSession}
                    fill
                    initialCoords={point ?? coords}
                    onChange={setPoint}
                  />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="rounded-2xl border border-brand-green/10 bg-brand-green/[0.04] px-4 py-3 text-sm text-brand-green">
                <p className="font-bold">{form.recipient_name.trim()}</p>
                <p className="mt-1 text-brand-carmelita">{primaryPhone}</p>
                {secondaryPhone ? <p className="text-brand-carmelita">{secondaryPhone}</p> : null}
                {pickup ? (
                  <p className="mt-3 font-semibold">Recoger en la tienda</p>
                ) : (
                  <p className="mt-3">{form.address.trim()}</p>
                )}
                {form.notes.trim() ? (
                  <p className="mt-2 text-brand-carmelita">{form.notes.trim()}</p>
                ) : null}
                {pickup ? null : (
                  <p className="mt-3 text-xs text-brand-carmelita">
                    {point ? 'El punto del mapa se envía por WhatsApp.' : 'Sin punto en el mapa.'}
                  </p>
                )}
              </div>
            ) : null}

            {error ? <p className={`${alertErrorClass} mt-4`}>{error}</p> : null}
          </div>

          <div className={buyerDeliveryModalFooter}>
            {step === 1 ? (
              <button type="submit" className={`${buyerJabaPrimaryBtn} mx-auto !w-auto min-w-36 px-8`}>
                Siguiente
              </button>
            ) : null}

            {step === 2 ? (
              <div className="flex w-full items-center gap-2">
                <button
                  type="button"
                  onClick={() => goNextFromAddress(true)}
                  className={`${buyerJabaSecondaryBtn} min-w-0 flex-1`}
                >
                  Recoger en la tienda
                </button>
                <button type="submit" className={`${buyerJabaPrimaryBtn} min-w-0 flex-1`}>
                  Siguiente
                </button>
              </div>
            ) : null}

            {step === 3 ? (
              <button
                type="submit"
                disabled={checkoutSubmitting}
                className={`${buyerJabaWhatsAppBtn} w-full px-3 text-center leading-tight`}
              >
                <WhatsAppIcon />
                {checkoutSubmitting ? 'Registrando pedido…' : 'Enviar por WhatsApp'}
              </button>
            ) : null}

          </div>
        </form>
      </div>
    </>
  )
}
