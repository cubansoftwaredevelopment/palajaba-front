import { useState } from 'react'
import { addCustomerAddress, updateCustomerAddress, deleteCustomerAddress } from '../api.js'
import { updateCustomerProfile } from '../utils/customerAuth.js'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'
import { useFormErrorToast } from '../../shared/componentes/useFormErrorToast.jsx'
import SellerLocationPreview from '../../seller/componentes/SellerLocationPreview.jsx'
import BuyerOrderLocationMap from '../../buyer/componentes/BuyerOrderLocationMap.jsx'
import { useOrderModalPresence, useSwipeDownSheet } from '../../buyer/componentes/useOrderModalPresence.js'
import BuyerMotionFrame from '../../motion/BuyerMotionFrame'
import { useSheetExitMs } from '../../motion/presets'
import { useCustomerAccount } from '../context/CustomerAccountContext.jsx'

export default function CustomerAddressesPage() {
  const { token, profile, setProfile, setError } = useCustomerAccount()
  const { showError, toastNode } = useFormErrorToast({ aboveNav: true })
  const [addressOpen, setAddressOpen] = useState(false)
  const addressExitMs = useSheetExitMs()
  const { present: addressPresent, closing: addressClosing } = useOrderModalPresence(addressOpen, addressExitMs)
  const addressSheetProps = useSwipeDownSheet(() => setAddressOpen(false), { motion: true })
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressText, setAddressText] = useState('')
  const [point, setPoint] = useState(null)
  const [savingAddress, setSavingAddress] = useState(false)

  async function saveAddress(event) {
    event.preventDefault()
    if (!point) {
      setError('Marca la ubicación de esta dirección en el mapa.')
      showError('Marca la ubicación de esta dirección en el mapa.')
      return
    }
    setSavingAddress(true)
    setError('')
    try {
      const addressPayload = {
        label: addressText.trim().slice(0, 48),
        address: addressText.trim(),
        latitude: point.lat,
        longitude: point.lng,
      }
      const next = editingAddress
        ? await updateCustomerAddress(token, editingAddress.id, addressPayload)
        : await addCustomerAddress(token, addressPayload)
      setProfile(next)
      updateCustomerProfile(next)
      setAddressOpen(false)
      setEditingAddress(null)
      setAddressText('')
      setPoint(null)
    } catch (cause) { setError(getUserFacingMessage(cause, 'No pudimos guardar la dirección.')) }
    finally { setSavingAddress(false) }
  }

  async function removeAddress(id) {
    try {
      const next = await deleteCustomerAddress(token, id)
      setProfile(next)
      updateCustomerProfile(next)
    } catch (cause) { setError(getUserFacingMessage(cause, 'No pudimos eliminar la dirección.')) }
  }

  function openNewAddress() {
    setEditingAddress(null)
    setAddressText('')
    setPoint(null)
    setAddressOpen(true)
  }

  function openEditAddress(address) {
    setEditingAddress(address)
    setAddressText(address.address || '')
    setPoint(address.latitude != null && address.longitude != null
      ? { lat: address.latitude, lng: address.longitude }
      : null)
    setAddressOpen(true)
  }

  if (!profile) return null

  return (
    <>
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Direcciones guardadas</h2>
          <button type="button" onClick={openNewAddress} aria-label="Agregar dirección" title="Agregar dirección" className="grid h-10 w-10 place-items-center rounded-full bg-brand-green text-white shadow-sm transition hover:bg-brand-carmelita focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 focus-visible:ring-offset-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        {profile.addresses?.length ? (
          <ul className="flex flex-col divide-y divide-neutral-300">
            {profile.addresses.map((address) => {
              const hasPoint = address.latitude != null && address.longitude != null
              return (
                <li key={address.id} className="relative min-h-40 overflow-hidden py-4 first:pt-0 last:pb-0">
                  {hasPoint ? (
                    <SellerLocationPreview banner location={{ lat: Number(address.latitude), lng: Number(address.longitude) }} />
                  ) : (
                    <div className="absolute inset-0 bg-brand-green/10" aria-hidden="true" />
                  )}
                  <div className="relative z-10 flex min-h-40 flex-col justify-end bg-gradient-to-t from-brand-white via-brand-white/85 to-brand-white/15 p-3">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => removeAddress(address.id)} aria-label={`Eliminar dirección ${address.label}`} title="Eliminar dirección" className="grid h-9 w-9 place-items-center rounded-full bg-brand-white/90 text-red-700 shadow-sm touch-manipulation active:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
                        </svg>
                      </button>
                      <button type="button" onClick={() => openEditAddress(address)} aria-label={`Editar dirección ${address.label}`} title="Editar dirección" className="grid h-9 w-9 place-items-center rounded-full bg-brand-white/90 text-brand-green shadow-sm touch-manipulation active:bg-brand-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m15 5 4 4M4 20l4.5-1 10.7-10.7a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-brand-carmelita">{address.address}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-brand-carmelita/70">Aún no guardas direcciones.</p>
        )}
      </section>
      {addressPresent ? (
        <BuyerMotionFrame
          closing={addressClosing}
          sheetProps={addressSheetProps}
          panelAs="section"
          overlayClassName="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-3"
          panelClassName="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-y-auto rounded-t-3xl bg-brand-white px-5 pt-5 pb-[max(1.25rem,calc(1.25rem+var(--safe-bottom)))] shadow-xl sm:rounded-3xl sm:p-6"
          overlayProps={{
            role: 'presentation',
            onMouseDown: (event) => {
              if (event.target === event.currentTarget) setAddressOpen(false)
            },
          }}
          panelProps={{ role: 'dialog', 'aria-modal': true }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{editingAddress ? 'Editar dirección' : 'Nueva dirección'}</h2>
            <button type="button" onClick={() => setAddressOpen(false)} aria-label="Cerrar" className="text-2xl">×</button>
          </div>
          <form onSubmit={saveAddress} className="mt-4 flex flex-col gap-3">
            <label className="text-sm font-semibold">
              Dirección física
              <input required maxLength={300} value={addressText} onChange={(event) => setAddressText(event.target.value)} placeholder="Calle, número, reparto…" className="mt-1 w-full rounded-xl border border-brand-green/20 px-3 py-2" />
            </label>
            <BuyerOrderLocationMap initialCoords={point} onChange={(coords) => setPoint(coords)} heightClass="h-80 sm:h-[28rem]" />
            <button disabled={savingAddress} className="min-h-11 rounded-xl bg-brand-green font-bold text-white disabled:opacity-60">
              {savingAddress ? 'Guardando…' : editingAddress ? 'Guardar cambios' : 'Guardar dirección'}
            </button>
          </form>
        </BuyerMotionFrame>
      ) : null}
      {toastNode}
    </>
  )
}
