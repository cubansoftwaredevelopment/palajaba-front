import { useEffect, useState } from 'react'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import BuyerMarketplaceNav from './BuyerMarketplaceNav'
import BuyerShell from './BuyerShell'
import LoadingState from '../ui/LoadingState'
import { MARKETPLACE_LABEL } from '../../constants/branding'
import { fetchMarketplaceStoreCatalog } from '../../lib/api'
import { useBuyerDisplayCurrency } from '../../context/BuyerDisplayCurrencyContext'
import { resolveMarketplaceCategory } from '../../lib/marketplaceCategory'
import { isReservedStoreSlug } from '../../lib/storeSlug'
import BuyerStoreCategoryPage from '../../pages/buyer/BuyerStoreCategoryPage'
import BuyerStorePage from '../../pages/buyer/BuyerStorePage'
import { usePublicStoreLocation } from '../../pages/buyer/usePublicStoreLocation'

export default function PublicStoreRoute() {
  const { storeSlug, gestorUsername, categorySlug } = useParams()

  if (isReservedStoreSlug(storeSlug)) {
    return <Navigate to="/" replace />
  }

  if (categorySlug) {
    return <BuyerStoreCategoryPage categorySlug={categorySlug} gestorUsername={gestorUsername} />
  }

  if (gestorUsername) {
    return <StoreSecondSegment storeSlug={storeSlug} segment={gestorUsername} />
  }

  return <BuyerStorePage />
}

function StoreSecondSegment({ storeSlug, segment }) {
  const navigation = useLocation()
  const hinted = navigation.state
  const { currencies } = useBuyerDisplayCurrency()
  const { location, resolvingLocation, locationError } = usePublicStoreLocation(storeSlug)
  const [kind, setKind] = useState(() => {
    if (hinted?.categoryId || hinted?.kind === 'category') return 'category'
    if (hinted?.kind === 'gestor') return 'gestor'
    return 'pending'
  })

  useEffect(() => {
    if (hinted?.categoryId || hinted?.kind === 'category') {
      setKind('category')
      return
    }
    if (hinted?.kind === 'gestor') {
      setKind('gestor')
      return
    }
    setKind('pending')
  }, [hinted?.categoryId, hinted?.kind, segment])

  useEffect(() => {
    if (kind !== 'pending' || !location) return undefined

    let cancelled = false
    fetchMarketplaceStoreCatalog({
      storeSlug,
      provinceId: location.province.id,
      municipalityId: location.municipality.id,
      currency: currencies,
      limitPerCategory: 1,
    })
      .then((data) => {
        if (cancelled) return
        const sections = (data?.sections ?? []).map((section) => ({
          id: section.category_id,
          name: section.category_name,
        }))
        setKind(resolveMarketplaceCategory(sections, segment) ? 'category' : 'gestor')
      })
      .catch(() => {
        if (!cancelled) setKind('gestor')
      })

    return () => {
      cancelled = true
    }
  }, [currencies, kind, location, segment, storeSlug])

  if (kind === 'category') {
    return <BuyerStoreCategoryPage categorySlug={segment} />
  }

  if (resolvingLocation || kind === 'pending') {
    return (
      <>
        <BuyerShell backTo="/comprar" backLabel={MARKETPLACE_LABEL}>
          <LoadingState message="Cargando tienda…" className="lg:items-start lg:text-left" />
        </BuyerShell>
        <BuyerMarketplaceNav catalogCategories={[]} catalogCategoriesLoading storeSlug={storeSlug} />
      </>
    )
  }

  if (!location || locationError) {
    return <Navigate to="/comprar/provincia" replace />
  }

  return <BuyerStorePage />
}
