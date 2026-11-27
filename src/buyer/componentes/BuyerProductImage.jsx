import { useEffect, useRef, useState } from 'react'
import {
  buyerProductImagePlaceholder,
  buyerProductImageSpinner,
} from './buyerStyles.js'

export default function BuyerProductImage({ src, alt = '', eager = false }) {
  const imgRef = useRef(null)
  const [status, setStatus] = useState(() => (src ? 'loading' : 'empty'))
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    setAttempt(0)
  }, [src])

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
  }, [src, attempt])

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
        key={attempt}
        ref={imgRef}
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => {
          if (attempt < 1) {
            setAttempt(1)
            setStatus('loading')
            return
          }
          setStatus('error')
        }}
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
