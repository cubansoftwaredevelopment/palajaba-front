import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { Link } from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import LoadingState from '../ui/LoadingState'
import { validateImageFile } from '../../lib/imageUpload'
import { EMPTY_STORE_PAGE, normalizeStoreLink } from '../../lib/storePages'
import ResizableImage from './resizableImage.js'

const HEADINGS = [
  { level: 0, label: 'Texto' },
  { level: 1, label: 'Título 1' },
  { level: 2, label: 'Título 2' },
  { level: 3, label: 'Título 3' },
  { level: 4, label: 'Título 4' },
]

const ALIGNS = [
  { value: 'left', label: 'Izquierda' },
  { value: 'center', label: 'Centro' },
  { value: 'right', label: 'Derecha' },
]

const TEXT_COLORS = [
  { label: 'Verde', value: '#59802c' },
  { label: 'Carmelita', value: '#7b4c38' },
  { label: 'Negro', value: '#1c1917' },
  { label: 'Rojo', value: '#b42318' },
  { label: 'Azul', value: '#1d4e89' },
  { label: 'Amarillo', value: '#f5c71a' },
]

function createEditorExtensions() {
  return [
    StarterKit.configure({
      code: false,
      codeBlock: false,
      heading: { levels: [1, 2, 3, 4] },
      horizontalRule: false,
      link: false,
    }),
    TextStyle,
    Color,
    TextAlign.configure({
      types: ['heading', 'paragraph', 'image'],
      alignments: ['left', 'center', 'right'],
      defaultAlignment: null,
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
      defaultProtocol: 'https',
      HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      isAllowedUri: (url) => Boolean(normalizeStoreLink(url)),
    }),
    ResizableImage.configure({ inline: false, allowBase64: false }),
  ]
}

function comparableDoc(node) {
  if (!node || typeof node !== 'object') return node
  const next = { ...node }
  if (next.attrs && typeof next.attrs === 'object') {
    const attrs = { ...next.attrs }
    if (attrs.textAlign == null || attrs.textAlign === 'left') delete attrs.textAlign
    if (attrs.href == null || attrs.href === '') delete attrs.href
    if (Object.keys(attrs).length) next.attrs = attrs
    else delete next.attrs
  }
  if (Array.isArray(next.content)) next.content = next.content.map(comparableDoc)
  return next
}

function sameDoc(left, right) {
  return JSON.stringify(comparableDoc(left || EMPTY_STORE_PAGE)) === JSON.stringify(comparableDoc(right || EMPTY_STORE_PAGE))
}

function AlignIcon({ align }) {
  const widths = align === 'center' ? [18, 10, 14] : [18, 12, 8]
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {widths.map((width, index) => {
        const x = align === 'right' ? 21 - width : align === 'center' ? 3 + (18 - width) / 2 : 3
        return <rect key={width + index} x={x} y={4 + index * 6} width={width} height="2" rx="1" />
      })}
    </svg>
  )
}

function useCloseOnOutside(open, onClose) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    function handlePointer(event) {
      if (!ref.current?.contains(event.target)) onClose()
    }
    function handleKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose, open])
  return ref
}

function ToolbarMenu({ open, onClose, label, pressed, onToggle, buttonClass, buttonContent, menuClass, children }) {
  const ref = useCloseOnOutside(open, onClose)
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        aria-pressed={pressed}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onToggle}
        className={buttonClass}
      >
        {buttonContent}
      </button>
      {open ? (
        <div role="menu" className={menuClass}>
          {children}
        </div>
      ) : null}
    </div>
  )
}

