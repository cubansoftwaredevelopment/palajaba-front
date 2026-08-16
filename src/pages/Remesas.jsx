import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthHeader from '../components/auth/AuthHeader'
import { alertErrorClass, hintClass, inputClass, labelClass } from '../components/auth/formStyles'
import BuyerShell from '../components/buyer/BuyerShell'
import {
  buyerContextChip,
  buyerDeliveryTextarea,
  buyerJabaWhatsAppBtn,
  buyerPageIntro,
} from '../components/buyer/buyerStyles'
import Logo from '../components/Logo'
import {
  REMESA_DELIVERY_NOTE,
  REMESA_MUNICIPALITIES,
  REMESA_ZONE,
} from '../constants/remesas'
import {
  computeRemesaAmounts,
  formatEuro,
  openRemesaWhatsApp,
  validateRemesaForm,
} from '../lib/remesas'

const EMPTY_FORM = {
  amount: '',
  sender_name: '',
  recipient_name: '',
  recipient_details: '',
  contact_phone: '',
  municipality_id: '',
  address: '',
}

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function RemesasHeaderStart() {
  return (
    <Link
      to="/"
      className="flex min-w-0 items-center gap-3 rounded-full py-0.5 pr-2 touch-manipulation transition-opacity active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25"
      aria-label="Volver al inicio"
    >
      <Logo className="h-11 w-11 shrink-0 lg:h-12 lg:w-12" />
      <div className="min-w-0">
        <p className="truncate font-display text-base font-bold leading-tight text-brand-green lg:text-lg">
          Remesas
        </p>
        <p className="truncate text-xs font-semibold text-brand-carmelita/80 lg:text-sm">
          {REMESA_ZONE}
        </p>
      </div>
    </Link>
  )
}

