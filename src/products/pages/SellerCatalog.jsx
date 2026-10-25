import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import CatalogProductDetailModal from '../components/CatalogProductDetailModal'
import CreateCatalogCategoryModal from '../components/CreateCatalogCategoryModal'
import CreateCatalogProductModal from '../components/CreateCatalogProductModal'
import DeleteCatalogCategoryModal from '../components/DeleteCatalogCategoryModal'
import DeleteCatalogProductModal from '../components/DeleteCatalogProductModal'
import OrganizeCatalogProductsModal from '../components/OrganizeCatalogProductsModal'
import ReorderCatalogCategoriesModal from '../components/ReorderCatalogCategoriesModal'
import SellerCatalogEmpty from '../components/SellerCatalogEmpty'
import SellerCatalogActionsMenu from '../components/SellerCatalogActionsMenu'
import SellerCatalogFab from '../components/SellerCatalogFab'
import SellerCatalogView from '../components/SellerCatalogView'
import SellerPageHeader from '../../components/seller/SellerPageHeader'
import ShareCatalogModal from '../components/ShareCatalogModal'
import ShareSelectedProductsModal from '../components/ShareSelectedProductsModal'
import SellerSuccessAlert from '../../components/seller/SellerSuccessAlert'
import StatePanel from '../../components/ui/StatePanel'
import LoadingState from '../../components/ui/LoadingState'
import {
  sellerAlertError,
  sellerCatalogSection,
  sellerPageWrap,
  sellerSectionGap,
} from '../../components/seller/sellerStyles'
import { sellerHasProductDiscounts } from '../../subscriptions/constants.js'
import { fetchSellerCatalog } from '../api.js'
import { getSellerToken } from '../../lib/sellerAuth'
import { resolveStoreSlug } from '../../lib/storeShare'
import { getUserFacingMessage } from '../../lib/userFacingError'

export default function SellerCatalog() {
  const { profile } = useOutletContext()
  const navigate = useNavigate()
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
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [shareSelection, setShareSelection] = useState(null)
  const [showReorderCategories, setShowReorderCategories] = useState(false)
  const [categoryToOrganize, setCategoryToOrganize] = useState(null)

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
    setSelectedProductIds((current) => current.filter((id) => id !== product.id))
    setSuccessMessage(`Producto «${product.name}» eliminado.`)
    loadCatalog()
  }

  function handleCategoryDeleted(category) {
    if (selectedCategoryId === category.id) {
      setSelectedCategoryId('')
      setSelectedProductIds([])
    }
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

  function toggleProductSelection(categoryId, productId) {
    if (selectedCategoryId !== categoryId) {
      setSelectedCategoryId(categoryId)
      setSelectedProductIds([productId])
      return
    }
    setSelectedProductIds((current) => {
      const next = current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
      if (next.length === 0) setSelectedCategoryId('')
      return next
    })
  }

  function openShareSelected(category, productIds) {
    const selected = new Set(productIds)
    const products = (category.products || []).filter((product) => selected.has(product.id))
    if (!products.length) return
    setShareSelection({ category, products })
  }

  function handleProductsOrganized(nextSummary) {
    setCategoryToOrganize(null)
    setSummary(nextSummary)
    setSuccessMessage('Orden de productos actualizado.')
  }

  const hasLocalCategories = (summary?.categories?.length ?? 0) > 0
  const canReorderCategories = (summary?.categories?.length ?? 0) >= 2
  const canShareCatalog = Boolean(profile?.store_name)
  const canChangeTheme = Boolean(resolveStoreSlug(profile))
  const showCatalogActionsMenu =
    !loading && (canReorderCategories || canShareCatalog || canChangeTheme)
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

          {showCatalogActionsMenu ? (
            <SellerCatalogActionsMenu
              canReorderCategories={canReorderCategories}
              canShareCatalog={canShareCatalog}
              canChangeTheme={canChangeTheme}
              onReorderCategories={() => setShowReorderCategories(true)}
              onShareCatalog={() => setShowShareCatalog(true)}
              onChangeTheme={() => navigate('/tienda/catalogo/vista-previa')}
            />
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
            serviceError
            onRetry={loadCatalog}
            retrying={loading}
          />
        ) : null}

        {loading ? (
          <LoadingState variant="panel" message="Cargando tu catálogo…" />
        ) : null}

        {!loading && !error && !hasLocalCategories && (
          <SellerCatalogEmpty onCreateCategory={() => setShowCreateCategory(true)} />
        )}

        {!loading && !error && hasLocalCategories && (
          <>
            <SellerCatalogView
              summary={summary}
              selectedCategoryId={selectedCategoryId}
              selectedProductIds={selectedProductIds}
              onToggleProduct={toggleProductSelection}
              onShareSelected={openShareSelected}
              onAddProduct={openCreateProduct}
              onViewProduct={setProductToView}
              onEditProduct={setProductToEdit}
              onDeleteProduct={setProductToDelete}
              onDeleteCategory={setCategoryToDelete}
              onOrganizeProducts={setCategoryToOrganize}
            />
            <SellerCatalogFab
              onAddCategory={() => setShowCreateCategory(true)}
              onAddProduct={() => openCreateProduct()}
            />
          </>
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
            initialLocalCategoryId={
              createProductLocalCategoryId || productToEdit?.category_id || ''
            }
            initialGlobalCategoryId={productToEdit?.global_category_id || ''}
            product={productToEdit}
            allowProductDiscount={sellerHasProductDiscounts(profile)}
            defaultOffersDelivery={Boolean(profile?.offers_delivery)}
            profile={profile}
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

        {shareSelection ? (
          <ShareSelectedProductsModal
            profile={profile}
            products={shareSelection.products}
            categoryName={shareSelection.category.name}
            onClose={() => setShareSelection(null)}
          />
        ) : null}

        {showReorderCategories && summary?.categories?.length >= 2 ? (
          <ReorderCatalogCategoriesModal
            categories={summary.categories}
            onClose={() => setShowReorderCategories(false)}
            onSaved={handleCategoriesReordered}
          />
        ) : null}

        {categoryToOrganize ? (
          <OrganizeCatalogProductsModal
            category={categoryToOrganize}
            onClose={() => setCategoryToOrganize(null)}
            onSaved={handleProductsOrganized}
          />
        ) : null}
      </div>
    </section>
  )
}
