import { useEffect, useState } from 'react'
import SellerFilterDropdown from '../../seller/componentes/SellerFilterDropdown.jsx'
import SellerModalPortal from '../../seller/componentes/SellerModalPortal.jsx'
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
import {
  buildCourierBatchPayload,
  courierAssignmentError,
  courierPayChoices,
} from '../utils/courierQvaPay.js'
import { getSellerToken } from '../../seller/utils/sellerAuth.js'

export default function AssignCourierModal({ orders, onClose: requestClose, onDone }) {
  const { dismiss: onClose, closing, sheetProps } = useSellerSheet(requestClose)
  const [messengers, setMessengers] = useState([])
  const [messengerId, setMessengerId] = useState('')
  const [step, setStep] = useState('list')
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
    const assignmentError = courierAssignmentError(orders, fees, messenger)
    if (assignmentError) {
      setError(assignmentError)
      return
    }
    setSaving(true)
    try {
      await assignMensajeroBatch(getSellerToken(), buildCourierBatchPayload(messenger.id, orders, fees))
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
              {orders.map((order) => {
                const fee = fees[order.id]
                return (
                  <fieldset key={order.id} className="space-y-2 rounded-2xl border border-brand-green/12 p-3">
                    <legend className="px-1 text-sm font-semibold text-brand-carmelita">#{order.id.slice(-6).toUpperCase()}</legend>
                    <SellerFilterDropdown
                      label="Pago"
                      placeholder="Elige cómo se paga"
                      options={courierPayChoices(order, messenger)}
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
