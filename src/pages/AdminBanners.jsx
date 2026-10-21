import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminButton from '../components/admin/AdminButton'
import AdminModal from '../components/admin/AdminModal'
import ConfirmDialog from '../components/admin/ConfirmDialog'
import {
  adminAlertError,
  adminAlertSuccess,
  adminCard,
  adminFocusRing,
  adminInput,
  adminLabel,
  adminMuted,
  adminSection,
  adminSubtle,
} from '../components/admin/adminStyles'
import {
  createAdminBanner,
  deleteAdminBanner,
  fetchAdminBanners,
  replaceAdminBannerImage,
  updateAdminBanner,
} from '../lib/api'
import { validateImageFile } from '../lib/imageUpload'
import { resolveMediaUrl } from '../lib/media'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import { CUBA_PROVINCES, getProvinceById } from '../constants/cubaLocations'
import Checkbox from '../components/ui/Checkbox'
import LoadingState from '../components/ui/LoadingState'

function provinceName(provinceId) {
  return CUBA_PROVINCES.find((province) => province.id === provinceId)?.name || provinceId
}

function zonesForBanner(item) {
  if (item.province_ids?.length) {
    return item.province_ids.map((id) => ({ id, name: provinceName(id) }))
  }
  return CUBA_PROVINCES.map((province) => ({ id: province.id, name: province.name }))
}

function bannerVisibleInProvince(item, provinceId) {
  if (!item.is_active || isScheduleDue(item.deactivate_at)) return false
  if (!item.province_ids?.length) return true
  return item.province_ids.includes(provinceId)
}

function toDatetimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatSchedule(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function minScheduleLocal() {
  const date = new Date()
  date.setSeconds(0, 0)
  date.setMinutes(date.getMinutes() + 1)
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function isScheduleDue(value) {
  if (!value) return false
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now()
}

function scheduledIso(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function comprarPreviewSrc(provinceId, bannerId) {
  const province = getProvinceById(provinceId)
  const municipality = province?.municipalities.find((item) => item.isCapital) ?? province?.municipalities[0]
  if (!province || !municipality) return ''
  const params = new URLSearchParams({
    vista: 'preview',
    provincia: province.id,
    municipio: municipality.id,
  })
  if (bannerId) params.set('banner', bannerId)
  return `/comprar?${params.toString()}`
}

export default function AdminBanners() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [toast, setToast] = useState('')
  const [uploading, setUploading] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [title, setTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [selectedProvinces, setSelectedProvinces] = useState([])
  const [deactivateAt, setDeactivateAt] = useState('')
  const [fileError, setFileError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [previewProvinceId, setPreviewProvinceId] = useState(CUBA_PROVINCES[0]?.id ?? '')
  const fileInputRef = useRef(null)

  const loadBanners = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const token = getAdminToken()
      const data = await fetchAdminBanners(token)
      setItems(data)
      setSelectedId((current) => current ?? data[0]?.id ?? null)
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos cargar los banners.'))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadBanners()
  }, [loadBanners])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const selected = items.find((item) => item.id === selectedId) ?? null

  function resetComposer() {
    setFile(null)
    setTitle('')
    setLinkUrl('')
    setSelectedProvinces([])
    setDeactivateAt('')
    setPreview('')
    setFileError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function closeComposer() {
    if (uploading) return
    resetComposer()
    setEditing(null)
    setComposerOpen(false)
  }

  function openCreate() {
    resetComposer()
    setEditing(null)
    setComposerOpen(true)
  }

  function openEdit(item) {
    setEditing(item)
    setFile(null)
    setTitle(item.title || '')
    setLinkUrl(item.link_url || '')
    setSelectedProvinces(item.province_ids || [])
    setDeactivateAt(toDatetimeLocal(item.deactivate_at))
    setPreview('')
    setFileError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    setComposerOpen(true)
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0]
    setFileError('')
    setPreview('')
    if (!selectedFile) {
      setFile(null)
      return
    }
    const validation = validateImageFile(selectedFile)
    if (!validation.ok) {
      setFileError(validation.message)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }

  function selectBanner(item) {
    setSelectedId(item.id)
    const zones = zonesForBanner(item)
    setPreviewProvinceId((current) => (zones.some((zone) => zone.id === current) ? current : zones[0]?.id ?? current))
  }

  async function handleUpload(event) {
    event.preventDefault()
    if (!editing && !file) {
      setFileError('Selecciona una imagen para el banner.')
      return
    }
    if (deactivateAt && !scheduledIso(deactivateAt)) {
      setFileError('La fecha de inactivación no es válida.')
      return
    }
    if (deactivateAt && new Date(deactivateAt).getTime() <= Date.now()) {
      setFileError('La fecha de expiración debe ser mayor que la actual.')
      return
    }
    setUploading(true)
    setError('')
    setSuccess('')
    try {
      const token = getAdminToken()
      const schedule = scheduledIso(deactivateAt)
      if (editing) {
        let updated = await updateAdminBanner(token, editing.id, {
          title,
          link_url: linkUrl,
          province_ids: selectedProvinces,
          deactivate_at: schedule,
        })
        if (file) {
          updated = await replaceAdminBannerImage(token, editing.id, file)
        }
        setItems((current) => current.map((row) => (row.id === updated.id ? updated : row)))
        setSelectedId(updated.id)
        setSuccess('Banner actualizado.')
      } else {
      const created = await createAdminBanner(token, file, {
        title,
        linkUrl,
        provinceIds: selectedProvinces,
          deactivateAt: schedule || '',
      })
      setItems((current) => [created, ...current])
        setSelectedId(created.id)
        const zones = zonesForBanner(created)
        if (zones[0]) setPreviewProvinceId(zones[0].id)
        setToast('Banner agregado.')
      }
      resetComposer()
      setEditing(null)
      setComposerOpen(false)
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, editing ? 'No pudimos guardar el banner.' : 'No pudimos subir el banner.'))
    } finally {
      setUploading(false)
    }
  }

  async function handleToggle(item) {
    setActionId(item.id)
    setError('')
    setSuccess('')
    try {
      const token = getAdminToken()
      const updated = await updateAdminBanner(token, item.id, { is_active: !item.is_active })
      setItems((current) => current.map((row) => (row.id === updated.id ? updated : row)))
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos actualizar el banner.'))
    } finally {
      setActionId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setActionId(deleteTarget.id)
    setError('')
    setSuccess('')
    try {
      const token = getAdminToken()
      await deleteAdminBanner(token, deleteTarget.id)
      setItems((current) => current.filter((row) => row.id !== deleteTarget.id))
      setSelectedId((current) => (current === deleteTarget.id ? null : current))
      setDeleteTarget(null)
      setSuccess('Banner eliminado.')
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos eliminar el banner.'))
    } finally {
      setActionId(null)
    }
  }

  const previewUrl = comprarPreviewSrc(
    previewProvinceId,
    selected && bannerVisibleInProvince(selected, previewProvinceId) ? selected.id : '',
  )

  return (
    <div className={adminSection}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className={`max-w-2xl text-sm leading-relaxed ${adminSubtle}`}>
          Los banners se muestran en la parte superior del marketplace, como un carrusel, según la zona del comprador.
        </p>
        <AdminButton type="button" className="!w-auto shrink-0 px-5" onClick={openCreate}>
          Agregar banner
        </AdminButton>
      </div>

      {success ? (
        <p className={`mb-4 ${adminAlertSuccess}`} role="status">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className={`mb-4 ${adminAlertError}`} role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <LoadingState variant="admin" message="Cargando banners…" /> : null}

      {!loading ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="flex min-w-0 flex-wrap content-start gap-3">
            {items.length === 0 ? (
              <article className={`${adminCard} w-full text-center`}>
                <p className="text-sm font-medium text-white">Aún no hay banners</p>
                <p className={`mt-2 text-sm ${adminSubtle}`}>
                  Agrega el primer banner promocional para mostrarlo en el marketplace.
                </p>
              </article>
            ) : (
              items.map((item) => {
                const activeCard = item.id === selectedId
                return (
                  <article
                    key={item.id}
                    className={`w-full min-w-[16rem] max-w-xs flex-1 cursor-pointer rounded-2xl border p-3 shadow-[0_8px_30px_rgba(0,0,0,0.22)] ${
                      activeCard
                        ? 'border-brand-green/50 bg-brand-green/10'
                        : 'border-brand-green/10 bg-zinc-900/45'
                    }`}
                    onClick={() => selectBanner(item)}
                  >
                    <img
                      src={resolveMediaUrl(item.image_url)}
                      alt={item.title || 'Banner promocional'}
                      className="h-24 w-full rounded-xl object-cover"
                    />
                    <div className="mt-2 flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-medium text-zinc-50">
                        {item.title || 'Sin título'}
                      </p>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[0.65rem] font-semibold uppercase ${
                          item.is_active
                            ? 'border border-brand-green/35 bg-brand-green/15 text-emerald-200'
                            : 'border border-zinc-700 bg-zinc-900/70 text-zinc-400'
                        }`}
                      >
                        {item.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {zonesForBanner(item).map((zone) => {
                        const zoneActive = activeCard && previewProvinceId === zone.id
                        return (
                          <button
                            key={zone.id}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedId(item.id)
                              setPreviewProvinceId(zone.id)
                            }}
                            className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${adminFocusRing} ${
                              zoneActive
                                ? 'border-brand-green bg-brand-green text-brand-white'
                                : 'border-brand-green/40 bg-brand-green/10 text-brand-green'
                            }`}
                          >
                            {zone.name}
                          </button>
                        )
                      })}
                    </div>
                    {item.deactivate_at ? (
                      <p className={`mt-2 text-[0.7rem] leading-snug ${adminMuted}`}>
                        {item.is_active && !isScheduleDue(item.deactivate_at)
                          ? `Se inactiva el ${formatSchedule(item.deactivate_at)}`
                          : `Programado para el ${formatSchedule(item.deactivate_at)}`}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <AdminButton
                        type="button"
                        variant="secondary"
                        className="min-h-9 px-3 py-1.5 text-xs"
                        disabled={actionId === item.id}
                        onClick={(event) => {
                          event.stopPropagation()
                          openEdit(item)
                        }}
                      >
                        Editar
                      </AdminButton>
                      <AdminButton
                        type="button"
                        variant="secondary"
                        className="min-h-9 px-3 py-1.5 text-xs"
                        disabled={actionId === item.id}
                        onClick={(event) => {
                          event.stopPropagation()
                          handleToggle(item)
                        }}
                      >
                        {item.is_active ? 'Desactivar' : 'Activar'}
                      </AdminButton>
                      <AdminButton
                        type="button"
                        variant="danger"
                        className="min-h-9 px-3 py-1.5 text-xs"
                        disabled={actionId === item.id}
                        onClick={(event) => {
                          event.stopPropagation()
                          setDeleteTarget(item)
                        }}
                      >
                        Eliminar
                      </AdminButton>
                    </div>
                  </article>
                )
              })
            )}
          </div>

          <div className="flex min-w-0 justify-center lg:sticky lg:top-28">
            <div className="w-full max-w-[24.375rem]">
            <iframe
              key={previewUrl}
              title={`Vista de comprar en ${provinceName(previewProvinceId)}`}
              src={previewUrl}
              className="h-[min(52.75rem,calc(100dvh-9rem))] w-full rounded-[2rem] border-[0.7rem] border-[#1c2118] bg-brand-white shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
            />
            {selected && !bannerVisibleInProvince(selected, previewProvinceId) ? (
              <p className={`mt-3 text-xs leading-relaxed ${adminMuted}`}>
                {selected.title || 'Este banner'} no aparece en {provinceName(previewProvinceId)}
                {selected.is_active ? ' porque no está asignado a esa zona.' : ' porque está inactivo.'}
              </p>
            ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {composerOpen ? (
        <AdminModal
          title={editing ? 'Editar banner' : 'Agregar banner'}
          subtitle="Se mostrará en el carrusel del marketplace de las zonas que elijas."
          onClose={closeComposer}
          panelClassName="max-w-2xl"
        >
          <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className={adminLabel} htmlFor="banner-file">
                {editing ? 'Imagen (opcional)' : 'Imagen del banner'}
          </label>
          <input
            id="banner-file"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className={`${adminInput} file:mr-3 file:rounded-lg file:border-0 file:bg-brand-green/15 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-green`}
          />
              {fileError ? <p className="mt-2 text-sm text-orange-300">{fileError}</p> : null}
              {preview || editing?.image_url ? (
                <img
                  src={preview || resolveMediaUrl(editing.image_url)}
              alt="Vista previa del banner"
              className="mt-3 h-32 w-full rounded-xl object-cover"
            />
          ) : null}
        </div>
            <div>
              <label className={adminLabel} htmlFor="banner-deactivate">
                Inactivar automáticamente
              </label>
              <input
                id="banner-deactivate"
                type="datetime-local"
                min={minScheduleLocal()}
                value={deactivateAt}
                onChange={(event) => setDeactivateAt(event.target.value)}
                className={adminInput}
              />
              <p className={`mt-2 text-xs ${adminMuted}`}>
                El banner queda activo y se apaga solo en esa fecha. Tiene que ser posterior a la hora actual. Si la dejas vacía, sigue hasta que lo desactives a mano.
              </p>
            </div>
        <div>
          <label className={adminLabel} htmlFor="banner-title">
            Título (opcional)
          </label>
          <input
            id="banner-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ej. ¡Ofertas de temporada!"
            className={adminInput}
          />
        </div>
        <div>
          <label className={adminLabel} htmlFor="banner-link">
            Enlace al tocar (opcional)
          </label>
          <input
            id="banner-link"
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://..."
            className={adminInput}
          />
        </div>
        <div>
          <label className={adminLabel}>Mostrar en provincias</label>
          <p className={`mb-2 text-xs ${adminMuted}`}>
            Si no seleccionas ninguna, el banner se mostrará en todas las provincias.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CUBA_PROVINCES.map((province) => {
              const checked = selectedProvinces.includes(province.id)
              return (
                <label
                  key={province.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-800/90 bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200"
                >
                  <Checkbox
                    tone="admin"
                    checked={checked}
                    onChange={(event) => {
                      setSelectedProvinces((current) =>
                        event.target.checked
                          ? [...current, province.id]
                          : current.filter((id) => id !== province.id),
                      )
                    }}
                  />
                  <span className="truncate">{province.name}</span>
                </label>
              )
            })}
          </div>
        </div>
            <AdminButton type="submit" disabled={uploading || (!editing && !file)}>
              {uploading ? 'Guardando…' : editing ? 'Guardar cambios' : 'Subir banner'}
        </AdminButton>
      </form>
        </AdminModal>
      ) : null}

      {toast ? (
        <div
          className="admin-theme fixed bottom-[max(1.5rem,var(--safe-bottom))] left-1/2 z-50 flex max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl border border-brand-green/30 bg-zinc-900/95 px-4 py-3 text-sm font-medium text-zinc-100 shadow-xl animate-jaba-toast-in"
          role="status"
        >
          <span className="flex-1">{toast}</span>
          <button
                  type="button"
            onClick={() => setToast('')}
            className="text-zinc-500 hover:text-white"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          title="Eliminar banner"
          subtitle={deleteTarget.title || 'Banner promocional'}
          confirmLabel="Eliminar"
          confirmVariant="danger"
          loading={actionId === deleteTarget.id}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        >
          <p className={`text-sm ${adminSubtle}`}>
            El banner dejará de mostrarse en el marketplace. Esta acción no se puede deshacer.
          </p>
        </ConfirmDialog>
      ) : null}
    </div>
  )
}
