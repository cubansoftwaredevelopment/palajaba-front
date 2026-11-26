import { useEffect, useRef, useState } from 'react'
import BuyerModalPortal from '../../buyer/componentes/BuyerModalPortal.jsx'
import { buyerProductDetailBody, buyerProductDetailModal, buyerProductDetailOverlay } from '../../buyer/componentes/buyerStyles.js'
import { useDismissibleModal } from '../../buyer/componentes/useOrderModalPresence.js'
import BuyerMotionFrame from '../../motion/BuyerMotionFrame'
import { useSheetExitMs } from '../../motion/presets'
import { useFormErrorToast } from '../../shared/componentes/useFormErrorToast.jsx'
import { IMAGE_TOO_LARGE_MESSAGE, prepareUploadImage } from '../../shared/utils/imageUpload.js'
import { resolveMediaUrl } from '../../shared/utils/media.js'
import SellerFilterDropdown from '../../seller/componentes/SellerFilterDropdown.jsx'
import { sellerBtnPrimary, sellerBtnSecondary, sellerInput } from '../../seller/componentes/sellerStyles.js'
import { addMensajeroVehicle, uploadMensajeroPhoto } from '../api'
import { VEHICLE_TYPES } from '../utils/constants.js'
import { updateMensajeroProfile } from '../utils/session.js'

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

