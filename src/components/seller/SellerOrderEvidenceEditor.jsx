import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { uploadSellerOrderEvidenceImage } from '../../auth/api.js'
import { getSellerToken } from '../../lib/sellerAuth'
import { isValidQvaPayEvidenceContent } from '../../lib/qvapayEvidence.js'
import LoadingState from '../ui/LoadingState'
import { buyerProductDetailModal, buyerProductDetailOverlay } from '../../buyer/components/buyerStyles'
import { ORDER_MODAL_EXIT_MS, orderModalMotionClass } from '../../buyer/components/useOrderModalPresence'
import SellerModalPortal from './SellerModalPortal'

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
  const inputRef = useRef(null)
  const closeTimerRef = useRef(null)
  const draftKey = `palajaba:evidence-draft:${orderId}`
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [hasDraft, setHasDraft] = useState(() => Boolean(readEvidenceDraft(orderId)))
  const [closing, setClosing] = useState(false)
  const motionClass = orderModalMotionClass(closing)
  const editor = useEditor({
    extensions: [StarterKit, Image.configure({ inline: false, allowBase64: false })],
    content: readEvidenceDraft(orderId) || { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor: updatedEditor }) => {
      const content = updatedEditor.getJSON()
      try {
        if (isValidQvaPayEvidenceContent(content)) {
          window.localStorage.setItem(draftKey, JSON.stringify(content))
          setHasDraft(true)
        } else {
          window.localStorage.removeItem(draftKey)
          setHasDraft(false)
        }
      } catch {
        setHasDraft(false)
      }
    },
    editorProps: { attributes: { class: 'h-full min-h-full px-4 py-4 text-sm leading-relaxed text-brand-green outline-none' } },
  }, [orderId])

  const closeEditor = useCallback(() => {
    if (submitting || uploading || closing) return
    setClosing(true)
    closeTimerRef.current = window.setTimeout(() => setOpen(false), ORDER_MODAL_EXIT_MS)
  }, [closing, submitting, uploading])

  useEffect(() => {
    setHasDraft(Boolean(readEvidenceDraft(orderId)))
  }, [orderId])

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && previewImage) {
        setPreviewImage('')
      } else if (event.key === 'Escape' && !submitting && !uploading) {
        closeEditor()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [closeEditor, open, previewImage, submitting, uploading])

  useEffect(() => () => window.clearTimeout(closeTimerRef.current), [])

  const uploadImage = useCallback(async (file) => {
    if (!file || !editor) return
    setUploading(true); setError('')
    try {
      const result = await uploadSellerOrderEvidenceImage(getSellerToken(), orderId, file)
      editor.chain().focus().setImage({ src: result.url, alt: 'Evidencia de entrega' }).run()
    } catch (cause) { setError(cause?.message || 'No pudimos subir la imagen.') }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = '' }
  }, [editor, orderId])

  async function submit() {
    if (!editor || submitting || uploading) return
    const content = editor.getJSON()
    if (!isValidQvaPayEvidenceContent(content)) {
      setError('Escribe un mensaje o agrega una imagen como evidencia.')
      return
    }
    setError('')
    try {
      await onSubmit(content)
      editor.commands.clearContent()
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
      editor.commands.setContent(reusableContent)
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(reusableContent))
        setHasDraft(true)
      } catch {
        setHasDraft(false)
      }
    }
    setOpen(true)
  }

  if (!editor) return null
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
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => uploadImage(event.target.files?.[0])} />
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
                  <button type="button" onClick={closeEditor} disabled={submitting || uploading} aria-label="Cerrar editor de evidencia" className="grid h-10 w-10 place-items-center rounded-full text-brand-carmelita touch-manipulation hover:bg-brand-green/8 disabled:opacity-50">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </header>
              <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain border-t border-brand-green/10 px-5 py-4">
                <label className="text-xs font-semibold text-brand-green">Contenido</label>
                <div className="flex shrink-0 flex-wrap items-center gap-1 rounded-t-xl border border-brand-green/12 bg-brand-green/[0.04] px-2 py-1.5 text-brand-green">
                  <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Negrita" aria-pressed={editor.isActive('bold')} className="grid h-8 w-8 place-items-center rounded-lg text-xs font-bold hover:bg-brand-white">B</button>
                  <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Cursiva" aria-pressed={editor.isActive('italic')} className="grid h-8 w-8 place-items-center rounded-lg text-sm italic hover:bg-brand-white">I</button>
                  <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Lista" aria-pressed={editor.isActive('bulletList')} className="grid h-8 w-8 place-items-center rounded-lg text-sm hover:bg-brand-white">•≡</button>
                  <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Lista numerada" aria-pressed={editor.isActive('orderedList')} className="grid h-8 w-8 place-items-center rounded-lg text-xs hover:bg-brand-white">1.≡</button>
                  <span className="mx-1 h-5 border-l border-brand-green/15" aria-hidden="true" />
                  <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} aria-label="Insertar imagen" title="Insertar imagen" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-brand-white disabled:opacity-50">
                    {uploading ? (
                      <LoadingState message="Subiendo imagen…" variant="inline" size="xs" showMessage={false} className="!py-0 [&>img]:!h-6 [&>img]:!w-6" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <circle cx="8.5" cy="9" r="1.5" />
                        <path d="m21 15-5-5L5 20" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="relative min-h-48 flex-1 overflow-y-auto rounded-b-xl border border-t-0 border-brand-green/12 bg-white">
                  <div
                    onClick={(event) => {
                      const image = event.target instanceof HTMLImageElement ? event.target : null
                      if (image?.src) setPreviewImage(image.src)
                    }}
                    className="min-h-full [&_.ProseMirror]:min-h-48 [&_img]:my-3 [&_img]:max-h-72 [&_img]:max-w-full [&_img]:cursor-zoom-in [&_img]:rounded-lg [&_img]:object-contain"
                  >
                    <EditorContent editor={editor} />
                  </div>
                  {editor.isEmpty ? <span className="pointer-events-none absolute left-4 top-4 text-sm text-brand-carmelita/55">Escribe la evidencia de entrega…</span> : null}
                </div>
                {error ? <p role="alert" className="shrink-0 rounded-xl border border-brand-carmelita/20 bg-brand-carmelita/10 px-3 py-2 text-sm text-brand-carmelita">{error}</p> : null}
              </main>
              <footer className="flex shrink-0 justify-end border-t border-brand-green/10 bg-brand-white px-5 py-3 pb-[max(0.75rem,var(--safe-bottom))]">
                <button type="button" onClick={submit} disabled={submitting || uploading} className="min-h-11 w-full rounded-xl bg-brand-green px-5 font-bold text-brand-white shadow-[0_8px_20px_rgba(89,128,44,0.2)] transition hover:bg-brand-green/90 disabled:opacity-50">
                  {submitting ? 'Enviando evidencia…' : 'Enviar evidencia al cliente'}
                </button>
              </footer>
            </section>
          </div>
        </SellerModalPortal>
      ) : null}
      {previewImage ? (
        <SellerModalPortal>
          <div className="fixed inset-0 z-[230] flex animate-fade-in items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Vista ampliada de la imagen" onClick={() => setPreviewImage('')}>
            <button type="button" onClick={() => setPreviewImage('')} aria-label="Cerrar imagen ampliada" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-3xl text-white">×</button>
            <img src={previewImage} alt="Evidencia de entrega ampliada" className="max-h-full max-w-full rounded-lg object-contain" onClick={(event) => event.stopPropagation()} />
          </div>
        </SellerModalPortal>
      ) : null}
    </>
  )
}
