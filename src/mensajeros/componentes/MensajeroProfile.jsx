import { useState } from 'react'
import ConfirmModal from '../../shared/componentes/ConfirmModal.jsx'
import SellerFilterDropdown from '../../seller/componentes/SellerFilterDropdown.jsx'
import { sellerBtnPrimary, sellerBtnSecondary, sellerInput } from '../../seller/componentes/sellerStyles.js'
import { addMensajeroVehicle, deleteMensajeroVehicle, updateMensajeroVehicle, uploadMensajeroPhoto } from '../api'
import MensajeroQvaPaySettings from './MensajeroQvaPaySettings.jsx'
import { resolveMediaUrl } from '../../shared/utils/media.js'
import { VEHICLE_TYPES, vehicleLabel } from '../utils/constants.js'
import { updateMensajeroProfile } from '../utils/session.js'

function savedVehiclePhotos(vehicle) {
  const urls = (vehicle.photo_urls || []).filter(Boolean)
  if (urls.length) return urls
  return vehicle.photo_url ? [vehicle.photo_url] : []
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

export default function MensajeroProfile({ profile, onChange }) {
  const [vehicleType, setVehicleType] = useState('moto')
  const [plate, setPlate] = useState('')
  const [photos, setPhotos] = useState([])
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [photoKey, setPhotoKey] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function onPhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    try {
      const next = await uploadMensajeroPhoto(file)
      updateMensajeroProfile(next)
      onChange(next)
    } catch (err) {
      setError(err.message)
    }
  }

  async function onVehicle(event) {
    event.preventDefault()
    setError('')
    if (!vehicleType) {
      setError('Elige un tipo de vehículo.')
      return
    }
    if (photos.length < 1) {
      setError('Sube al menos una foto del vehículo.')
      return
    }
    if (photos.length > 5) {
      setError('Puedes subir hasta 5 fotos del vehículo.')
      return
    }
    try {
      const payload = {
        vehicleType,
        plate,
        files: photos.filter((item) => item.file).map((item) => item.file),
        keepUrls: photos.filter((item) => item.url).map((item) => item.url),
      }
      const next = editing
        ? await updateMensajeroVehicle(editing.id, payload)
        : await addMensajeroVehicle(payload)
      updateMensajeroProfile(next)
      onChange(next)
      setEditing(null)
      setVehicleType('moto')
      setPlate('')
      clearPhotos()
      setMessage(editing ? 'Vehículo actualizado.' : 'Vehículo guardado.')
    } catch (err) {
      setError(err.message)
    }
  }

  function clearPhotos(next = []) {
    setPhotos((current) => {
      current.forEach((item) => {
        if (item.file) URL.revokeObjectURL(item.preview)
      })
      return next
    })
    setPhotoKey((value) => value + 1)
  }

  function addPhotos(event) {
    const incoming = Array.from(event.target.files || [])
    event.target.value = ''
    if (!incoming.length) return
    setPhotos((current) => {
      const room = 5 - current.length
      if (room <= 0) {
        setError('Puedes subir hasta 5 fotos del vehículo.')
        return current
      }
      if (incoming.length > room) setError('Puedes subir hasta 5 fotos del vehículo.')
      else setError('')
      const added = incoming.slice(0, room).map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      }))
      return [...current, ...added]
    })
  }

  function removePhoto(id) {
    setPhotos((current) => {
      const item = current.find((photo) => photo.id === id)
      if (item?.file) URL.revokeObjectURL(item.preview)
      return current.filter((photo) => photo.id !== id)
    })
  }

  function startEdit(vehicle) {
    setEditing(vehicle)
    setVehicleType(vehicle.vehicle_type || 'moto')
    setPlate(vehicle.plate || '')
    clearPhotos(savedVehiclePhotos(vehicle).map((url) => ({
      id: url,
      url,
      preview: resolveMediaUrl(url),
    })))
    setError('')
    setMessage('')
  }

  function cancelEdit() {
    setEditing(null)
    setVehicleType('moto')
    setPlate('')
    clearPhotos()
  }

  async function confirmDelete() {
    if (!toDelete) return
    setError('')
    try {
      const next = await deleteMensajeroVehicle(toDelete.id)
      updateMensajeroProfile(next)
      onChange(next)
      if (editing?.id === toDelete.id) cancelEdit()
      setToDelete(null)
      setMessage('Vehículo eliminado.')
    } catch (err) {
      setToDelete(null)
      setError(err.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="group relative z-10 block h-16 w-16 shrink-0 cursor-pointer" aria-label="Cambiar foto de perfil">
          {profile.profile_photo_url ? <img src={resolveMediaUrl(profile.profile_photo_url)} alt="" className="h-16 w-16 rounded-full object-cover" /> : <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-green/10 font-display text-xl font-bold text-brand-carmelita">{profile.first_name?.[0]}</span>}
          <span className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full border-2 border-brand-white bg-brand-green text-white">
            <CameraIcon />
          </span>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
        </label>
        <p className="min-w-0 font-display text-2xl font-bold leading-tight text-brand-carmelita">{[profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username}</p>
      </div>
      <form className="space-y-2 rounded-2xl border border-brand-green/12 bg-brand-white p-3" onSubmit={onVehicle}>
        <SellerFilterDropdown
          label="Vehículo"
          placeholder="Tipo de vehículo"
          options={VEHICLE_TYPES.map((item) => ({ value: item.id, label: item.label }))}
          value={vehicleType}
          onChange={setVehicleType}
        />
        <input className={sellerInput} name="plate" placeholder="Matrícula" value={plate} onChange={(event) => setPlate(event.target.value)} />
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
                <input key={photoKey} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addPhotos} />
              </label>
            ) : null}
          </div>
        </div>
        <div className="flex gap-2">
          <button className={sellerBtnPrimary} type="submit">{editing ? 'Guardar' : 'Agregar vehículo'}</button>
          {editing ? <button className={sellerBtnSecondary} type="button" onClick={cancelEdit}>Cancelar</button> : null}
        </div>
        <ul className="space-y-2 text-sm text-brand-carmelita">
          {(profile.vehicles || []).map((vehicle) => (
            <li key={vehicle.id} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                {savedVehiclePhotos(vehicle)[0] ? <img src={resolveMediaUrl(savedVehiclePhotos(vehicle)[0])} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : null}
                <span className="min-w-0 truncate">{vehicleLabel(vehicle.vehicle_type)} · {vehicle.plate || 'sin matrícula'}</span>
              </span>
              <span className="flex shrink-0 gap-1">
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-green touch-manipulation active:bg-brand-green/10" aria-label={`Editar ${vehicleLabel(vehicle.vehicle_type)}`} onClick={() => startEdit(vehicle)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                </button>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-carmelita/70 touch-manipulation active:bg-brand-carmelita/10" aria-label={`Eliminar ${vehicleLabel(vehicle.vehicle_type)}`} onClick={() => setToDelete(vehicle)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                </button>
              </span>
            </li>
          ))}
        </ul>
      </form>
      {toDelete ? (
        <ConfirmModal
          title={`¿Eliminar ${vehicleLabel(toDelete.vehicle_type)}?`}
          description="Deja de estar disponible para las próximas rutas."
          confirmLabel="Sí, eliminar"
          confirmVariant="tertiary"
          onClose={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
      <MensajeroQvaPaySettings profile={profile} onChange={onChange} />
      {message ? <p className="text-sm font-semibold text-brand-green">{message}</p> : null}
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
    </div>
  )
}
