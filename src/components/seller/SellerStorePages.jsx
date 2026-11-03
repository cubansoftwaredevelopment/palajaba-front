import { useCallback, useState } from 'react'
import { updateSellerStorePage, uploadSellerStorePageImage } from '../../auth/api'
import { getSellerToken, updateSellerProfileCache } from '../../lib/sellerAuth'
import { EMPTY_STORE_PAGE, STORE_PAGES } from '../../lib/storePages'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { sellerAlertError, sellerBtnPrimary, sellerHint } from './sellerStyles'
import SellerRichTextEditor from './SellerRichTextEditor'

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
      <button type="button" onClick={savePage} disabled={saving} className={sellerBtnPrimary}>
        {saving ? 'Guardando…' : `Guardar ${activePage.label}`}
      </button>
    </div>
  )
}