export default function SellerRichTextEditor({ content, onChange, uploadImage, placeholder, imageAlt = 'Imagen de la página', editable = true }) {
  const inputRef = useRef(null)
  const onChangeRef = useRef(onChange)
  const colorSelection = useRef(null)
  const linkSelection = useRef(null)
  const linkInputRef = useRef(null)
  const [linkDraft, setLinkDraft] = useState('')
  const [uploading, setUploading] = useState('')
  const [error, setError] = useState('')
  const [menu, setMenu] = useState('')
  const extensions = useMemo(() => createEditorExtensions(), [])
  const closeMenu = useCallback(() => setMenu(''), [])
  const linkBarRef = useCloseOnOutside(menu === 'link', closeMenu)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    extensions,
    editable,
    content: content || EMPTY_STORE_PAGE,
    onUpdate: ({ editor: updated }) => {
      onChangeRef.current?.(updated.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'min-h-48 px-4 py-3 text-sm leading-relaxed text-brand-green outline-none',
      },
    },
  })

  const format = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      if (!current) return { heading: 0, color: '', align: 'left', link: '' }
      let heading = 0
      for (const level of [1, 2, 3, 4]) {
        if (current.isActive('heading', { level })) heading = level
      }
      const color = current.getAttributes('textStyle').color || ''
      const align = ['center', 'right', 'left'].find((value) => current.isActive({ textAlign: value })) || 'left'
      const link = current.isActive('image')
        ? current.getAttributes('image').href || ''
        : current.getAttributes('link').href || ''
      return { heading, color, align, link }
    },
  })

  useEffect(() => {
    if (!editor) return
    const next = content || EMPTY_STORE_PAGE
    if (sameDoc(editor.getJSON(), next)) return
    editor.commands.setContent(next, { emitUpdate: false })
  }, [content, editor])

  const insertImage = useCallback(async (file) => {
    if (!file || !editor) return
    const validation = validateImageFile(file)
    if (!validation.ok) {
      setError(validation.message)
      return
    }
    setUploading('uploading')
    setError('')
    try {
      const result = await uploadImage(file)
      editor.chain().focus().setImage({ src: result.url, alt: imageAlt, width: 100 }).run()
    } catch (cause) {
      setError(cause?.message || 'No pudimos subir la imagen.')
    } finally {
      setUploading('')
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [editor, imageAlt, uploadImage])

  function toggleMenu(name) {
    if (name === 'color' && menu !== 'color' && editor) {
      const { from, to } = editor.state.selection
      colorSelection.current = { from, to }
    }
    if (name === 'link' && menu !== 'link' && editor) {
      const imageLink = editor.isActive('image')
      if (!imageLink) {
        const { from, to } = editor.state.selection
        linkSelection.current = { from, to }
      } else {
        linkSelection.current = null
      }
      const href = imageLink ? editor.getAttributes('image').href : editor.getAttributes('link').href
      setLinkDraft(href || '')
      setError('')
    }
    setMenu((current) => (current === name ? '' : name))
  }

  useEffect(() => {
    if (menu === 'link') linkInputRef.current?.focus()
  }, [menu])

  function applyLink(raw) {
    if (!editor) return
    const href = normalizeStoreLink(raw)
    if (!href) {
      setError('Escribe un enlace http, https o una ruta que empiece por /.')
      return
    }
    setError('')
    if (editor.isActive('image')) {
      editor.chain().focus().updateAttributes('image', { href }).run()
    } else {
      let chain = editor.chain().focus()
      const range = linkSelection.current
      if (range) chain = chain.setTextSelection(range)
      chain.extendMarkRange('link').setLink({ href }).run()
    }
    setMenu('')
  }

  function clearLink() {
    if (!editor) return
    if (editor.isActive('image')) {
      editor.chain().focus().updateAttributes('image', { href: null }).run()
    } else {
      let chain = editor.chain().focus()
      const range = linkSelection.current
      if (range) chain = chain.setTextSelection(range)
      chain.extendMarkRange('link').unsetLink().run()
    }
    setLinkDraft('')
    setMenu('')
  }

  function applyAlign(value) {
    if (!editor) return
    editor.chain().focus().setTextAlign(value).run()
    setMenu('')
  }

  function applyHeading(level) {
    if (!editor) return
    const chain = editor.chain().focus()
    if (level) chain.toggleHeading({ level }).run()
    else chain.setParagraph().run()
    setMenu('')
  }

  function applyColor(color) {
    if (!editor) return
    const range = colorSelection.current
    let chain = editor.chain().focus()
    if (range) chain = chain.setTextSelection(range)
    chain.setColor(color).run()
    const { from, to } = editor.state.selection
    colorSelection.current = { from, to }
  }

  function clearColor() {
    if (!editor) return
    const range = colorSelection.current
    let chain = editor.chain().focus()
    if (range) chain = chain.setTextSelection(range)
    chain.unsetColor().run()
    setMenu('')
  }

  if (!editor) return null

  const heading = format?.heading || 0
  const color = format?.color || ''
  const align = format?.align || 'left'
  const link = format?.link || ''
  const headingLabel = HEADINGS.find((item) => item.level === heading)?.label || 'Texto'
  const toolButton = 'grid h-8 w-8 place-items-center rounded-lg hover:bg-brand-white'
  const toolButtonOn = 'bg-brand-white'

  return (
    <div className="flex flex-col gap-2">
      {editable ? (
      <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => insertImage(event.target.files?.[0])}
      />
      <div ref={linkBarRef} className="relative z-20 flex shrink-0 flex-col rounded-t-xl border border-brand-green/12 bg-brand-green/[0.04] text-brand-green">
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5">
        <ToolbarMenu
          open={menu === 'heading'}
          onClose={closeMenu}
          label="Estilo de texto"
          pressed={heading > 0}
          onToggle={() => toggleMenu('heading')}
          buttonClass={`inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold hover:bg-brand-white ${heading ? toolButtonOn : ''}`}
          buttonContent={(
            <>
              <span>{headingLabel}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </>
          )}
          menuClass="absolute left-0 top-full z-30 mt-1 min-w-36 rounded-xl border border-brand-green/12 bg-white p-1 shadow-lg"
        >
          {HEADINGS.map((item) => (
            <button
              key={item.level}
              type="button"
              role="menuitem"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyHeading(item.level)}
              className={`flex w-full items-center rounded-lg px-2 py-1.5 text-left hover:bg-brand-green/8 ${item.level === heading ? 'bg-brand-green/8 font-semibold' : ''}`}
              style={{ fontSize: item.level ? `${1.05 - item.level * 0.08}rem` : '0.8rem' }}
            >
              {item.label}
            </button>
          ))}
        </ToolbarMenu>
        <ToolbarMenu
          open={menu === 'color'}
          onClose={closeMenu}
          label="Color del texto"
          pressed={Boolean(color)}
          onToggle={() => toggleMenu('color')}
          buttonClass={`${toolButton} ${color ? toolButtonOn : ''}`}
          buttonContent={(
            <span className="flex flex-col items-center leading-none">
              <span className="text-sm font-bold">A</span>
              <span className="mt-0.5 h-0.5 w-4 rounded-full" style={{ backgroundColor: color || '#59802c' }} />
            </span>
          )}
          menuClass="absolute left-0 top-full z-30 mt-1 w-48 rounded-xl border border-brand-green/12 bg-white p-2 shadow-lg"
        >
          <p className="px-1 pb-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-brand-carmelita/70">Color del texto</p>
          <div className="grid grid-cols-6 gap-1">
            {TEXT_COLORS.map((item) => (
              <button
                key={item.value}
                type="button"
                role="menuitem"
                aria-label={item.label}
                title={item.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyColor(item.value)}
                className={`h-7 w-7 rounded-full border ${color.toLowerCase() === item.value ? 'border-brand-green ring-2 ring-brand-green/30' : 'border-black/10'}`}
                style={{ backgroundColor: item.value }}
              />
            ))}
          </div>
          <label className="mt-2 flex items-center justify-between gap-2 rounded-lg px-1 py-1 text-xs font-semibold">
            Elegir color
            <input
              type="color"
              aria-label="Elegir color"
              value={/^#[0-9a-f]{6}$/i.test(color) ? color : '#59802c'}
              onChange={(event) => applyColor(event.target.value)}
              className="h-7 w-9 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
          <button
            type="button"
            role="menuitem"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearColor}
            className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold hover:bg-brand-green/8"
          >
            Quitar color
          </button>
        </ToolbarMenu>
        <ToolbarMenu
          open={menu === 'align'}
          onClose={closeMenu}
          label="Alinear contenido"
          pressed={align !== 'left'}
          onToggle={() => toggleMenu('align')}
          buttonClass={`${toolButton} ${align !== 'left' ? toolButtonOn : ''}`}
          buttonContent={<AlignIcon align={align} />}
          menuClass="absolute left-0 top-full z-30 mt-1 min-w-36 rounded-xl border border-brand-green/12 bg-white p-1 shadow-lg"
        >
          {ALIGNS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="menuitem"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyAlign(item.value)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-semibold hover:bg-brand-green/8 ${item.value === align ? 'bg-brand-green/8' : ''}`}
            >
              <AlignIcon align={item.value} />
              {item.label}
            </button>
          ))}
        </ToolbarMenu>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()} aria-label="Negrita" aria-pressed={editor.isActive('bold')} className={`${toolButton} text-xs font-bold ${editor.isActive('bold') ? toolButtonOn : ''}`}>B</button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="Cursiva" aria-pressed={editor.isActive('italic')} className={`${toolButton} text-sm italic ${editor.isActive('italic') ? toolButtonOn : ''}`}>I</button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="Lista" aria-pressed={editor.isActive('bulletList')} className={`${toolButton} text-sm ${editor.isActive('bulletList') ? toolButtonOn : ''}`}>•≡</button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Lista numerada" aria-pressed={editor.isActive('orderedList')} className={`${toolButton} text-xs ${editor.isActive('orderedList') ? toolButtonOn : ''}`}>1.≡</button>
        <button
          type="button"
          aria-label="Insertar enlace"
          aria-expanded={menu === 'link'}
          aria-pressed={Boolean(link)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => toggleMenu('link')}
          className={`${toolButton} ${link || menu === 'link' ? toolButtonOn : ''}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.07.07l2.12-2.12a5 5 0 0 0-7.07-7.07L10.5 5.5" />
            <path d="M14 11a5 5 0 0 0-7.07-.07L4.8 13.05a5 5 0 0 0 7.07 7.07L13.5 18.5" />
          </svg>
        </button>
        <span className="mx-1 h-5 border-l border-brand-green/15" aria-hidden="true" />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={Boolean(uploading)} aria-label="Insertar imagen" title="Insertar imagen" className={`${toolButton} disabled:opacity-50`}>
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
      {menu === 'link' ? (
        <form
          className="flex flex-wrap items-center gap-2 border-t border-brand-green/10 px-2 py-2"
          onSubmit={(event) => {
            event.preventDefault()
            applyLink(linkDraft)
          }}
        >
          <label className="sr-only" htmlFor="store-page-link">Enlace</label>
          <input
            id="store-page-link"
            ref={linkInputRef}
            type="text"
            inputMode="url"
            value={linkDraft}
            onChange={(event) => setLinkDraft(event.target.value)}
            placeholder="https:// o /ruta"
            className="h-8 min-w-0 flex-1 basis-36 rounded-lg border border-brand-green/15 bg-white px-2 text-xs text-brand-green outline-none focus:border-brand-green/40"
          />
          <button type="submit" className="h-8 shrink-0 rounded-lg bg-brand-green px-3 text-xs font-semibold text-white">Aplicar</button>
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={clearLink} className="h-8 shrink-0 rounded-lg px-2 text-xs font-semibold hover:bg-brand-white">Quitar</button>
        </form>
      ) : null}
      </div>
      </>
      ) : null}
      <div className={`relative min-h-48 overflow-y-auto border border-brand-green/12 bg-white ${editable ? 'rounded-b-xl border-t-0' : 'rounded-xl'}`}>
        <div className="min-h-full [&_.ProseMirror]:flow-root [&_.ProseMirror_p]:m-0 [&_.ProseMirror_.node-image_[data-node-view-wrapper]]:!m-0 [&_.ProseMirror_.node-image_img]:!block [&_.ProseMirror_.node-image_img]:!h-auto [&_.ProseMirror_.node-image_img]:!w-full [&_.ProseMirror_a]:font-semibold [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:underline-offset-2 [&_.ProseMirror_h1]:my-2 [&_.ProseMirror_h1]:font-display [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:leading-tight [&_.ProseMirror_h2]:my-2 [&_.ProseMirror_h2]:font-display [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:leading-tight [&_.ProseMirror_h3]:my-2 [&_.ProseMirror_h3]:font-display [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h4]:my-2 [&_.ProseMirror_h4]:text-base [&_.ProseMirror_h4]:font-semibold [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5">
          <EditorContent editor={editor} />
        </div>
        {editor.isEmpty ? (
          <span className="pointer-events-none absolute left-4 top-3 text-sm text-brand-carmelita/55">{placeholder}</span>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="rounded-xl border border-brand-carmelita/20 bg-brand-carmelita/10 px-3 py-2 text-sm text-brand-carmelita">{error}</p>
      ) : null}
    </div>
  )
}
