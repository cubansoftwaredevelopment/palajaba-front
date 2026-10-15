import { useCallback, useEffect, useState } from 'react'
import { fetchMarketplaceBanners } from '../../lib/api'
import { resolveMediaUrl } from '../../lib/media'

export default function BuyerBannerCarousel({ provinceId = null }) {
  const [banners, setBanners] = useState([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchMarketplaceBanners(provinceId)
      .then((data) => {
        if (cancelled) return
        setBanners(Array.isArray(data) ? data : [])
        setIndex(0)
      })
      .catch(() => {
        if (!cancelled) setBanners([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [provinceId])

  useEffect(() => {
    if (banners.length <= 1) return undefined
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % banners.length)
    }, 5000)
    return () => window.clearInterval(id)
  }, [banners.length])

  const goTo = useCallback((next) => {
    if (!banners.length) return
    setIndex((next + banners.length) % banners.length)
  }, [banners.length])

  if (loading) return null
  if (!banners.length) return null

  const banner = banners[index]
  const imageUrl = resolveMediaUrl(banner.image_url)
  const content = (
    <img
      src={imageUrl}
      alt={banner.title || 'Banner promocional'}
      className="h-full w-full object-cover"
      loading="eager"
    />
  )

  return (
    <section className="relative mb-4 overflow-hidden rounded-3xl bg-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="aspect-[3/1] w-full sm:aspect-[4/1] lg:aspect-[5/1]">
        {banner.link_url ? (
          <a
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block h-full w-full"
          >
            {content}
          </a>
        ) : (
          content
        )}
      </div>

      {banners.length > 1 ? (
        <>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Banner ${itemIndex + 1}`}
                onClick={() => goTo(itemIndex)}
                className={`h-2 rounded-full transition-all ${
                  itemIndex === index ? 'w-6 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-white hover:bg-black/60"
            aria-label="Banner anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-white hover:bg-black/60"
            aria-label="Banner siguiente"
          >
            ›
          </button>
        </>
      ) : null}
    </section>
  )
}