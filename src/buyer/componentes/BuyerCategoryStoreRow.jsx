import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { animateScrollLeft } from '../../shared/utils/smoothScroll.js'
import { resolveMediaUrl } from '../../shared/utils/media.js'
import { storePublicPath } from '../../seller/utils/storeSlug.js'
import {
  buyerFeedStoreBody,
  buyerFeedStoreCard,
  buyerFeedStoreFallback,
  buyerFeedStoreImage,
  buyerFeedStoreImageWrap,
  buyerFeedStoreMeta,
  buyerFeedStoreName,
  buyerProductBtnBuy,
  buyerProductRow,
  buyerProductRowArrow,
  buyerProductRowArrowLeft,
  buyerProductRowFade,
  buyerProductRowFadeLeft,
  buyerProductRowItem,
  buyerProductRowWrap,
} from './buyerStyles.js'

const SCROLL_EDGE_THRESHOLD = 20

function productLabel(count) {
  const total = Number(count) || 0
  if (total === 1) return '1 producto'
  return `${total} productos`
}

function storesFromOffers(section) {
  const counts = new Map()
  const stores = []
  for (const product of section.products || []) {
    const store = product.store
    const key = store?.id || store?.store_slug
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
    if (stores.some((item) => (item.store.id || item.store.store_slug) === key)) continue
    stores.push({
      store,
      business_area: store.business_area || null,
      published_product_count: 0,
    })
  }
  return stores.map((item) => ({
    ...item,
    published_product_count: counts.get(item.store.id || item.store.store_slug) || 0,
  }))
}

function sectionStores(section) {
  if (section.stores?.length) return section.stores
  return storesFromOffers(section)
}

function StoreCard({ business }) {
  const store = business.store || {}
  const photoSrc = resolveMediaUrl(store.profile_photo_url)
  const initials = store.store_name?.trim().slice(0, 2).toUpperCase() || '?'
  const area = business.business_area || store.business_area
  const place = area?.municipality_name || ''

  return (
    <article className={buyerFeedStoreCard}>
      <div className={buyerFeedStoreImageWrap}>
        {photoSrc ? (
          <img src={photoSrc} alt="" className={buyerFeedStoreImage} loading="lazy" decoding="async" />
        ) : (
          <div className={buyerFeedStoreFallback} aria-hidden>{initials}</div>
        )}
      </div>
      <div className={buyerFeedStoreBody}>
        <p className={buyerFeedStoreName}>{store.store_name}</p>
        {place ? <p className={buyerFeedStoreMeta}>{place}</p> : null}
        <p className={buyerFeedStoreMeta}>{productLabel(business.published_product_count)}</p>
        <Link to={storePublicPath(store.store_slug)} className={`${buyerProductBtnBuy} mt-auto`}>
          Ver tienda
        </Link>
      </div>
    </article>
  )
}

export default function BuyerCategoryStoreRow({ section }) {
  const stores = sectionStores(section)
  const scrollRef = useRef(null)
  const animatingRef = useRef(false)
  const cancelScrollRef = useRef(null)
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
  }, [stores.length, updateScrollState])

  const animateRow = useCallback((direction) => {
    const el = scrollRef.current
    if (!el || animatingRef.current) return
    const firstItem = el.querySelector('[data-store-item]')
    const gap = Number.parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap || '12')
    const step = firstItem ? firstItem.offsetWidth + (Number.isFinite(gap) ? gap : 12) : Math.round(el.clientWidth * 0.72)
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
    const delta = direction === 'next' ? step : -step
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + delta))
    animatingRef.current = true
    cancelScrollRef.current?.()
    cancelScrollRef.current = animateScrollLeft(el, target, {
      onComplete: () => {
        animatingRef.current = false
        updateScrollState()
      },
    })
  }, [updateScrollState])

  if (!stores.length) return null

  return (
    <div className={`${buyerProductRowWrap} mt-3`} aria-label={`Tiendas de ${section.category_name}`}>
      <div
        ref={scrollRef}
        className={`${buyerProductRow} ${canScrollLeft ? 'lg:pl-12' : ''} ${canScrollRight ? 'pr-12' : ''}`}
      >
        {stores.map((business) => (
          <div key={business.store?.id || business.store?.store_slug} data-store-item className={buyerProductRowItem}>
            <StoreCard business={business} />
          </div>
        ))}
      </div>
      {canScrollLeft ? (
        <>
          <div className={`${buyerProductRowFadeLeft} hidden lg:block`} aria-hidden="true" />
          <button
            type="button"
            onClick={() => animateRow('prev')}
            className={`${buyerProductRowArrowLeft} hidden lg:flex`}
            aria-label={`Ver tiendas anteriores de ${section.category_name}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </>
      ) : null}
      {canScrollRight ? (
        <>
          <div className={`${buyerProductRowFade} hidden lg:block`} aria-hidden="true" />
          <button
            type="button"
            onClick={() => animateRow('next')}
            className={buyerProductRowArrow}
            aria-label={`Ver más tiendas de ${section.category_name}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      ) : null}
    </div>
  )
}
