import { useEffect, useState } from 'react'
import SellerFilterDropdown from '../../seller/componentes/SellerFilterDropdown.jsx'
import SellerModalPortal from '../../seller/componentes/SellerModalPortal.jsx'
import SubscriptionDatePicker from '../../shared/componentes/SubscriptionDatePicker.jsx'
import SellerMotionSheet, { useSellerSheet } from '../../motion/SellerMotionSheet'
import {
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerHint,
  sellerInput,
  sellerModalBody,
  sellerModalFooter,
  sellerModalSheet,
  sellerModalTitle,
} from '../../seller/componentes/sellerStyles.js'
import { assignMensajeroBatch, fetchSellerMensajeros } from '../api'
import { FEE_CURRENCIES, vehicleLabel } from '../utils/constants.js'
import { getSellerToken } from '../../seller/utils/sellerAuth.js'

const TIME_OPTIONS = Array.from({ length: 33 }, (_, index) => {
  const total = 6 * 60 + index * 30
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
})

function canPayQvapay(order, messenger) {
  return order.payment_method === 'qvapay' && order.delivery_price != null && messenger?.qvapay_verified
}

function atTime(date, time) {
  const [hours, minutes] = time.split(':').map(Number)
  const next = new Date(date)
  next.setHours(hours, minutes, 0, 0)
  return next
}

