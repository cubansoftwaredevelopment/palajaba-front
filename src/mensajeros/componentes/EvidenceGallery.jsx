import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { resolveMediaUrl } from '../../shared/utils/media.js'
import { backdropFade } from '../../motion/presets'
import CourierEvidenceDownload from './CourierEvidenceDownload.jsx'

export default function EvidenceGallery({ evidence, images, note, inline = false, orderId = '' }) {
  const photos = images || evidence?.images || []
  const caption = note ?? evidence?.note ?? ''
  const [open, setOpen] = useState(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (!open) return undefined
    function onKey(event) {
      if (event.key === 'Escape') setOpen(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  if (!photos.length && !caption) return null
  const thumbs = photos.map((url) => {
    const src = url.startsWith('blob:') ? url : resolveMediaUrl(url)
    return (
      <button key={url} type="button" className={inline ? 'h-16 w-16 shrink-0 overflow-hidden rounded-xl' : 'overflow-hidden rounded-xl'} aria-label="Ver foto de la evidencia" onClick={() => setOpen(src)}>
        <img src={src} alt="" className={inline ? 'h-full w-full object-cover' : 'h-20 w-full object-cover'} />
      </button>
    )
  })
  const viewer = createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[320] flex items-center justify-center bg-brand-green/80 p-4"
          role="presentation"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reduced ? { duration: 0 } : backdropFade}
          onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(null) }}
        >
          <motion.img
            src={open}
            alt=""
            className="max-h-[85dvh] max-w-full rounded-2xl object-contain"
            initial={reduced ? false : { scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
          />
          <button type="button" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-brand-white text-brand-green" aria-label="Cerrar foto" onClick={() => setOpen(null)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
  if (inline) return <>{thumbs}{viewer}</>
  return (
    <div className="mt-2">
      {caption ? <p className="text-sm text-brand-carmelita">{caption}</p> : null}
      {photos.length ? <div className="mt-2 grid grid-cols-3 gap-2">{thumbs}</div> : null}
      {orderId ? <CourierEvidenceDownload orderId={orderId} /> : null}
      {viewer}
    </div>
  )
}
