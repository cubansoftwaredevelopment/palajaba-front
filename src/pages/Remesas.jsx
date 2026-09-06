import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthHeader from '../components/auth/AuthHeader'
import { alertErrorClass, inputClass, labelClass } from '../components/auth/formStyles'
import BuyerShell from '../components/buyer/BuyerShell'
import { buyerDeliveryTextarea, buyerJabaWhatsAppBtn } from '../components/buyer/buyerStyles'
import Logo from '../components/Logo'
import InfoDisclosure from '../components/ui/InfoDisclosure'
import {
  REMESA_DELIVERY_NOTE,
  REMESA_MIN_COMMISSION,
  REMESA_MIN_SENT,
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
  const belowMinCommission = Boolean(amounts && amounts.commission < REMESA_MIN_COMMISSION)

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
        <div className="mb-5 sm:mb-6 [&>header]:mb-3 sm:[&>header]:mb-3.5">
          <AuthHeader
            eyebrow="Desde Europa a Cuba"
            title={`Envía euros en efectivo a ${REMESA_ZONE}`}
            description="Sin pago en línea: coordinamos todo por WhatsApp."
            layout="desktop-left"
          />
          <p
            className="rounded-xl border border-brand-yellow/35 bg-brand-yellow/15 px-3.5 py-2 text-xs font-semibold leading-snug text-brand-green sm:text-sm"
            role="status"
          >
            Comisión del 10% · monto mínimo a recibir {formatEuro(REMESA_MIN_SENT)} · comisión mínima{' '}
            {formatEuro(REMESA_MIN_COMMISSION)}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 sm:gap-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6"
        >
          <div className="flex flex-col gap-4 sm:gap-5">
          <section className="rounded-2xl border border-brand-green/12 bg-brand-white p-3.5 shadow-sm sm:p-4 lg:p-5">
            <h2 className="font-display text-lg font-bold text-brand-green">Calculadora</h2>

            <label htmlFor="remesa-amount" className={`${labelClass} mt-3`}>
              Monto que quiere recibir el destinatario (euros)
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

            <div className="mt-4 rounded-2xl border border-brand-green/12 bg-brand-green/[0.08] px-4 py-5 text-center sm:py-6">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-brand-carmelita/70">
                El destinatario recibe
              </p>
              <p className="mt-1.5 font-display text-5xl font-bold leading-none tracking-tight text-brand-green sm:text-6xl">
                {amounts ? formatEuro(amounts.received) : '—'}
              </p>
              {amounts ? (
                <p className="mt-3 text-xs text-brand-carmelita/65 sm:text-sm">
                  Transferencia {formatEuro(amounts.toTransfer)} · comisión {formatEuro(amounts.commission)}
                </p>
              ) : (
                <p className="mt-3 text-xs text-brand-carmelita/55 sm:text-sm">
                  Escribe un monto para ver el cálculo.
                </p>
              )}
              {belowMinCommission ? (
                <p className="mt-3 text-xs font-medium text-brand-carmelita" role="alert">
                  La comisión mínima es {formatEuro(REMESA_MIN_COMMISSION)}. El destinatario debe recibir al menos{' '}
                  {formatEuro(REMESA_MIN_SENT)}.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-brand-green/12 bg-brand-white p-3.5 shadow-sm sm:p-4 lg:p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-brand-green">Zona de entrega</h2>
                <p className="mt-1 text-sm font-medium text-brand-carmelita/80">
                  Entrega en {REMESA_ZONE}
                </p>
              </div>
              <InfoDisclosure label="Información del costo de domicilio">
                {REMESA_DELIVERY_NOTE}
              </InfoDisclosure>
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
              disabled={submitting || belowMinCommission}
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
