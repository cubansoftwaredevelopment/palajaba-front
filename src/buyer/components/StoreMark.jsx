import { useState } from 'react'
import { resolveMediaUrl } from '../../lib/media'

const SIZES = {
  sm: 'h-7 w-7 text-[0.55rem]',
  lg: 'h-16 w-16 text-xl',
}

export default function StoreMark({ photoUrl, storeName, size = 'sm' }) {
  const photoSrc = resolveMediaUrl(photoUrl)
  const initials = Array.from(String(storeName || '').trim()).slice(0, 2).join('').toUpperCase() || 'TJ'
  const [failedPhotoUrl, setFailedPhotoUrl] = useState('')
  const showPhoto = Boolean(photoSrc) && failedPhotoUrl !== photoSrc

  return (
    <span className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-white ring-2 ring-brand-green/15 ${SIZES[size] || SIZES.sm}`}>
      {showPhoto ? (
        <img
          src={photoSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
          onError={() => setFailedPhotoUrl(photoSrc)}
        />
      ) : (
        <span className="font-display font-bold leading-none text-brand-green" aria-hidden="true">{initials}</span>
      )}
    </span>
  )
}
