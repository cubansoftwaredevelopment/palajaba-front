import { useCallback, useEffect, useRef, useState } from 'react'
import { uploadSellerOrderEvidenceImage } from '../../auth/api.js'
import { getSellerToken } from '../../lib/sellerAuth'
import { isValidQvaPayEvidenceContent } from '../../lib/qvapayEvidence.js'
import { EMPTY_STORE_PAGE } from '../../lib/storePages'
import { buyerProductDetailModal, buyerProductDetailOverlay } from '../../buyer/components/buyerStyles'
import { ORDER_MODAL_EXIT_MS, orderModalMotionClass } from '../../buyer/components/useOrderModalPresence'
import SellerModalPortal from './SellerModalPortal'
import SellerRichTextEditor from './SellerRichTextEditor'

const sellerEvidenceModalOverlay = buyerProductDetailOverlay.replace('z-[85]', 'z-[220]')

function readEvidenceDraft(orderId) {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(`palajaba:evidence-draft:${orderId}`)
    const parsed = stored ? JSON.parse(stored) : null
    return parsed && isValidQvaPayEvidenceContent(parsed) ? parsed : null
  } catch {
    return null
  }
}

export default function SellerOrderEvidenceEditor({ orderId, submitting, onSubmit, reusableContent }) {
  const closeTimerRef = useRef(null)
  const draftKey = `palajaba:evidence-draft:${orderId}`
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState(() => readEvidenceDraft(orderId) || EMPTY_STORE_PAGE)
  const [hasDraft, setHasDraft] = useState(() => Boolean(readEvidenceDraft(orderId)))
  const [closing, setClosing] = useState(false)
  const motionClass = orderModalMotionClass(closing)

  const closeEditor = useCallback(() => {
    if (submitting || closing) return
    setClosing(true)
    closeTimerRef.current = window.setTimeout(() => setOpen(false), ORDER_MODAL_EXIT_MS)
  }, [closing, submitting])

  useEffect(() => {
    const draft = readEvidenceDraft(orderId)
    setContent(draft || EMPTY_STORE_PAGE)
    setHasDraft(Boolean(draft))
  }, [orderId])

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => {
      if (event.key !== 'Escape' || submitting) return
      const dialog = document.getElementById('seller-evidence-title')?.closest('[role="dialog"]')
      if (dialog?.querySelector('[role="menu"], #store-page-link')) return
      closeEditor()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [closeEditor, open, submitting])

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), [])

  const uploadImage = useCallback(async (file) => {
    return uploadSellerOrderEvidenceImage(getSellerToken(), orderId, file)
  }, [orderId])

  function rememberDraft(next) {
    setContent(next)
    try {
      if (isValidQvaPayEvidenceContent(next)) {
        window.localStorage.setItem(draftKey, JSON.stringify(next))
        setHasDraft(true)
      } else {
        window.localStorage.removeItem(draftKey)
        setHasDraft(false)
      }
    } catch {
      setHasDraft(false)
    }
  }

  async function submit() {
    if (submitting) return
    if (!isValidQvaPayEvidenceContent(content)) {
      setError('Escribe un mensaje o agrega una imagen como evidencia.')
      return
    }
    setError('')
    try {
      await onSubmit(content)
      setContent(EMPTY_STORE_PAGE)
      try { window.localStorage.removeItem(draftKey) } catch { /* el envío ya se completó */ }
      setHasDraft(false)
      setClosing(true)
      closeTimerRef.current = window.setTimeout(() => setOpen(false), ORDER_MODAL_EXIT_MS)
    } catch (cause) {
      setError(cause?.message || 'No pudimos enviar la evidencia.')
    }
  }

  function openEditor() {
    window.clearTimeout(closeTimerRef.current)
    setClosing(false)
    setError('')
    if (!hasDraft && isValidQvaPayEvidenceContent(reusableContent)) {
      setContent(reusableContent)
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(reusableContent))
        setHasDraft(true)
      } catch {
        setHasDraft(false)
      }
    }
    setOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        disabled={submitting}
        className="mt-4 min-h-11 w-full rounded-xl border border-brand-green/20 bg-brand-white px-4 font-bold text-brand-green shadow-sm transition hover:bg-brand-green/[0.04] disabled:opacity-50"
      >
        {hasDraft
          ? 'Editar borrador de evidencia'
          : isValidQvaPayEvidenceContent(reusableContent)
            ? 'Crear evidencia basada en la rechazada'
            : 'Redactar evidencia'}
      </button>
      {open ? (
        <SellerModalPortal>
          <div
            className={`${sellerEvidenceModalOverlay} ${motionClass}`}
            role="presentation"
            onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor() }}
          >
            <section
              className={`${buyerProductDetailModal} h-[min(92dvh,44rem)] sm:max-h-[min(92dvh,44rem)]`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="seller-evidence-title"
            >
              <header className="shrink-0 px-5 pt-3">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-green/15 sm:hidden" aria-hidden="true" />
                <div className="flex items-center justify-between gap-3 pb-3">
                  <div>
                    <h2 id="seller-evidence-title" className="font-display text-lg font-bold text-brand-green">
                      {hasDraft ? 'Editar borrador de evidencia' : isValidQvaPayEvidenceContent(reusableContent) ? 'Nueva evidencia' : 'Redactar evidencia'}
                    </h2>
                    {hasDraft ? <p className="mt-0.5 text-xs text-brand-carmelita/75">Borrador guardado automáticamente</p> : null}
                  </div>
                  <button type="button" onClick={closeEditor} disabled={submitting} aria-label="Cerrar editor de evidencia" className="grid h-10 w-10 place-items-center rounded-full text-brand-carmelita touch-manipulation hover:bg-brand-green/8 disabled:opacity-50">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </header>
              <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain border-t border-brand-green/10 px-5 py-4">
                <label className="text-xs font-semibold text-brand-green">Contenido</label>
                <SellerRichTextEditor
                  key={orderId}
                  content={content}
                  onChange={rememberDraft}
                  uploadImage={uploadImage}
                  placeholder="Escribe la evidencia de entrega…"
                  imageAlt="Evidencia de entrega"
                />
                {error ? <p role="alert" className="shrink-0 rounded-xl border border-brand-carmelita/20 bg-brand-carmelita/10 px-3 py-2 text-sm text-brand-carmelita">{error}</p> : null}
              </main>
              <footer className="flex shrink-0 justify-end border-t border-brand-green/10 bg-brand-white px-5 py-3 pb-[max(0.75rem,var(--safe-bottom))]">
                <button type="button" onClick={submit} disabled={submitting} className="min-h-11 w-full rounded-xl bg-brand-green px-5 font-bold text-brand-white shadow-[0_8px_20px_rgba(89,128,44,0.2)] transition hover:bg-brand-green/90 disabled:opacity-50">
                  {submitting ? 'Enviando evidencia…' : 'Enviar evidencia al cliente'}
                </button>
              </footer>
            </section>
          </div>
        </SellerModalPortal>
      ) : null}
    </>
  )
}
