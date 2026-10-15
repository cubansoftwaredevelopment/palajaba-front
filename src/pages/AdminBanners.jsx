import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminButton from '../components/admin/AdminButton'
import ConfirmDialog from '../components/admin/ConfirmDialog'
import {
  adminAlertError,
  adminAlertSuccess,
  adminCard,
  adminInput,
  adminLabel,
  adminMuted,
  adminSubtle,
} from '../components/admin/adminStyles'
import {
  createAdminBanner,
  deleteAdminBanner,
  fetchAdminBanners,
  updateAdminBanner,
} from '../lib/api'
import { validateImageFile } from '../lib/imageUpload'
import { resolveMediaUrl } from '../lib/media'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import { CUBA_PROVINCES } from '../constants/cubaLocations'
import LoadingState from '../components/ui/LoadingState'

export default function AdminBanners() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [actionId, setActionId] = useState(null)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [title, setTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [selectedProvinces, setSelectedProvinces] = useState([])
  const [fileError, setFileError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const fileInputRef = useRef(null)

  const loadBanners = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const token = getAdminToken()
      const data = await fetchAdminBanners(token)
      setItems(data)
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

  function handleFileChange(event) {
    const selected = event.target.files?.[0]
    setFileError('')
    setPreview('')
    if (!selected) {
      setFile(null)
      return
    }
    const validation = validateImageFile(selected)
    if (!validation.ok) {
      setFileError(validation.message)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  async function handleUpload(event) {
    event.preventDefault()
    if (!file) {
      setFileError('Selecciona una imagen para el banner.')
      return
    }
    setUploading(true)
    setError('')
    setSuccess('')
    try {
      const token = getAdminToken()
      const created = await createAdminBanner(token, file, {
        title,
        linkUrl,
        provinceIds: selectedProvinces,
      })
      setItems((current) => [created, ...current])
      setFile(null)
      setTitle('')
      setLinkUrl('')
      setSelectedProvinces([])
      setPreview('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setSuccess('Banner subido correctamente.')
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos subir el banner.'))
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 pb-28 sm:px-6">
      <p className={`mb-5 text-sm leading-relaxed ${adminSubtle}`}>
        Sube banners promocionales que se mostrarán en la parte superior del marketplace, estilo carrusel.
      </p>

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

      <form onSubmit={handleUpload} className={`${adminCard} mb-6 space-y-4`}>
        <div>
          <label className={adminLabel} htmlFor="banner-file">
            Imagen del banner
          </label>
          <input
            id="banner-file"
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className={`${adminInput} file:mr-3 file:rounded-lg file:border-0 file:bg-brand-green/15 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-green`}
          />
          {fileError ? (
            <p className={`mt-2 text-sm ${adminMuted} text-orange-300`}>{fileError}</p>
          ) : null}
          {preview ? (
            <img
              src={preview}
              alt="Vista previa del banner"
              className="mt-3 h-32 w-full rounded-xl object-cover"
            />
          ) : null}
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
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      setSelectedProvinces((current) =>
                        event.target.checked
                          ? [...current, province.id]
                          : current.filter((id) => id !== province.id),
                      )
                    }}
                    className="h-4 w-4 accent-brand-green"
                  />
                  <span className="truncate">{province.name}</span>
                </label>
              )
            })}
          </div>
        </div>

        <AdminButton type="submit" disabled={uploading || !file}>
          {uploading ? 'Subiendo…' : 'Subir banner'}
        </AdminButton>
      </form>

      {loading ? (
        <LoadingState variant="admin" message="Cargando banners…" />
      ) : null}

      {!loading && items.length === 0 ? (
        <article className={`${adminCard} text-center`}>
          <p className="text-sm font-medium text-white">Aún no hay banners</p>
          <p className={`mt-2 text-sm ${adminSubtle}`}>
            Sube el primer banner promocional para mostrarlo en el marketplace.
          </p>
        </article>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className={adminCard}>
              <img
                src={resolveMediaUrl(item.image_url)}
                alt={item.title || 'Banner promocional'}
                className="h-32 w-full rounded-xl object-cover"
                loading="lazy"
              />
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {item.title || 'Sin título'}
                  </p>
                  {item.link_url ? (
                    <p className={`truncate text-xs ${adminMuted}`}>{item.link_url}</p>
                  ) : null}
                  <p className={`mt-1 text-xs ${adminMuted}`}>
                    {item.province_ids?.length
                      ? item.province_ids
                          .map((id) => CUBA_PROVINCES.find((province) => province.id === id)?.name || id)
                          .join(', ')
                      : 'Todas las provincias'}
                  </p>
                </div>
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
              <div className="mt-4 flex gap-2">
                <AdminButton
                  type="button"
                  variant="secondary"
                  className="min-h-9 px-3 py-1.5 text-xs"
                  disabled={actionId === item.id}
                  onClick={() => handleToggle(item)}
                >
                  {item.is_active ? 'Desactivar' : 'Activar'}
                </AdminButton>
                <AdminButton
                  type="button"
                  variant="danger"
                  className="min-h-9 px-3 py-1.5 text-xs"
                  disabled={actionId === item.id}
                  onClick={() => setDeleteTarget(item)}
                >
                  Eliminar
                </AdminButton>
              </div>
            </article>
          ))}
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