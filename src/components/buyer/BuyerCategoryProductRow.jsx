import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMarketplaceCategoryProducts } from '../../lib/api'
import { animateScrollLeft } from '../../lib/smoothScroll'
import BuyerProductCard from './BuyerProductCard'
import {
  buyerCategorySectionTitle,
  buyerProductRow,
  buyerProductRowArrow,
  buyerProductRowArrowLeft,
  buyerProductRowFade,
  buyerProductRowFadeLeft,
  buyerProductRowItem,
  buyerProductRowWrap,
} from './buyerStyles'

const PAGE_SIZE = 20
const SCROLL_EDGE_THRESHOLD = 20

function getScrollStep(container) {
  const firstItem = container.querySelector('[data-product-item]')
  if (!firstItem) return Math.round(container.clientWidth * 0.72)
  const gap = Number.parseFloat(getComputedStyle(container).columnGap || getComputedStyle(container).gap || '12')
  return firstItem.offsetWidth + (Number.isFinite(gap) ? gap : 12)
}

export default function BuyerCategoryProductRow({ section, location }) {
  const scrollRef = useRef(null)
  const sentinelRef = useRef(null)
  const loadingRef = useRef(false)
  const animatingRef = useRef(false)
  const cancelScrollRef = useRef(null)

  const [products, setProducts] = useState(section.products)
  const [hasMore, setHasMore] = useState(section.has_more)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanScrollRight(el.scrollLeft < maxScroll - SCROLL_EDGE_THRESHOLD)
    setCanScrollLeft(el.scrollLeft > SCROLL_EDGE_THRESHOLD)
  }, [])

  useEffect(() => {
    setProducts(section.products)
    setHasMore(section.has_more)
    setError('')
  }, [section.category_id, section.products, section.has_more])

  useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return undefined

    el.addEventListener('scroll', updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)

    return () => {
      el.removeEventListener('scroll', updateScrollState)
      observer.disconnect()
      cancelScrollRef.current?.()
    }
  }, [products.length, updateScrollState])

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return

    loadingRef.current = true
    setLoadingMore(true)
    setError('')

    try {
      const data = await fetchMarketplaceCategoryProducts({
        provinceId: location.province.id,
        municipalityId: location.municipality.id,
        globalCategoryId: section.category_id,
        limit: PAGE_SIZE,
        offset: products.length,
      })

      setProducts((current) => {
        const seen = new Set(current.map((item) => item.id))
        const nextItems = data.products.filter((item) => !seen.has(item.id))
        return [...current, ...nextItems]
      })
      setHasMore(data.has_more)
    } catch (err) {
      setError(err.message || 'No se pudieron cargar más productos.')
    } finally {
      loadingRef.current = false
      setLoadingMore(false)
    }
  }, [hasMore, location.municipality.id, location.province.id, products.length, section.category_id])

  useEffect(() => {
    const root = scrollRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel || !hasMore) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { root, rootMargin: '120px', threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadMore, products.length])

  const animateRow = useCallback(
    (direction) => {
      const el = scrollRef.current
      if (!el || animatingRef.current) return

      const step = getScrollStep(el)
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
      const delta = direction === 'next' ? step : -step
      const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + delta))

      animatingRef.current = true
      cancelScrollRef.current?.()

      cancelScrollRef.current = animateScrollLeft(el, target, {
        onComplete: () => {
          animatingRef.current = false
          updateScrollState()

          if (direction === 'next' && el.scrollLeft >= maxScroll - SCROLL_EDGE_THRESHOLD && hasMore) {
            loadMore()
          }
        },
      })
    },
    [hasMore, loadMore, updateScrollState],
  )

  const showScrollRight = canScrollRight || hasMore
  const showScrollLeft = canScrollLeft

  return (
    <section aria-labelledby={`buyer-category-${section.category_id}`}>
      <h2 id={`buyer-category-${section.category_id}`} className={`mb-3 ${buyerCategorySectionTitle}`}>
        {section.category_name}
      </h2>

      <div className={buyerProductRowWrap}>
        <div
          ref={scrollRef}
          className={`${buyerProductRow} ${showScrollLeft ? 'lg:pl-12' : ''} ${showScrollRight ? 'pr-12' : ''}`}
        >
          {products.map((product) => (
            <div key={product.id} data-product-item className={buyerProductRowItem}>
              <BuyerProductCard product={product} compact />
            </div>
          ))}

          {hasMore ? (
            <div
              ref={sentinelRef}
              className="flex w-16 shrink-0 items-center justify-center"
              aria-hidden={!loadingMore}
            >
              {loadingMore ? (
                <span className="text-xs font-semibold text-brand-carmelita/70">…</span>
              ) : null}
            </div>
          ) : null}
        </div>

        {showScrollLeft ? (
          <>
            <div className={buyerProductRowFadeLeft} aria-hidden="true" />
            <button
              type="button"
              onClick={() => animateRow('prev')}
              className={buyerProductRowArrowLeft}
              aria-label={`Ver anteriores en ${section.category_name}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </>
        ) : null}

        {showScrollRight ? (
          <>
            <div className={buyerProductRowFade} aria-hidden="true" />
            <button
              type="button"
              onClick={() => animateRow('next')}
              className={buyerProductRowArrow}
              aria-label={`Ver más en ${section.category_name}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        ) : null}
      </div>

      {error ? (
        <div className="mt-2 flex items-center gap-3">
          <p className="text-xs text-brand-carmelita/85">{error}</p>
          <button
            type="button"
            onClick={loadMore}
            className="text-xs font-semibold text-brand-green underline-offset-2 hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : null}
    </section>
  )
}
