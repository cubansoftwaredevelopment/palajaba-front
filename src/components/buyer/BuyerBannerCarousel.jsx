import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMarketplaceBanners } from '../../lib/api'
import { resolveMediaUrl } from '../../lib/media'

export default function BuyerBannerCarousel({ provinceId = null, initialBannerId = null }) {
  const [banners, setBanners] = useState([])
  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [loading, setLoading] = useState(true)
  const indexRef = useRef(0)
  indexRef.current = index

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchMarketplaceBanners(provinceId)
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setBanners(list)
        const focus = list.findIndex((item) => item.id === initialBannerId)
        setIndex(focus >= 0 ? focus : 0)
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
  }, [provinceId, initialBannerId])

  useEffect(() => {
    if (banners.length <= 1) return undefined
    const id = window.setInterval(() => {
      const current = indexRef.current
      if (current >= banners.length) {
        setAnimate(false)
        setIndex(0)
        return
      }
      setAnimate(true)
      setIndex(current + 1)
    }, 5000)
    return () => window.clearInterval(id)
  }, [banners.length])

  useEffect(() => {
    if (!banners.length || index <= banners.length) return undefined
    setAnimate(false)
    setIndex(0)
    return undefined
  }, [banners.length, index])

  const goTo = useCallback((next) => {
    if (banners.length <= 1) return
    const count = banners.length
    const normalized = ((next % count) + count) % count
    if (index % count === 0 && normalized === count - 1) {
      setAnimate(false)
      setIndex(count)
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setAnimate(true)
          setIndex(count - 1)
        })
      })
      return
    }
    setAnimate(true)
    setIndex(normalized)
  }, [banners.length, index])

  function handleSlideEnd(event) {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return
    if (banners.length > 1 && index >= banners.length) {
      setAnimate(false)
      setIndex(0)
    }
  }
  if (!banners.length) return null

  const slides = banners.length > 1 ? [...banners, banners[0]] : banners
  const safeIndex = Math.min(index, slides.length - 1)
  const activeDot = banners.length ? safeIndex % banners.length : 0

  return (
    <section className="group relative mb-4 overflow-hidden rounded-2xl">
      <div className="aspect-[16/9] w-full overflow-hidden">
        <div
          className={`flex h-full w-full ${animate ? 'transition-transform duration-700 ease-in-out motion-reduce:transition-none' : ''}`}
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
          onTransitionEnd={handleSlideEnd}
        >
          {slides.map((banner, slideIndex) => {
            const image = (
              <img
                src={resolveMediaUrl(banner.image_url)}
                alt={banner.title || 'Banner promocional'}
                className="h-full w-full object-cover"
                loading={slideIndex === 0 ? 'eager' : 'lazy'}
              />
            )
            return (
              <div key={`${banner.id}-${slideIndex}`} className="h-full shrink-0 basis-full">
                {banner.link_url ? (
                  <a
                    href={banner.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full w-full"
                  >
                    {image}
                  </a>
                ) : (
                  image
                )}
              </div>
            )
          })}
        </div>
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
                  itemIndex === activeDot ? 'w-6 bg-white' : 'w-2 bg-white/50'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(activeDot - 1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-white opacity-0 transition-opacity duration-200 pointer-events-none hover:bg-black/60 group-hover:pointer-events-auto group-hover:opacity-100"
            aria-label="Banner anterior"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => {
              setAnimate(true)
              setIndex((current) => (current % banners.length) + 1)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-white opacity-0 transition-opacity duration-200 pointer-events-none hover:bg-black/60 group-hover:pointer-events-auto group-hover:opacity-100"
          >
            ›
          </button>
        </>
      ) : null}
    </section>
  )
}