export default function AssignCourierModal({ orders, onClose: requestClose, onDone }) {
  const { dismiss: onClose, closing, sheetProps } = useSellerSheet(requestClose)
  const [messengers, setMessengers] = useState([])
  const [messengerId, setMessengerId] = useState('')
  const [step, setStep] = useState('list')
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('18:00')
  const [fees, setFees] = useState(() => Object.fromEntries(orders.map((order) => [order.id, {
    pay_via: 'other',
    fee_amount: '',
    fee_currency: order.delivery_currency || 'CUP',
  }])))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const messenger = messengers.find((item) => item.id === messengerId)

  useEffect(() => {
    fetchSellerMensajeros(getSellerToken()).then((data) => setMessengers(data.items || [])).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  function updateFee(orderId, patch) {
    setFees((current) => ({ ...current, [orderId]: { ...current[orderId], ...patch } }))
  }

  async function confirm(event) {
    event.preventDefault()
    setError('')
    if (!messengerId) {
      setError('Elige un mensajero.')
      return
    }
    if (!startDate || !endDate || !startTime || !endTime) {
      setError('Elige el inicio y el fin de la ruta.')
      return
    }
    const windowStart = atTime(startDate, startTime)
    const windowEnd = atTime(endDate, endTime)
    if (windowEnd <= windowStart) {
      setError('El fin tiene que ser después del inicio.')
      return
    }
    if (orders.some((order) => order.payment_method === 'qvapay' && order.qvapay?.payment_status !== 'paid')) {
      setError('El cliente todavía no pagó este pedido por QvaPay.')
      return
    }
    if (orders.some((order) => !fees[order.id]?.pay_via || fees[order.id].fee_amount === '' || !fees[order.id]?.fee_currency)) {
      setError('Completa el pago de cada pedido.')
      return
    }
    setSaving(true)
    try {
      await assignMensajeroBatch(getSellerToken(), {
        mensajero_id: messengerId,
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
        orders: orders.map((order) => ({
          order_id: order.id,
          pay_via: fees[order.id].pay_via,
          fee_amount: Number(fees[order.id].fee_amount),
          fee_currency: fees[order.id].fee_currency,
        })),
      })
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SellerModalPortal>
      <SellerMotionSheet
        onClose={onClose}
        closing={closing}
        sheetProps={sheetProps}
        labelledBy="assign-courier-title"
        panelClassName={sellerModalSheet}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-brand-green/8 px-5 py-4">
          <h2 id="assign-courier-title" className={sellerModalTitle}>
            {step === 'list' ? 'Asignar a' : 'Confirmar asignación'}
          </h2>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-green active:bg-brand-green/8" aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {step === 'list' ? (
          <div className={sellerModalBody}>
            <ul className="space-y-2">
              {messengers.map((item) => (
                <li key={item.id}>
                  <button type="button" className="w-full rounded-2xl border border-brand-green/12 px-3 py-3 text-left" onClick={() => { setMessengerId(item.id); setStep('confirm') }}>
                    <span className="block font-semibold text-brand-carmelita">{item.first_name} {item.last_name}</span>
                    <span className="mt-1 block text-sm text-brand-carmelita/80">{(item.vehicle_types || []).map(vehicleLabel).join(', ') || 'Sin vehículo'}</span>
                  </button>
                </li>
              ))}
            </ul>
            {!messengers.length && !error ? <p className={sellerHint}>No hay mensajeros disponibles.</p> : null}
            {error ? <p className="mt-2 text-sm font-semibold text-red-700">{error}</p> : null}
          </div>
        ) : (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={confirm}>
            <div className={`${sellerModalBody} space-y-3`}>
              <SellerFilterDropdown
                label="Mensajero"
                placeholder="Elige un mensajero"
                options={messengers.map((item) => ({
                  value: item.id,
                  label: `${item.first_name} ${item.last_name} · ${(item.vehicle_types || []).map(vehicleLabel).join(', ') || 'sin vehículo'}`,
                }))}
                value={messengerId}
                onChange={setMessengerId}
              />
              <div className="space-y-2">
                <p className="text-xs font-semibold text-brand-green">Inicio</p>
                <SubscriptionDatePicker value={startDate} onChange={(next) => next && setStartDate(next)} caption="Inicio" />
                <SellerFilterDropdown label="Hora de inicio" placeholder="Hora" options={TIME_OPTIONS} value={startTime} onChange={setStartTime} />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-brand-green">Fin</p>
                <SubscriptionDatePicker value={endDate} onChange={(next) => next && setEndDate(next)} minDate={startDate || undefined} caption="Fin" />
                <SellerFilterDropdown label="Hora de fin" placeholder="Hora" options={TIME_OPTIONS} value={endTime} onChange={setEndTime} />
              </div>
              {orders.map((order) => {
                const fee = fees[order.id]
                const qvapay = canPayQvapay(order, messenger)
                return (
                  <fieldset key={order.id} className="space-y-2 rounded-2xl border border-brand-green/12 p-3">
                    <legend className="px-1 text-sm font-semibold text-brand-carmelita">#{order.id.slice(-6).toUpperCase()}</legend>
                    <SellerFilterDropdown
                      label="Pago"
                      placeholder="Elige cómo se paga"
                      options={[
                        { value: 'other', label: 'Otra moneda' },
                        ...(qvapay ? [{ value: 'qvapay', label: 'QvaPay' }] : []),
                      ]}
                      value={fee.pay_via}
                      onChange={(value) => updateFee(order.id, {
                        pay_via: value || 'other',
                        fee_currency: value === 'qvapay' ? (order.delivery_currency || fee.fee_currency) : fee.fee_currency,
                      })}
                    />
                    <input className={sellerInput} required type="number" min="0" step="0.01" placeholder="Monto" value={fee.fee_amount} onChange={(event) => updateFee(order.id, { fee_amount: event.target.value })} />
                    {fee.pay_via === 'qvapay' ? (
                      <p className="text-sm text-brand-carmelita">Moneda: {order.delivery_currency || fee.fee_currency}</p>
                    ) : (
                      <SellerFilterDropdown
                        label="Moneda"
                        placeholder="Moneda"
                        options={FEE_CURRENCIES}
                        value={fee.fee_currency}
                        onChange={(value) => { if (value) updateFee(order.id, { fee_currency: value }) }}
                      />
                    )}
                  </fieldset>
                )
              })}
              {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
            </div>
            <div className={`${sellerModalFooter} flex gap-2`}>
              <button type="button" className={sellerBtnSecondary} onClick={() => setStep('list')}>Volver</button>
              <button className={sellerBtnPrimary} type="submit" disabled={saving || !messengerId}>{saving ? 'Asignando…' : 'Confirmar'}</button>
            </div>
          </form>
        )}
      </SellerMotionSheet>
    </SellerModalPortal>
  )
}
