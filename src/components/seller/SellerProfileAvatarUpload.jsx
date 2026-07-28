import { resolveMediaUrl } from '../../lib/media'
import { sellerBtnSecondary, sellerFocusRing } from './sellerStyles'

const sizes = {
  compact: {
    wrap: 'h-16 w-16',
    text: 'text-[0.6rem]',
    ring: 'border border-brand-green/15',
  },
  account: {
    wrap: 'h-14 w-14 sm:h-16 sm:w-16',
    text: 'text-[0.65rem]',
    ring: 'border-2 border-brand-green/12 shadow-[0_2px_10px_rgba(89,128,44,0.12)]',
  },
  hero: {
    wrap: 'h-24 w-24 sm:h-28 sm:w-28',
    text: 'text-xs',
    ring: 'border-[3px] border-brand-white shadow-[0_4px_20px_rgba(89,128,44,0.2)]',
  },
}

export default function SellerProfileAvatarUpload({
  photoUrl,
  uploading,
  onSelectClick,
  size = 'compact',
  storeName,
}) {
  const previewSrc = resolveMediaUrl(photoUrl)
  const config = sizes[size] ?? sizes.compact
  const initials = storeName?.trim().slice(0, 2).toUpperCase() || '?'

  const avatarButton = (
    <button
      type="button"
      disabled={uploading}
      onClick={onSelectClick}
      className={`group relative shrink-0 overflow-hidden rounded-full bg-brand-yellow/12 ${config.wrap} ${config.ring} ${sellerFocusRing}`}
      aria-label={previewSrc ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}
    >
      {previewSrc ? (
        <img src={previewSrc} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className={`flex h-full w-full items-center justify-center font-display font-bold text-brand-carmelita/70 ${config.text}`}>
          {initials}
        </span>
      )}
      {size !== 'account' && (
        <span className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-brand-green/55 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="pb-2 text-[0.6rem] font-semibold text-brand-white sm:text-xs">
            {uploading ? '…' : 'Editar'}
          </span>
        </span>
      )}
    </button>
  )

  if (size === 'account') {
    return avatarButton
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {avatarButton}

      {size === 'compact' && (
        <button
          type="button"
          disabled={uploading}
          onClick={onSelectClick}
          className={sellerBtnSecondary}
        >
          {uploading ? 'Subiendo…' : previewSrc ? 'Cambiar foto' : 'Subir foto'}
        </button>
      )}

      {size === 'hero' && uploading && (
        <p className="text-center text-[0.65rem] text-brand-carmelita/75">Subiendo foto…</p>
      )}
    </div>
  )
}
