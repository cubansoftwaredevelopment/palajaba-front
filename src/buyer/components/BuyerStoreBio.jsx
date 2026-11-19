import { useEffect, useState } from 'react'
import TypeRevealText from './TypeRevealText'
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

export default function BuyerStoreBio({ biography, storeSlug }) {
  const text = biography?.trim()
  const previewLimit = useDesktopPreviewLimit()
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setExpanded(false)
  }, [storeSlug, text])

  if (!text) return null

  const isTruncated = text.length > previewLimit

  return (
    <div className="mt-4">
      <TypeRevealText
        text={text}
        limit={previewLimit}
        expanded={expanded}
        className={`${buyerStorePageBio} mt-0 whitespace-pre-wrap`}
      />
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
