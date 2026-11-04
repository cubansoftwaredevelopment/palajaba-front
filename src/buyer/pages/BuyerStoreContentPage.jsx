import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import BuyerShell from '../components/BuyerShell'
import BuyerStoreServiceFooter from '../components/BuyerStoreServiceFooter'
import RichDocContent from '../components/RichDocContent'
import CatalogThemeScope from '../../components/catalog/CatalogThemeScope'
import LoadingState from '../../components/ui/LoadingState'
import StatePanel from '../../components/ui/StatePanel'
import { fetchMarketplaceStore } from '../api.js'
import { fetchMarketplaceStorePage } from '../../products/api'
import { normalizeCatalogTheme } from '../../lib/catalogThemes'
import { storePageBySlug } from '../../lib/storePages'
import { isSellerAuthenticated } from '../../lib/sellerAuth'
import { storePublicPath } from '../../lib/storeSlug'
import { resolveUserFacingError } from '../../lib/userFacingError'

export default function BuyerStoreContentPage({ pageSlug }) {
  const { storeSlug } = useParams()
  const location = useLocation()
  const fromSellerCatalog = Boolean(location.state?.fromSellerCatalog) && isSellerAuthenticated()
  const pageMeta = storePageBySlug(pageSlug)
  const [page, setPage] = useState(null)
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    if (!storeSlug || !pageMeta) {
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    setStore(null)
    Promise.all([
      fetchMarketplaceStorePage(storeSlug, pageMeta.slug),
      fetchMarketplaceStore(storeSlug).catch(() => null),
    ])
      .then(([data, storeData]) => {
        if (!cancelled) {
          setPage(data)
          setStore(storeData)
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          setPage(null)
          setStore(null)
          setLoadError(resolveUserFacingError(cause, {
            contextTitle: 'Página no disponible',
            fallbackMessage: 'No pudimos mostrar esta página de la tienda.',
          }))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pageMeta, pageSlug, storeSlug])

  const catalogTheme = normalizeCatalogTheme(page?.catalog_theme)
  const catalogPalette = page?.catalog_palette ?? null

  return (
    <CatalogThemeScope theme={catalogTheme} palette={catalogPalette} className="flex min-h-dvh flex-col">
      <BuyerShell
        mode={fromSellerCatalog ? 'seller-preview' : 'default'}
        flushBottom
        backTo={fromSellerCatalog ? '/tienda/catalogo/vista-previa' : storePublicPath(storeSlug)}
        backLabel={fromSellerCatalog ? 'Volver al catálogo' : 'Volver a la tienda'}
      >
        <div className="flex min-h-full flex-1 flex-col">
          {loading ? <LoadingState message="Cargando página…" className="lg:items-start lg:text-left" /> : null}
          {!loading && loadError ? (
            <StatePanel
              variant="buyer"
              title={loadError.title}
              message={loadError.message}
              serviceError={loadError.isServiceError}
            />
          ) : null}
          {!loading && !loadError && page ? (
            <article className="min-w-0">
              <h1 className="font-display text-2xl font-bold text-brand-green">{page.title}</h1>
              <div className="mt-4">
                <RichDocContent content={page.content} />
              </div>
            </article>
          ) : null}
          {!loading && page ? (
            <BuyerStoreServiceFooter
              storeName={page.store_name}
              storeSlug={page.store_slug || storeSlug}
              photoUrl={page.profile_photo_url || store?.profile_photo_url}
              provinceName={page.province_name || store?.business_area?.province_name}
              offersDelivery={page.offers_delivery}
              pages={page.store_pages}
              homeTo={fromSellerCatalog ? '/tienda/catalogo/vista-previa' : storePublicPath(page.store_slug || storeSlug)}
              linkState={fromSellerCatalog ? { fromSellerCatalog: true } : null}
            />
          ) : null}
        </div>
      </BuyerShell>
    </CatalogThemeScope>
  )
}