export default function Remesas() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const amounts = computeRemesaAmounts(form.amount)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    if (error) setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateRemesaForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const opened = await openRemesaWhatsApp({ form })
      if (!opened) {
        setError('No pudimos abrir WhatsApp. Inténtalo de nuevo.')
      }
    } catch {
      setError('No pudimos abrir WhatsApp. Inténtalo más tarde.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BuyerShell headerStart={<RemesasHeaderStart />} backTo="/" backLabel="Inicio">
      <div className="animate-fade-in">
        <div className={buyerPageIntro}>
          <AuthHeader
            eyebrow="Desde Europa a Cuba"
            title="Envía euros en efectivo a La Habana"
            description="Transfiere euros desde Europa y el destinatario los recibe en efectivo. Sin pago en línea: coordinamos todo por WhatsApp."
            layout="desktop-left"
          />
          <div
            className="mb-6 rounded-2xl border border-brand-yellow/35 bg-brand-yellow/15 px-4 py-3.5 lg:mb-8"
            role="status"
          >
            <p className="text-sm font-semibold text-brand-green">
              Comisión del 10% sobre el monto enviado
            </p>
            <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/90 sm:text-sm">
              Si envías 100€, el destinatario recibe 90€. El domicilio se confirma por WhatsApp.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6"
        >
          <div className="flex flex-col gap-4 sm:gap-5">
          <section className="rounded-2xl border border-brand-green/12 bg-brand-white p-3.5 shadow-sm sm:p-4 lg:p-5">
            <h2 className="font-display text-lg font-bold text-brand-green">Calculadora</h2>
            <p className="mt-1 text-sm leading-relaxed text-brand-carmelita/90">
              Ingresa el monto en euros. El destinatario recibe el 90% en efectivo.
            </p>

            <label htmlFor="remesa-amount" className={`${labelClass} mt-4`}>
              Monto a enviar (euros)
            </label>
            <input
              id="remesa-amount"
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={(event) => updateField('amount', event.target.value)}
              className={inputClass}
              placeholder="100"
              autoComplete="off"
            />

            <div className="mt-3 rounded-2xl border border-brand-green/10 bg-brand-green/[0.06] px-3.5 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-carmelita/80">
                El destinatario recibe
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-brand-green">
                {amounts ? formatEuro(amounts.net) : '—'}
              </p>
              {amounts ? (
                <p className="mt-1 text-xs text-brand-carmelita/85">
                  Enviado {formatEuro(amounts.sent)} · comisión {formatEuro(amounts.commission)}
                </p>
              ) : (
                <p className="mt-1 text-xs text-brand-carmelita/75">Escribe un monto para ver el cálculo.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-brand-green/12 bg-brand-white p-3.5 shadow-sm sm:p-4 lg:p-5">
            <h2 className="font-display text-lg font-bold text-brand-green">Zona de entrega</h2>
            <div className="mt-3 flex justify-start">
              <span className={buyerContextChip}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.017.007.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {REMESA_ZONE}
              </span>
            </div>

            <p className={`${labelClass} mt-4`}>Municipio</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {REMESA_MUNICIPALITIES.map((municipality) => {
                const active = form.municipality_id === municipality.id
                return (
                  <button
                    key={municipality.id}
                    type="button"
                    onClick={() => updateField('municipality_id', municipality.id)}
                    className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition-colors touch-manipulation ${
                      active
                        ? 'border-brand-green bg-brand-green text-brand-white'
                        : 'border-brand-green/18 bg-brand-white text-brand-green active:bg-brand-yellow/15 lg:hover:border-brand-green/35 lg:hover:bg-brand-green/[0.04]'
                    }`}
                    aria-pressed={active}
                  >
                    {municipality.name}
                  </button>
                )
              })}
            </div>

            <p className={`${hintClass} mt-3 rounded-xl border border-brand-green/10 bg-brand-green/[0.04] px-3 py-2.5`}>
              {REMESA_DELIVERY_NOTE}
            </p>
          </section>
          </div>

          <section className="rounded-2xl border border-brand-green/12 bg-brand-white p-3.5 shadow-sm sm:p-4 lg:p-5">
            <h2 className="font-display text-lg font-bold text-brand-green">Datos de la remesa</h2>

            <div className="mt-4 flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="remesa-sender" className={labelClass}>
                  Nombre del remitente <span className="text-brand-carmelita">*</span>
                </label>
                <input
                  id="remesa-sender"
                  type="text"
                  value={form.sender_name}
                  onChange={(event) => updateField('sender_name', event.target.value)}
                  className={inputClass}
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="remesa-recipient" className={labelClass}>
                  Nombre del destinatario en Cuba <span className="text-brand-carmelita">*</span>
                </label>
                <input
                  id="remesa-recipient"
                  type="text"
                  value={form.recipient_name}
                  onChange={(event) => updateField('recipient_name', event.target.value)}
                  className={inputClass}
                  autoComplete="name"
                />
              </div>
              </div>

              <div>
                <label htmlFor="remesa-recipient-details" className={labelClass}>
                  Datos del destinatario
                </label>
                <textarea
                  id="remesa-recipient-details"
                  value={form.recipient_details}
                  onChange={(event) => updateField('recipient_details', event.target.value)}
                  className={buyerDeliveryTextarea}
                  placeholder="Carnet, teléfono en Cuba u otros datos útiles"
                />
              </div>

              <div>
                <label htmlFor="remesa-contact" className={labelClass}>
                  Teléfono / WhatsApp de contacto <span className="text-brand-carmelita">*</span>
                </label>
                <input
                  id="remesa-contact"
                  type="tel"
                  value={form.contact_phone}
                  onChange={(event) => updateField('contact_phone', event.target.value)}
                  className={inputClass}
                  placeholder="+34 600 000 000"
                  autoComplete="tel"
                />
              </div>

              <div>
                <label htmlFor="remesa-address" className={labelClass}>
                  Dirección de entrega <span className="text-brand-carmelita">*</span>
                </label>
                <textarea
                  id="remesa-address"
                  value={form.address}
                  onChange={(event) => updateField('address', event.target.value)}
                  className={buyerDeliveryTextarea}
                  placeholder="Calle, número, entre calles, edificio…"
                />
              </div>
            </div>

            {error ? (
              <p className={`mt-4 ${alertErrorClass}`} role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className={`${buyerJabaWhatsAppBtn} mt-5 lg:w-auto lg:min-w-[16rem] lg:px-6`}
              disabled={submitting}
            >
              <WhatsAppIcon />
              {submitting ? 'Abriendo WhatsApp…' : 'Coordinar por WhatsApp'}
            </button>
          </section>
        </form>
      </div>
    </BuyerShell>
  )
}
