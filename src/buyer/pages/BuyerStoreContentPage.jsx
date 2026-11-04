import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import BuyerShell from '../components/BuyerShell'
import BuyerStoreServiceFooter from '../components/BuyerStoreServiceFooter'
import RichDocContent from '../components/RichDocContent'
import CatalogThemeScope from '../../components/catalog/CatalogThemeScope'
import LoadingState from '../../components/ui/LoadingState'
import StatePanel from '../../components/ui/StatePanel'
import { fetchMarketplaceStorePage } from '../../products/api'
import { normalizeCatalogTheme } from '../../lib/catalogThemes'
import { storePageBySlug } from '../../lib/storePages'
import { storePublicPath } from '../../lib/storeSlug'
import { resolveUserFacingError } from '../../lib/userFacingError'

export default function BuyerStoreContentPage({ pageSlug }) {
  const { storeSlug } = useParams()
  const pageMeta = storePageBySlug(pageSlug)
  const [page, setPage] = useState(null)
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
    fetchMarketplaceStorePage(storeSlug, pageMeta.slug)
      .then((data) => {
        if (!cancelled) setPage(data)
      })
      .catch((cause) => {
        if (!cancelled) {
          setPage(null)
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
      <BuyerShell flushBottom backTo={storePublicPath(storeSlug)} backLabel="Volver a la tienda">
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
              pages={page.store_pages}
            />
          ) : null}
        </div>
      </BuyerShell>
    </CatalogThemeScope>
  )
}
