import { useEffect, useMemo, useState } from 'react'
import { fetchMarketplaceBusinesses, fetchMarketplaceFeed } from '../api.js'
import { useBuyerDisplayCurrency, useBuyerJaba, useDisplayedLocation } from '../context.js'
import { getAdditionalMunicipalities } from '../../lib/buyerLocation'
import BuyerBusinessCard from './BuyerBusinessCard'
import BuyerProductCard from './BuyerProductCard'
import {
  buyerCategorySectionTitle,
  buyerProductRowItem,
} from './buyerStyles'

const OFFER_LIMIT = 8
const BUSINESS_LIMIT = 8

function mixSuggestions(offers, businesses) {
  const mixed = []
  const count = Math.max(offers.length, businesses.length)
  for (let index = 0; index < count; index += 1) {
    if (offers[index]) mixed.push({ kind: 'offer', item: offers[index] })
    if (businesses[index]) mixed.push({ kind: 'business', item: businesses[index] })
  }
  return mixed
}

export default function BuyerJabaSuggestions() {
  const location = useDisplayedLocation()
  const { currencies } = useBuyerDisplayCurrency()
  const { items } = useBuyerJaba()
  const [offers, setOffers] = useState([])
  const [businesses, setBusinesses] = useState([])
  const provinceId = location?.province?.id
  const municipalityId = location?.municipality?.id
  const currencyKey = currencies.join(',')
  const inJaba = useMemo(() => new Set(items.map((item) => item.id)), [items])

  useEffect(() => {
    if (!provinceId || !municipalityId) return undefined
    let cancelled = false
    const additionalMunicipalityIds = getAdditionalMunicipalities(provinceId)
    const query = {
      provinceId,
      municipalityId,
      additionalMunicipalityIds,
      currency: currencies,
    }

    Promise.all([
      fetchMarketplaceFeed({ ...query, limitPerCategory: 4, limit: 4 }),
      fetchMarketplaceBusinesses({ ...query, limit: BUSINESS_LIMIT }),
    ])
      .then(([feed, businessPage]) => {
        if (cancelled) return
        const products = []
        const seen = new Set()
        for (const section of feed?.sections || []) {
          for (const product of section.products || []) {
            if (!product?.id || seen.has(product.id)) continue
            seen.add(product.id)
            products.push(product)
            if (products.length >= OFFER_LIMIT + 8) break
          }
          if (products.length >= OFFER_LIMIT + 8) break
        }
        setOffers(products)
        setBusinesses((businessPage?.businesses || []).slice(0, BUSINESS_LIMIT))
      })
      .catch(() => {
        if (!cancelled) {
          setOffers([])
          setBusinesses([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [provinceId, municipalityId, currencyKey])

  const visibleOffers = offers.filter((product) => !inJaba.has(product.id)).slice(0, OFFER_LIMIT)
  const suggestions = mixSuggestions(visibleOffers, businesses)
  if (!suggestions.length) return null

  return (
    <section className="mt-8 min-w-0" aria-label="Ofertas y negocios populares">
      <h2 className={`${buyerCategorySectionTitle} mb-3`}>Populares</h2>
      <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain overscroll-y-auto py-1 [touch-action:pan-x_pan-y] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
        <div className="flex w-max items-stretch gap-3">
          {suggestions.map((entry) => (
            entry.kind === 'offer' ? (
              <div key={`offer-${entry.item.id}`} className={buyerProductRowItem}>
                <BuyerProductCard product={entry.item} compact />
              </div>
            ) : (
              <div key={`business-${entry.item.store?.id || entry.item.store?.store_slug}`} className={buyerProductRowItem}>
                <BuyerBusinessCard business={entry.item} />
              </div>
            )
          ))}
        </div>
      </div>
    </section>
  )
}