export default function MensajeroOnboardingSheet({ profile, onChange, onDone }) {
  const exitMs = useSheetExitMs()
  const { dismiss, closing } = useDismissibleModal(onDone, exitMs, { motion: true })
  const [step, setStep] = useState(profile?.profile_photo_url ? 2 : 1)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [vehicleType, setVehicleType] = useState('moto')
  const [plate, setPlate] = useState('')
  const [photos, setPhotos] = useState([])
  const photosRef = useRef(photos)
  photosRef.current = photos
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { showError, toastNode } = useFormErrorToast()

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => () => {
    photosRef.current.forEach((item) => {
      if (item.file) URL.revokeObjectURL(item.preview)
    })
  }, [])

  function reportImageError(message) {
    if (message === IMAGE_TOO_LARGE_MESSAGE || String(message || '').includes('pesa demasiado')) {
      showError(IMAGE_TOO_LARGE_MESSAGE)
      return
    }
    setError(message)
  }

  async function onPhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || uploadingPhoto) return
    setError('')
    const prepared = await prepareUploadImage(file)
    if (!prepared.ok) {
      reportImageError(prepared.message)
      return
    }
    setUploadingPhoto(true)
    try {
      const next = await uploadMensajeroPhoto(prepared.file)
      updateMensajeroProfile(next)
      onChange(next)
    } catch (err) {
      reportImageError(err.message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function addPhotos(event) {
    const incoming = Array.from(event.target.files || [])
    event.target.value = ''
    if (!incoming.length) return
    const room = 5 - photos.length
    if (room <= 0) {
      setError('Puedes subir hasta 5 fotos del vehículo.')
      return
    }
    if (incoming.length > room) setError('Puedes subir hasta 5 fotos del vehículo.')
    else setError('')
    const added = []
    for (const file of incoming.slice(0, room)) {
      const prepared = await prepareUploadImage(file)
      if (!prepared.ok) {
        reportImageError(prepared.message)
        continue
      }
      added.push({
        id: `${prepared.file.name}-${prepared.file.lastModified}-${Math.random()}`,
        file: prepared.file,
        preview: URL.createObjectURL(prepared.file),
      })
    }
    if (added.length) setPhotos((current) => [...current, ...added].slice(0, 5))
  }

  function removePhoto(id) {
    setPhotos((current) => {
      const item = current.find((photo) => photo.id === id)
      if (item?.file) URL.revokeObjectURL(item.preview)
      return current.filter((photo) => photo.id !== id)
    })
  }

  async function onVehicle(event) {
    event.preventDefault()
    if (saving) return
    setError('')
    const cleanedPlate = plate.trim()
    if (!vehicleType) {
      setError('Elige un tipo de vehículo.')
      return
    }
    if (!cleanedPlate) {
      setError('Escribe la chapa del vehículo.')
      return
    }
    if (photos.length < 1) {
      setError('Sube al menos una foto del vehículo.')
      return
    }
    setSaving(true)
    try {
      const next = await addMensajeroVehicle({
        vehicleType,
        plate: cleanedPlate,
        files: photos.filter((item) => item.file).map((item) => item.file),
        keepUrls: [],
      })
      updateMensajeroProfile(next)
      onChange(next)
      dismiss()
    } catch (err) {
      reportImageError(err.message)
      setSaving(false)
    }
  }

  const photoUrl = profile?.profile_photo_url ? resolveMediaUrl(profile.profile_photo_url) : ''
  const title = step === 1 ? 'Sube tu foto' : 'Agrega tu vehículo'

  return (
    <BuyerModalPortal>
      {toastNode}
      <BuyerMotionFrame
        variant="detail"
        closing={closing}
        overlayClassName={`${buyerProductDetailOverlay} !z-[220]`}
        panelClassName={`${buyerProductDetailModal} h-[min(92dvh,44rem)]`}
        overlayProps={{ role: 'presentation' }}
        panelProps={{
          role: 'dialog',
          'aria-modal': true,
          'aria-labelledby': 'mensajero-onboarding-title',
        }}
      >
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-green/15 sm:hidden" aria-hidden="true" />
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.06em] text-brand-green">Paso {step} de 2</p>
          <h2 id="mensajero-onboarding-title" className="mt-1 font-display text-2xl font-bold text-brand-carmelita">{title}</h2>
          <p className="mt-1 text-sm text-brand-carmelita/80">
            {step === 1 ? 'Así te reconoce la tienda.' : 'Con él vas a salir a las rutas.'}
          </p>
        </div>
        <div className={`${buyerProductDetailBody} px-5 pb-4 pt-4`}>
          {step === 1 ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <label className="relative block h-28 w-28 cursor-pointer" aria-label="Subir foto de perfil">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="h-28 w-28 rounded-full object-cover" />
                ) : (
                  <span className="grid h-28 w-28 place-items-center rounded-full bg-brand-green/10 text-brand-green">
                    <CameraIcon />
                  </span>
                )}
                <span className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-brand-white bg-brand-green text-white">
                  <CameraIcon />
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} disabled={uploadingPhoto} />
              </label>
              <p className="text-center text-sm text-brand-carmelita/75">
                {uploadingPhoto ? 'Subiendo la foto…' : photoUrl ? 'Puedes cambiarla si quieres.' : 'Toca el círculo para elegir una foto.'}
              </p>
            </div>
          ) : (
            <form id="mensajero-onboarding-vehicle" className="space-y-3" onSubmit={onVehicle} aria-busy={saving}>
              <fieldset disabled={saving} className="space-y-3 border-0 p-0 disabled:opacity-70">
                <SellerFilterDropdown
                  label="Vehículo"
                  placeholder="Tipo de vehículo"
                  options={VEHICLE_TYPES.map((item) => ({ value: item.id, label: item.label }))}
                  value={vehicleType}
                  onChange={setVehicleType}
                />
                <div>
                  <p className="text-xs font-semibold text-brand-green">Chapa</p>
                  <p className="mt-0.5 text-xs text-brand-carmelita/70">Obligatoria.</p>
                  <input
                    className={`${sellerInput} mt-2`}
                    name="plate"
                    placeholder="Chapa"
                    required
                    aria-required="true"
                    value={plate}
                    onChange={(event) => setPlate(event.target.value)}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-brand-green">Fotos del vehículo</p>
                  <p className="mt-0.5 text-xs text-brand-carmelita/70">Obligatorio. De 1 a 5 fotos.</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative h-16 w-16">
                        <img src={photo.preview} alt="" className="h-16 w-16 rounded-xl object-cover" />
                        <button type="button" aria-label="Quitar foto" onClick={() => removePhoto(photo.id)} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-green text-xs font-bold text-white">×</button>
                      </div>
                    ))}
                    {photos.length < 5 ? (
                      <label className="grid h-16 w-16 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-brand-green/30 text-brand-green" aria-label="Agregar fotos del vehículo">
                        <CameraIcon />
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addPhotos} />
                      </label>
                    ) : null}
                  </div>
                </div>
              </fieldset>
              {saving ? <p role="status" className="text-sm font-semibold text-brand-carmelita">Subiendo el vehículo…</p> : null}
            </form>
          )}
          {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
        <div className="shrink-0 flex gap-2 border-t border-brand-green/10 px-5 py-3 pb-[max(0.85rem,var(--safe-bottom))]">
          {step === 2 ? (
            <button type="button" className={sellerBtnSecondary} disabled={saving} onClick={() => { setError(''); setStep(1) }}>Atrás</button>
          ) : null}
          {step === 1 ? (
            <button
              type="button"
              className={sellerBtnPrimary}
              disabled={!photoUrl || uploadingPhoto}
              onClick={() => { setError(''); setStep(2) }}
            >
              Continuar
            </button>
          ) : (
            <button type="submit" form="mensajero-onboarding-vehicle" className={sellerBtnPrimary} disabled={saving} aria-disabled={saving}>
              {saving ? 'Subiendo…' : 'Guardar vehículo'}
            </button>
          )}
        </div>
      </BuyerMotionFrame>
    </BuyerModalPortal>
  )
}
