import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'

import CatalogThemePickerModal from '../../components/catalog/CatalogThemePickerModal'
import CatalogThemeScope from '../../components/catalog/CatalogThemeScope'
import BuyerCategoryProductRow from '../../components/buyer/BuyerCategoryProductRow'
import BuyerCurrencySelector from '../../components/buyer/BuyerCurrencySelector'
import BuyerShell from '../../components/buyer/BuyerShell'
import BuyerStoreProfileHeader from '../../components/buyer/BuyerStoreProfileHeader'
import { buyerHomeSections } from '../../components/buyer/buyerStyles'
import StatePanel from '../../components/ui/StatePanel'
import LoadingState from '../../components/ui/LoadingState'
import { BuyerDisplayCurrencyProvider } from '../../context/BuyerDisplayCurrencyContext'
import { BuyerJabaProvider } from '../../context/BuyerJabaContext'
import {
  fetchMarketplaceStoreCatalog,
  fetchMarketplaceStoreCategoryProducts,
  updateCatalogTheme,
} from '../../lib/api'
import { normalizeCatalogTheme } from '../../lib/catalogThemes'
import { resolveStoreSlug } from '../../lib/storeShare'
import { getSellerToken } from '../../lib/sellerAuth'
import { resolveUserFacingError } from '../../lib/userFacingError'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { sellerFocusRing } from '../../components/seller/sellerStyles'

const PAGE_SIZE = 20

function CatalogPreviewThemeButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border border-brand-green/15 bg-brand-white px-3 py-2 text-xs font-semibold text-brand-green shadow-sm transition-colors touch-manipulation active:bg-brand-yellow/20 sm:px-3.5 sm:text-sm ${sellerFocusRing}`}
      aria-label="Cambiar tema del catálogo"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="13.5" cy="6.5" r="2.5" />
        <circle cx="17.5" cy="10.5" r="2.5" />
        <circle cx="8.5" cy="7.5" r="2.5" />
        <circle cx="6.5" cy="12.5" r="2.5" />
        <path d="M12 22c4.2 0 7.5-3.4 7.5-7.5 0-1.2-.3-2.4-.8-3.5L12 12l-6.7 1C5.8 14.1 5.5 15.3 5.5 16.5 5.5 18.6 7.4 22 12 22z" />
      </svg>
      <span className="sm:hidden">Tema</span>
      <span className="hidden sm:inline">Cambiar tema</span>
    </button>
  )
}

export default function SellerCatalogPreview() {
  return (
    <BuyerDisplayCurrencyProvider>
      <BuyerJabaProvider>
        <SellerCatalogPreviewContent />
      </BuyerJabaProvider>
    </BuyerDisplayCurrencyProvider>
  )
}

function SellerCatalogPreviewContent() {
  const { profile, refreshProfile } = useOutletContext()
  const storeSlug = resolveStoreSlug(profile)
  const previewLocation = useMemo(() => {
    const area = profile?.business_area
    if (!area?.province_id || !area?.municipality_id) return null
    return {
      provinceId: area.province_id,
      municipalityId: area.municipality_id,
    }
  }, [profile?.business_area])

  const [catalog, setCatalog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [catalogTheme, setCatalogTheme] = useState(
    () => normalizeCatalogTheme(profile?.catalog_theme ?? catalog?.catalog_theme),
  )
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)
  const [themeError, setThemeError] = useState('')

  useEffect(() => {
    setCatalogTheme(normalizeCatalogTheme(profile?.catalog_theme ?? catalog?.catalog_theme))
  }, [profile?.catalog_theme, catalog?.catalog_theme])

  const loadCatalog = useCallback(async () => {
    if (!storeSlug || !previewLocation) {
      setLoading(false)
      return
    }

    setLoading(true)
    setLoadError(null)

    try {
      const data = await fetchMarketplaceStoreCatalog({
        storeSlug,
        provinceId: previewLocation.provinceId,
        municipalityId: previewLocation.municipalityId,
        limitPerCategory: PAGE_SIZE,
      })
      setCatalog(data)
      setCatalogTheme(normalizeCatalogTheme(data.catalog_theme))
    } catch (err) {
      setLoadError(
        resolveUserFacingError(err, {
          contextTitle: 'No se pudo abrir la vista previa',
          fallbackMessage: 'No pudimos cargar tu catálogo público. Inténtalo de nuevo.',
        }),
      )
      setCatalog(null)
    } finally {
      setLoading(false)
    }
  }, [previewLocation, storeSlug])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  const createLoadMore = useCallback(
    (section) => async (offset) => {
      const data = await fetchMarketplaceStoreCategoryProducts({
        storeSlug,
        localCategoryId: section.category_id,
        provinceId: previewLocation.provinceId,
        municipalityId: previewLocation.municipalityId,
        limit: PAGE_SIZE,
        offset,
      })
      return {
        products: data.products,
        has_more: data.has_more,
      }
    },
    [previewLocation, storeSlug],
  )

  async function handleSelectTheme(nextTheme) {
    const normalized = normalizeCatalogTheme(nextTheme)
    if (normalized === catalogTheme) {
      setShowThemePicker(false)
      return
    }

    setThemeError('')
    setSavingTheme(true)
    try {
      const token = getSellerToken()
      const result = await updateCatalogTheme(token, normalized)
      const savedTheme = normalizeCatalogTheme(result.catalog_theme)
      setCatalogTheme(savedTheme)
      setCatalog((current) => (current ? { ...current, catalog_theme: savedTheme } : current))
      await refreshProfile?.()
      setShowThemePicker(false)
    } catch (err) {
      setThemeError(getUserFacingMessage(err, 'No se pudo guardar el tema del catálogo.'))
    } finally {
      setSavingTheme(false)
    }
  }

  const sections = catalog?.sections ?? []
  const hasProducts = (catalog?.total_products ?? 0) > 0

  const headerEnd = (
    <div className="flex items-center gap-2">
      <BuyerCurrencySelector />
      <CatalogPreviewThemeButton onClick={() => setShowThemePicker(true)} />
    </div>
  )

  const previewShell = (children, { header = headerEnd } = {}) => (
    <CatalogThemeScope theme={catalogTheme} className="flex min-h-dvh flex-col">
      <BuyerShell
        mode="seller-preview"
        backTo="/tienda/catalogo"
        backLabel="Volver"
        headerEnd={header}
      >
        {children}
      </BuyerShell>
    </CatalogThemeScope>
  )

  if (!storeSlug || !previewLocation) {
    return previewShell(
      <StatePanel
        variant="buyer"
        title="Vista previa no disponible"
        message="Completa el nombre de tu tienda y tu área de negocio en el perfil para previsualizar el catálogo."
      >
        <Link
          to="/tienda/perfil"
          className={`mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-brand-green/15 bg-brand-white px-4 py-2 text-sm font-semibold text-brand-green ${sellerFocusRing}`}
        >
          Ir al perfil
        </Link>
      </StatePanel>,
      { header: <CatalogPreviewThemeButton onClick={() => setShowThemePicker(true)} /> },
    )
  }

  return (
    <>
      {previewShell(
        <>
          {loading ? (
            <LoadingState message="Cargando vista previa…" className="lg:items-start lg:text-left" />
          ) : null}

          {!loading && loadError ? (
            <StatePanel
              variant="buyer"
              title={loadError.title}
              message={loadError.message}
              serviceError={loadError.isServiceError}
              onRetry={loadError.canRetry ? loadCatalog : undefined}
              retrying={loading}
            />
          ) : null}

          {!loading && !loadError && catalog ? (
            <div className={buyerHomeSections}>
              <div className="rounded-2xl border border-brand-yellow/25 bg-brand-yellow/10 px-4 py-3 text-center lg:text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-carmelita/85">
                  Vista previa
                </p>
                <p className="mt-1 text-sm leading-relaxed text-brand-carmelita/90">
                  Así ven tus clientes el catálogo público. Los cambios de tema se aplican al instante.
                </p>
              </div>

              <BuyerStoreProfileHeader catalog={catalog} />

              {!hasProducts ? (
                <div className="rounded-3xl border border-brand-yellow/25 bg-brand-yellow/15 px-5 py-6 text-center lg:text-left">
                  <p className="font-display text-lg font-bold text-brand-green">Sin productos disponibles</p>
                  <p className="mt-2 text-sm leading-relaxed text-brand-carmelita/90">
                    Agrega productos en tu catálogo para verlos aquí.
                  </p>
                </div>
              ) : (
                sections.map((section) => (
                  <BuyerCategoryProductRow
                    key={section.category_id}
                    section={section}
                    loadMore={createLoadMore(section)}
                  />
                ))
              )}
            </div>
          ) : null}
        </>,
      )}

      {showThemePicker ? (
        <CatalogThemePickerModal
          selectedTheme={catalogTheme}
          saving={savingTheme}
          error={themeError}
          onClose={() => {
            if (!savingTheme) {
              setShowThemePicker(false)
              setThemeError('')
            }
          }}
          onSelectTheme={handleSelectTheme}
        />
      ) : null}
    </>
  )
}
