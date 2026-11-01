import { useCallback, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { uploadSellerOrderEvidenceImage } from '../../auth/api.js'
import { getSellerToken } from '../../lib/sellerAuth'
import { isValidQvaPayEvidenceContent } from '../../lib/qvapayEvidence.js'

export default function SellerOrderEvidenceEditor({ orderId, submitting, onSubmit }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const editor = useEditor({
    extensions: [StarterKit, Image.configure({ inline: false, allowBase64: false })],
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    editorProps: { attributes: { class: 'min-h-32 px-3 py-2 text-sm text-brand-carmelita outline-none' } },
  })

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
    } catch (cause) {
      setError(cause?.message || 'No pudimos enviar la evidencia.')
    }
  }

  if (!editor) return null
  return (
    <section className="mt-4 rounded-2xl border border-brand-green/12 bg-brand-green/[0.025] p-3">
      <h3 className="font-bold text-brand-green">Evidencia de entrega</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} aria-pressed={editor.isActive('bold')} className="rounded-lg border border-brand-green/15 px-3 py-1.5 text-xs font-bold text-brand-green">Negrita</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} aria-pressed={editor.isActive('italic')} className="rounded-lg border border-brand-green/15 px-3 py-1.5 text-xs italic text-brand-green">Cursiva</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} aria-pressed={editor.isActive('bulletList')} className="rounded-lg border border-brand-green/15 px-3 py-1.5 text-xs font-semibold text-brand-green">Lista</button>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="rounded-lg border border-brand-green/15 px-3 py-1.5 text-xs font-semibold text-brand-green">{uploading ? 'Subiendo imagen…' : 'Insertar imagen'}</button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => uploadImage(event.target.files?.[0])} />
      </div>
      <div className="mt-2 max-h-64 min-h-36 overflow-y-auto rounded-xl border border-brand-green/15 bg-white">
        <EditorContent editor={editor} />
      </div>
      {error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}
      <button type="button" onClick={submit} disabled={submitting || uploading} className="mt-3 min-h-11 w-full rounded-xl bg-brand-green px-4 font-bold text-white disabled:opacity-50">
        {submitting ? 'Enviando evidencia…' : 'Enviar evidencia al cliente'}
      </button>
    </section>
  )
}
