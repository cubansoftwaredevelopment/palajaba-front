import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import CatalogProductDetailModal from '../../components/seller/CatalogProductDetailModal'
import CreateCatalogCategoryModal from '../../components/seller/CreateCatalogCategoryModal'
import CreateCatalogProductModal from '../../components/seller/CreateCatalogProductModal'
import DeleteCatalogCategoryModal from '../../components/seller/DeleteCatalogCategoryModal'
import DeleteCatalogProductModal from '../../components/seller/DeleteCatalogProductModal'
import ReorderCatalogCategoriesModal from '../../components/seller/ReorderCatalogCategoriesModal'
import SellerCatalogEmpty from '../../components/seller/SellerCatalogEmpty'
import SellerCatalogView from '../../components/seller/SellerCatalogView'
import SellerPageHeader from '../../components/seller/SellerPageHeader'
import ShareCatalogModal from '../../components/seller/ShareCatalogModal'
import SellerSuccessAlert from '../../components/seller/SellerSuccessAlert'
import StatePanel from '../../components/ui/StatePanel'
import {
  sellerAlertError,
  sellerCatalogSection,
  sellerFocusRing,
  sellerPageWrap,
  sellerSectionGap,
} from '../../components/seller/sellerStyles'
import { fetchSellerCatalog } from '../../lib/api'
import { getSellerToken } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'

