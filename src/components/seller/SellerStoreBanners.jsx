import { useRef, useState } from 'react'
import { sellerAlertError, sellerBtnPrimary, sellerBtnSecondary, sellerHint } from './sellerStyles'
import { deleteSellerStoreBanner, updateSellerStoreBanner, uploadSellerStoreBanner } from '../../lib/api'
import { validateImageFile, IMAGE_UPLOAD_HINT } from '../../lib/imageUpload'
import { resolveMediaUrl } from '../../lib/media'
import { getSellerToken, updateSellerProfileCache } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'

export default function SellerStoreBanners({ profile, onUpdated }) {
  const fileInputRef = useRef(null)
  const [banners, setBanners] = useState(profile?.store_banners ?? [])
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [togglingId, setTogglingId] = useState('')
  const [error, setError] = useState('')

  function applyProfile(updated) {
    setBanners(updated?.store_banners ?? [])
    updateSellerProfileCache(updated)
    onUpdated?.(updated)
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setError('')
    setUploading(true)
    try {
      const updated = await uploadSellerStoreBanner(getSellerToken(), file)
      applyProfile(updated)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos subir el banner.'))
    } finally {
      setUploading(false)
    }
  }

  async function handleToggle(banner) {
    setError('')
    setTogglingId(banner.id)
    try {
      const updated = await updateSellerStoreBanner(getSellerToken(), banner.id, banner.is_active === false)
      applyProfile(updated)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos actualizar el banner.'))
    } finally {
      setTogglingId('')
    }
  }

  async function handleDelete(bannerId) {
    setError('')
    setDeletingId(bannerId)
    try {
      const updated = await deleteSellerStoreBanner(getSellerToken(), bannerId)
      applyProfile(updated)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos quitar el banner.'))
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className={sellerHint}>
        Estas imágenes se ven detrás de la foto de tu tienda. Los desactivados no se muestran. Si hay más de uno activo, se van turnando. {IMAGE_UPLOAD_HINT}.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={`${sellerBtnPrimary} !w-auto self-start px-4`}
      >
        {uploading ? 'Subiendo…' : 'Agregar banner'}
      </button>

      {error ? (
        <p className={sellerAlertError} role="alert">
          {error}
        </p>
      ) : null}

      {banners.length ? (
        <ul className="flex flex-col gap-3">
          {banners.map((banner, index) => {
            const active = banner.is_active !== false
            return (
            <li
              key={banner.id}
              className="overflow-hidden rounded-2xl border border-brand-green/12 bg-brand-white"
            >
              <div className={`aspect-[16/9] bg-brand-green/10 ${active ? '' : 'opacity-45'}`}>
                <img
                  src={resolveMediaUrl(banner.image_url)}
                  alt={`Banner ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-3 py-2">
                <p className="text-xs font-semibold text-brand-carmelita/80">
                  Banner {index + 1}
                  {active ? '' : ' · desactivado'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(banner)}
                    disabled={togglingId === banner.id}
                    className={`${sellerBtnSecondary} !w-auto px-3 text-xs`}
                  >
                    {togglingId === banner.id ? 'Guardando…' : (active ? 'Desactivar' : 'Activar')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(banner.id)}
                    disabled={deletingId === banner.id}
                    className={`${sellerBtnSecondary} !w-auto px-3 text-xs`}
                  >
                    {deletingId === banner.id ? 'Quitando…' : 'Quitar'}
                  </button>
                </div>
              </div>
            </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-brand-carmelita/80">Todavía no tienes banners. La cabecera usa un fondo de marca hasta que subas uno.</p>
      )}
    </div>
  )
}
