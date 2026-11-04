import { useEffect, useId, useState } from 'react'
import BuyerModalPortal from './BuyerModalPortal'
import { buyerDeliveryModal, buyerDeliveryModalBody, buyerDeliveryModalFooter, buyerDeliveryModalHeader, buyerDeliveryOverlay } from './buyerStyles'
import { openExternalUrl } from '../../lib/nativeApp'

const MAX_IMAGES = 6

export default function DisputeSupportModal({ open, onClose, onSubmit, whatsappUrl }) {
  const titleId = useId()
  const inputId = useId()
  const [text, setText] = useState('')
  const [images, setImages] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    setText('')
    setImages((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.preview))
      return []
    })
    setSubmitting(false)
    setError('')
    setReady(false)
    return undefined
  }, [open])

  if (!open) return null

  function close() {
    if (submitting) return
    onClose()
  }

  function addImages(event) {
    const selected = Array.from(event.target.files || [])
    event.target.value = ''
    if (!selected.length) return
    setImages((current) => {
      const room = MAX_IMAGES - current.length
      const next = selected.slice(0, room).map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
      }))
      return [...current, ...next]
    })
    if (images.length + selected.length > MAX_IMAGES) {
      setError(`Puedes adjuntar hasta ${MAX_IMAGES} imágenes.`)
    }
  }

  function removeImage(id) {
    setImages((current) => {
      const target = current.find((item) => item.id === id)
      if (target) URL.revokeObjectURL(target.preview)
      return current.filter((item) => item.id !== id)
    })
  }

  async function submit(event) {
    event.preventDefault()
    const cleaned = text.trim()
    if (cleaned.length < 3) {
      setError('Explica el motivo con un poco más de detalle.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({ text: cleaned, files: images.map((item) => item.file) })
      setReady(true)
    } catch (cause) {
      setError(cause?.message || 'No pudimos guardar el motivo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <BuyerModalPortal>
      <button type="button" className={`${buyerDeliveryOverlay} !z-[260]`} aria-label="Cerrar motivo" onClick={close} />
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={`${buyerDeliveryModal} !z-[270]`}>
        <div className={buyerDeliveryModalHeader}>
          <h2 id={titleId} className="text-lg font-bold text-brand-green">Motivo de la disputa</h2>
        </div>
        {ready ? (
          <>
            <div className={`${buyerDeliveryModalBody} text-sm leading-relaxed text-brand-carmelita`}>
              <p>Tu motivo quedó registrado en la disputa. Si quieres, escribe ahora a soporte por WhatsApp.</p>
            </div>
            <div className={buyerDeliveryModalFooter}>
              <button
                type="button"
                className="min-h-11 rounded-xl bg-brand-green px-3 font-bold text-white"
                onClick={() => openExternalUrl(whatsappUrl)}
              >
                Escribir por WhatsApp
              </button>
              <button type="button" className="min-h-11 rounded-xl border border-brand-green/20 px-3 font-bold text-brand-green" onClick={close}>
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <div className={buyerDeliveryModalBody}>
              <p className="text-sm leading-relaxed text-brand-carmelita">Explica qué ocurrió. Puedes adjuntar fotos del pedido.</p>
              <label htmlFor={inputId} className="mt-4 block text-sm font-semibold text-brand-green">Motivo</label>
              <textarea
                id={inputId}
                value={text}
                onChange={(event) => setText(event.target.value)}
                required
                maxLength={2000}
                className="mt-1 min-h-28 w-full rounded-xl border border-brand-green/15 bg-brand-white px-3 py-2 text-sm text-brand-green outline-none focus:border-brand-green/40"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((item) => (
                  <div key={item.id} className="relative h-16 w-16">
                    <img src={item.preview} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    <button
                      type="button"
                      aria-label="Quitar imagen"
                      onClick={() => removeImage(item.id)}
                      className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-brand-green text-xs font-bold text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <label className="mt-3 inline-flex min-h-10 cursor-pointer items-center rounded-xl border border-brand-green/20 px-3 text-sm font-bold text-brand-green">
                Adjuntar imagen
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={addImages} />
              </label>
              {error ? <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
            </div>
            <div className={buyerDeliveryModalFooter}>
              <button type="submit" disabled={submitting} className="min-h-11 rounded-xl bg-brand-green px-3 font-bold text-white disabled:opacity-60">
                {submitting ? 'Guardando…' : 'Guardar motivo'}
              </button>
              <button type="button" disabled={submitting} className="min-h-11 rounded-xl border border-brand-green/20 px-3 font-bold text-brand-green disabled:opacity-60" onClick={close}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </BuyerModalPortal>
  )
}
