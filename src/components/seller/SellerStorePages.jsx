import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { updateSellerStorePage, uploadSellerStorePageImage } from '../../auth/api'
import RichDocContent from '../../buyer/components/RichDocContent'
import { getSellerToken, updateSellerProfileCache } from '../../lib/sellerAuth'
import { EMPTY_STORE_PAGE, STORE_PAGES } from '../../lib/storePages'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { sellerAlertError, sellerBtnPrimary, sellerBtnSecondary, sellerHint, sellerModalBody, sellerModalOverlay, sellerModalSheet, sellerModalTitle } from './sellerStyles'
import SellerRichTextEditor from './SellerRichTextEditor'

function PagePreview({ title, content, onClose }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className={sellerModalOverlay} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-page-preview-title"
        className={`${sellerModalSheet} max-w-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-brand-green/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-brand-carmelita/70">Vista previa</p>
            <h2 id="store-page-preview-title" className={sellerModalTitle}>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar vista previa" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-brand-carmelita hover:bg-brand-green/8">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div
          className={`${sellerModalBody} bg-brand-white`}
          onClick={(event) => {
            if (event.target.closest('a')) event.preventDefault()
          }}
        >
          <article>
            <h1 className="font-display text-2xl font-bold text-brand-green">{title}</h1>
            <div className="mt-4">
              <RichDocContent content={content} />
            </div>
          </article>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function draftsFromProfile(profile) {
  const pages = profile?.store_pages || {}
  return Object.fromEntries(
    STORE_PAGES.map((page) => [page.key, pages[page.key] || EMPTY_STORE_PAGE]),
  )
}

export default function SellerStorePages({ profile, onUpdated }) {
  const [pageKey, setPageKey] = useState(STORE_PAGES[0].key)
  const [drafts, setDrafts] = useState(() => draftsFromProfile(profile))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const activePage = STORE_PAGES.find((page) => page.key === pageKey) || STORE_PAGES[0]

  const uploadImage = useCallback(async (file) => {
    return uploadSellerStorePageImage(getSellerToken(), file)
  }, [])

  function updateDraft(next) {
    setDrafts((current) => ({ ...current, [pageKey]: next }))
    setSaved(false)
  }

  async function savePage() {
    if (saving) return
    const savingKey = pageKey
    const content = drafts[savingKey] || EMPTY_STORE_PAGE
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const updated = await updateSellerStorePage(getSellerToken(), savingKey, content)
      updateSellerProfileCache(updated)
      const savedDrafts = draftsFromProfile(updated)
      setDrafts((current) => ({
        ...current,
        [savingKey]: savedDrafts[savingKey] || EMPTY_STORE_PAGE,
      }))
      onUpdated?.(updated)
      setSaved(savingKey)
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos guardar la página.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className={sellerHint}>
        Estas páginas aparecen en el pie de tu tienda cuando tienen texto o una imagen.
      </p>
      <div
        role="tablist"
        aria-label="Páginas de servicio al cliente"
        className="flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {STORE_PAGES.map((page) => {
          const selected = page.key === pageKey
          return (
            <button
              key={page.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => {
                setPageKey(page.key)
                setSaved(false)
                setError('')
                setPreviewOpen(false)
              }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold touch-manipulation ${
                selected
                  ? 'bg-brand-green text-brand-white'
                  : 'bg-brand-green/8 text-brand-green'
              }`}
            >
              {page.label}
            </button>
          )
        })}
      </div>
      <SellerRichTextEditor
        key={pageKey}
        content={drafts[pageKey] || EMPTY_STORE_PAGE}
        onChange={updateDraft}
        uploadImage={uploadImage}
        placeholder={`Escribe ${activePage.label.toLowerCase()}…`}
      />
      {error ? <p className={sellerAlertError} role="alert">{error}</p> : null}
      {saved === pageKey ? <p className="text-sm font-semibold text-brand-green">Página guardada.</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => setPreviewOpen(true)} className={sellerBtnSecondary}>
          Vista previa
        </button>
        <button type="button" onClick={savePage} disabled={saving} className={sellerBtnPrimary}>
          {saving ? 'Guardando…' : `Guardar ${activePage.label}`}
        </button>
      </div>
      {previewOpen ? (
        <PagePreview
          title={activePage.label}
          content={drafts[pageKey] || EMPTY_STORE_PAGE}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </div>
  )
}
