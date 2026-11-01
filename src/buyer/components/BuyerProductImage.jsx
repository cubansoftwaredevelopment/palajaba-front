import { useEffect, useRef, useState } from 'react'
import {
  buyerProductImagePlaceholder,
  buyerProductImageSpinner,
} from './buyerStyles'

export default function BuyerProductImage({ src, alt = '' }) {
  const imgRef = useRef(null)
  const [status, setStatus] = useState(() => (src ? 'loading' : 'empty'))

  useEffect(() => {
    if (!src) {
      setStatus('empty')
      return
    }

    setStatus('loading')
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) {
      setStatus('loaded')
    }
  }, [src])

  if (!src) {
    return (
      <div className={buyerProductImagePlaceholder} aria-hidden="true">
        Sin foto
      </div>
    )
  }

  return (
    <>
      {status === 'loading' ? (
        <div
          className="absolute inset-0 z-[1] flex items-center justify-center"
          aria-hidden="true"
        >
          <span className={buyerProductImageSpinner} />
        </div>
      ) : null}

      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          status === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {status === 'error' ? (
        <div className={`absolute inset-0 z-[1] ${buyerProductImagePlaceholder}`} aria-hidden="true">
          Sin foto
        </div>
      ) : null}

      {status === 'loading' ? <span className="sr-only">Cargando imagen…</span> : null}
    </>
  )
}