export default function SellerCatalog() {
  const { profile } = useOutletContext()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateProduct, setShowCreateProduct] = useState(false)
  const [createProductLocalCategoryId, setCreateProductLocalCategoryId] = useState('')
  const [productToEdit, setProductToEdit] = useState(null)
  const [productToDelete, setProductToDelete] = useState(null)
  const [productToView, setProductToView] = useState(null)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [showShareCatalog, setShowShareCatalog] = useState(false)
  const [showReorderCategories, setShowReorderCategories] = useState(false)

  const loadCatalog = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const token = getSellerToken()
      const data = await fetchSellerCatalog(token)
      setSummary(data)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos cargar tu catálogo. Inténtalo de nuevo.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  function openCreateProduct(localCategoryId = '') {
    if ((summary?.categories?.length ?? 0) === 0) {
      setError('Crea primero una categoría local para organizar tu catálogo.')
      setShowCreateCategory(true)
      return
    }
    setCreateProductLocalCategoryId(localCategoryId)
    setShowCreateProduct(true)
  }

  function handleCategoryCreated(category) {
    setShowCreateCategory(false)
    setSuccessMessage(`Categoría «${category.name}» creada.`)
    loadCatalog()
  }

  function handleProductSaved(product, { created = false } = {}) {
    setShowCreateProduct(false)
    setCreateProductLocalCategoryId('')
    setProductToEdit(null)
    setSuccessMessage(
      created ? `Producto «${product.name}» creado.` : `Producto «${product.name}» actualizado.`,
    )
    loadCatalog()
  }

  function handleProductDeleted(product) {
    setProductToDelete(null)
    setSuccessMessage(`Producto «${product.name}» eliminado.`)
    loadCatalog()
  }

  function handleCategoryDeleted(category) {
    setCategoryToDelete(null)
    const productCount = category.product_count ?? category.products?.length ?? 0
    setSuccessMessage(
      productCount > 0
        ? `Categoría «${category.name}» y sus ${productCount} producto${productCount === 1 ? '' : 's'} eliminados.`
        : `Categoría «${category.name}» eliminada.`,
    )
    loadCatalog()
  }

  function handleCategoriesReordered(nextSummary) {
    setShowReorderCategories(false)
    setSummary(nextSummary)
    setSuccessMessage('Orden de categorías actualizado.')
  }

  const hasLocalCategories = (summary?.categories?.length ?? 0) > 0
  const canReorderCategories = (summary?.categories?.length ?? 0) >= 2
  const showProductForm = summary && (showCreateProduct || productToEdit)

  return (
    <section className={`animate-fade-in ${sellerCatalogSection}`}>
      <div className={`${sellerPageWrap} ${sellerSectionGap}`}>
        <div className="flex items-start justify-between gap-3">
          <SellerPageHeader
            eyebrow="Catálogo"
            title="Tu catálogo"
            tone="dark"
            subtitle={
              !loading && !hasLocalCategories
                ? 'Crea categorías locales para organizar tu tienda y luego agrega productos.'
                : undefined
            }
          />

          {!loading && (canReorderCategories || profile?.store_name) ? (
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
              {canReorderCategories ? (
                <button
                  type="button"
                  onClick={() => setShowReorderCategories(true)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-brand-white/25 bg-brand-white/10 px-3 py-2 text-xs font-semibold text-brand-white transition-colors touch-manipulation active:border-brand-white/40 active:bg-brand-white/15 sm:px-3.5 sm:text-sm ${sellerFocusRing}`}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    aria-hidden="true"
                  >
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                  </svg>
                  <span className="hidden sm:inline">Organizar categorías</span>
                  <span className="sm:hidden">Organizar</span>
                </button>
              ) : null}

              {profile?.store_name ? (
                <button
                  type="button"
                  onClick={() => setShowShareCatalog(true)}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-brand-white/25 bg-brand-white/10 px-3 py-2 text-xs font-semibold text-brand-white transition-colors touch-manipulation active:border-brand-white/40 active:bg-brand-white/15 sm:px-3.5 sm:text-sm ${sellerFocusRing}`}
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    aria-hidden="true"
                  >
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" x2="12" y1="2" y2="15" />
                  </svg>
                  <span className="hidden sm:inline">Compartir catálogo</span>
                  <span className="sm:hidden">Compartir</span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        <SellerSuccessAlert message={successMessage} onDismiss={() => setSuccessMessage('')} />

        {error && summary ? (
          <p className={sellerAlertError} role="alert">
            {error}
          </p>
        ) : null}

        {!loading && error && !summary ? (
          <StatePanel
            variant="seller"
            title="No se pudo cargar el catálogo"
            message={error}
            onRetry={loadCatalog}
            retrying={loading}
          />
        ) : null}

        {loading && (
          <p className="rounded-2xl border border-brand-green/10 bg-brand-white px-4 py-6 text-center text-sm text-brand-carmelita/85">
            Cargando tu catálogo…
          </p>
        )}

        {!loading && !error && !hasLocalCategories && (
          <SellerCatalogEmpty
            onCreateCategory={() => setShowCreateCategory(true)}
            onCreateProduct={() => openCreateProduct()}
          />
        )}

        {!loading && !error && hasLocalCategories && (
          <SellerCatalogView
            summary={summary}
            onAddCategory={() => setShowCreateCategory(true)}
            onAddProduct={openCreateProduct}
            onViewProduct={setProductToView}
            onEditProduct={setProductToEdit}
            onDeleteProduct={setProductToDelete}
            onDeleteCategory={setCategoryToDelete}
          />
        )}

        {productToView && (
          <CatalogProductDetailModal
            product={productToView.product}
            categoryName={productToView.categoryName}
            onClose={() => setProductToView(null)}
            onEdit={setProductToEdit}
            onDelete={setProductToDelete}
          />
        )}

        {showCreateCategory && (
          <CreateCatalogCategoryModal
            onClose={() => setShowCreateCategory(false)}
            onCreated={handleCategoryCreated}
          />
        )}

        {showProductForm && summary && (
          <CreateCatalogProductModal
            localCategories={summary.categories}
            businessCategoryIds={profile?.category_ids ?? []}
            initialLocalCategoryId={
              createProductLocalCategoryId || productToEdit?.category_id || ''
            }
            initialGlobalCategoryId={productToEdit?.global_category_id || ''}
            product={productToEdit}
            defaultOffersDelivery={Boolean(profile?.offers_delivery)}
            onClose={() => {
              setShowCreateProduct(false)
              setCreateProductLocalCategoryId('')
              setProductToEdit(null)
            }}
            onSaved={(product) =>
              handleProductSaved(product, { created: !productToEdit })
            }
          />
        )}

        {productToDelete && (
          <DeleteCatalogProductModal
            product={productToDelete}
            onClose={() => setProductToDelete(null)}
            onDeleted={handleProductDeleted}
          />
        )}

        {categoryToDelete && (
          <DeleteCatalogCategoryModal
            category={categoryToDelete}
            onClose={() => setCategoryToDelete(null)}
            onDeleted={handleCategoryDeleted}
          />
        )}

        {showShareCatalog && profile ? (
          <ShareCatalogModal profile={profile} onClose={() => setShowShareCatalog(false)} />
        ) : null}

        {showReorderCategories && summary?.categories?.length >= 2 ? (
          <ReorderCatalogCategoriesModal
            categories={summary.categories}
            onClose={() => setShowReorderCategories(false)}
            onSaved={handleCategoriesReordered}
          />
        ) : null}
      </div>
    </section>
  )
}
