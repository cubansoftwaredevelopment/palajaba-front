import { useCallback, useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { uploadSellerOrderEvidenceImage } from '../../auth/api.js'
import { getSellerToken } from '../../lib/sellerAuth'
import { isValidQvaPayEvidenceContent } from '../../lib/qvapayEvidence.js'
import SellerModalPortal from './SellerModalPortal'

export default function SellerOrderEvidenceEditor({ orderId, submitting, onSubmit }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const editor = useEditor({
    extensions: [StarterKit, Image.configure({ inline: false, allowBase64: false })],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: { attributes: { class: 'h-full min-h-full px-4 py-4 text-sm leading-relaxed text-slate-700 outline-none' } },
  })

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting && !uploading) setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, submitting, uploading])

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
      setOpen(false)
    } catch (cause) {
      setError(cause?.message || 'No pudimos enviar la evidencia.')
    }
  }

  if (!editor) return null
  return (
    <>
      <button
        type="button"
        onClick={() => { setError(''); setOpen(true) }}
        disabled={submitting}
        className="mt-4 min-h-11 w-full rounded-xl border border-brand-green/20 bg-brand-white px-4 font-bold text-brand-green shadow-sm transition hover:bg-brand-green/[0.04] disabled:opacity-50"
      >
        Redactar evidencia
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => uploadImage(event.target.files?.[0])} />
      {open ? (
        <SellerModalPortal>
          <div className="fixed inset-0 z-[220] flex animate-fade-in flex-col bg-white" role="dialog" aria-modal="true" aria-labelledby="seller-evidence-title">
            <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 pt-[max(0.75rem,var(--safe-top))]">
              <h2 id="seller-evidence-title" className="font-display text-lg font-bold text-brand-green">Redactar evidencia</h2>
              <button type="button" onClick={() => setOpen(false)} disabled={submitting || uploading} aria-label="Cerrar editor de evidencia" className="grid h-10 w-10 place-items-center rounded-full text-2xl text-brand-carmelita/70 hover:bg-brand-green/8 disabled:opacity-50">×</button>
            </header>
            <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-2 px-3 py-4 sm:px-5">
              <label className="text-xs font-medium text-slate-700">Contenido</label>
              <div className="flex shrink-0 flex-wrap items-center gap-1 border border-slate-200 bg-slate-100 px-2 py-1.5 text-slate-700">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Negrita" aria-pressed={editor.isActive('bold')} className="grid h-8 w-8 place-items-center rounded text-xs font-bold hover:bg-white">B</button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Cursiva" aria-pressed={editor.isActive('italic')} className="grid h-8 w-8 place-items-center rounded text-sm italic hover:bg-white">I</button>
                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Lista" aria-pressed={editor.isActive('bulletList')} className="grid h-8 w-8 place-items-center rounded text-sm hover:bg-white">•≡</button>
                <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Lista numerada" aria-pressed={editor.isActive('orderedList')} className="grid h-8 w-8 place-items-center rounded text-xs hover:bg-white">1.≡</button>
                <span className="mx-1 h-5 border-l border-slate-300" aria-hidden="true" />
                <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} aria-label="Insertar imagen" className="grid h-8 w-8 place-items-center rounded text-base hover:bg-white disabled:opacity-50">{uploading ? '…' : '▧'}</button>
                {uploading ? <span className="px-2 text-xs text-slate-500">Subiendo imagen…</span> : null}
              </div>
              <div className="relative min-h-0 flex-1 overflow-y-auto rounded-b-lg border border-slate-200 bg-white">
                <EditorContent editor={editor} />
                {editor.isEmpty ? <span className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400">Escribe la evidencia de entrega…</span> : null}
              </div>
              {error ? <p role="alert" className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
              <div className="flex shrink-0 justify-end pb-[max(0.75rem,var(--safe-bottom))]">
                <button type="button" onClick={submit} disabled={submitting || uploading} className="min-h-11 w-full rounded-lg bg-brand-green px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-green/90 disabled:opacity-50 sm:w-auto sm:min-w-48">
                  {submitting ? 'Enviando evidencia…' : 'Enviar evidencia al cliente'}
                </button>
              </div>
            </main>
          </div>
        </SellerModalPortal>
      ) : null}
    </>
  )
}
