import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isUnservableLegacyBannerUrl, resolveMediaUrl } from '../../lib/media'

const NO_BANNERS = []

/** 16/9 con el alto reducido un 10%. */
export const storeBannerAspectClass = 'aspect-[160/81]'

export default function BuyerStoreBannerCover({ banners = NO_BANNERS }) {
  const [index, setIndex] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [failedIds, setFailedIds] = useState(() => new Set())
  const indexRef = useRef(0)
  indexRef.current = index
  const usableBanners = useMemo(
    () =>
      banners.filter(
        (banner) =>
          banner?.image_url &&
          !isUnservableLegacyBannerUrl(banner.image_url) &&
          !failedIds.has(banner.id),
      ),
    [banners, failedIds],
  )
  const slides = usableBanners.length > 1 ? [...usableBanners, usableBanners[0]] : usableBanners

  const bannerKey = usableBanners.map((banner) => banner.id).join('|')

  useEffect(() => {
    setIndex(0)
    setAnimate(true)
  }, [bannerKey])

  useEffect(() => {
    if (usableBanners.length <= 1) return undefined
    const id = window.setInterval(() => {
      const current = indexRef.current
      if (current >= usableBanners.length) {
        setAnimate(false)
        setIndex(0)
        return
      }
      setAnimate(true)
      setIndex(current + 1)
    }, 5000)
    return () => window.clearInterval(id)
  }, [usableBanners.length])

  useEffect(() => {
    if (!usableBanners.length || index <= usableBanners.length) return undefined
    setAnimate(false)
    setIndex(0)
    return undefined
  }, [usableBanners.length, index])

  const goTo = useCallback((next) => {
    if (usableBanners.length <= 1) return
    const count = usableBanners.length
    const normalized = ((next % count) + count) % count
    setAnimate(true)
    setIndex(normalized)
  }, [usableBanners.length])

  function handleSlideEnd(event) {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return
    if (usableBanners.length > 1 && index >= usableBanners.length) {
      setAnimate(false)
      setIndex(0)
    }
  }

  if (!usableBanners.length) {
    return <div className={`relative z-0 w-full bg-brand-green ${storeBannerAspectClass}`} />
  }

  const safeIndex = Math.min(index, Math.max(slides.length - 1, 0))
  const activeDot = safeIndex % usableBanners.length

  return (
    <div className={`relative z-0 w-full overflow-hidden bg-brand-green/10 ${storeBannerAspectClass}`}>
      <div
        className={`flex h-full w-full ${animate ? 'transition-transform duration-700 ease-in-out motion-reduce:transition-none' : ''}`}
        style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        onTransitionEnd={handleSlideEnd}
      >
        {slides.map((banner, slideIndex) => (
          <div key={`${banner.id}-${slideIndex}`} className="h-full shrink-0 basis-full">
            <img
              src={resolveMediaUrl(banner.image_url)}
              alt=""
              className="h-full w-full object-cover"
              loading={slideIndex === 0 ? 'eager' : 'lazy'}
              onError={() => {
                setFailedIds((current) => {
                  if (current.has(banner.id)) return current
                  const next = new Set(current)
                  next.add(banner.id)
                  return next
                })
              }}
            />
          </div>
        ))}
      </div>
      {usableBanners.length > 1 ? (
        <div className="absolute bottom-14 right-3 flex gap-1.5 sm:bottom-16">
          {usableBanners.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Banner ${itemIndex + 1}`}
              onClick={() => goTo(itemIndex)}
              className={`h-1.5 rounded-full transition-all ${
                itemIndex === activeDot ? 'w-4 bg-white' : 'w-1.5 bg-white/55'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
