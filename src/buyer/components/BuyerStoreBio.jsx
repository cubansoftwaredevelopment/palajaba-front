import { useEffect, useState } from 'react'
import { buyerStorePageBio, buyerStorePageBioLink } from './buyerStyles'

const BIO_PREVIEW_MOBILE = 100
const BIO_PREVIEW_DESKTOP = 200
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)'

function useDesktopPreviewLimit() {
  const [limit, setLimit] = useState(() => {
    if (typeof window === 'undefined') return BIO_PREVIEW_MOBILE
    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches
      ? BIO_PREVIEW_DESKTOP
      : BIO_PREVIEW_MOBILE
  })

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY)
    const syncLimit = () => {
      setLimit(media.matches ? BIO_PREVIEW_DESKTOP : BIO_PREVIEW_MOBILE)
    }

    syncLimit()
    media.addEventListener('change', syncLimit)
    return () => media.removeEventListener('change', syncLimit)
  }, [])

  return limit
}

function buildBiographyPreview(biography, limit, expanded) {
  if (expanded || biography.length <= limit) {
    return biography
  }

  return `${biography.slice(0, limit).trimEnd()}…`
}

export default function BuyerStoreBio({ biography, storeSlug }) {
  const text = biography?.trim()
  const previewLimit = useDesktopPreviewLimit()
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setExpanded(false)
  }, [storeSlug, text])

  if (!text) return null

  const isTruncated = text.length > previewLimit
  const preview = buildBiographyPreview(text, previewLimit, expanded)

  return (
    <div className="mt-4">
      <p className={`${buyerStorePageBio} mt-0 whitespace-pre-wrap`}>{preview}</p>
      {isTruncated ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className={buyerStorePageBioLink}
        >
          {expanded ? 'Ver menos' : 'Leer más'}
        </button>
      ) : null}
    </div>
  )
}
