import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'

import CatalogProductDetailModal from '../componentes/CatalogProductDetailModal.jsx'
import CreateCatalogCategoryModal from '../componentes/CreateCatalogCategoryModal.jsx'
import CreateCatalogProductModal from '../componentes/CreateCatalogProductModal.jsx'
import DeleteCatalogCategoryModal from '../componentes/DeleteCatalogCategoryModal.jsx'
import DeleteCatalogProductModal from '../componentes/DeleteCatalogProductModal.jsx'
import OrganizeCatalogProductsModal from '../componentes/OrganizeCatalogProductsModal.jsx'
import ReorderCatalogCategoriesModal from '../componentes/ReorderCatalogCategoriesModal.jsx'
import SellerCatalogEmpty from '../componentes/SellerCatalogEmpty.jsx'
import SellerCatalogActionsMenu from '../componentes/SellerCatalogActionsMenu.jsx'
import SellerCatalogView from '../componentes/SellerCatalogView.jsx'
import SellerPageHeader from '../../seller/componentes/SellerPageHeader.jsx'
import { useSellerReadOnly } from '../../seller/componentes/sellerReadOnly.js'
import ShareCatalogModal from '../componentes/ShareCatalogModal.jsx'
import ShareSelectedProductsModal from '../componentes/ShareSelectedProductsModal.jsx'
import SellerSuccessAlert from '../../seller/componentes/SellerSuccessAlert.jsx'
import SellerNotificationToast from '../../seller/componentes/SellerNotificationToast.jsx'
import StatePanel from '../../shared/componentes/StatePanel.jsx'
import LoadingState from '../../shared/componentes/LoadingState.jsx'
import {
  sellerAlertError,
  sellerCatalogSection,
  sellerPageWrap,
  sellerSectionGap,
} from '../../seller/componentes/sellerStyles.js'
import { sellerHasProductDiscounts } from '../../subscriptions/utils/constants.js'
import { createCatalogProduct, fetchSellerCatalog, updateCatalogProduct } from '../api.js'
import { SELLER_PRODUCTS_REFRESH_EVENT } from '../../seller/utils/sellerProductsRefresh.js'
import { getSellerToken } from '../../seller/utils/sellerAuth.js'
import { usePullToRefresh } from '../../shared/componentes/usePullToRefresh.js'
import { runSectionRefresh } from '../../session/sectionStore'
import { useRegisterSectionRefresh } from '../../session/useSectionRefresh'
import { useSectionSnapshot } from '../../session/useSectionSnapshot'
import { resolveStoreSlug } from '../../seller/utils/storeShare.js'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'
import { BACKGROUND_UPLOAD_EVENT, consumeUploadResults, forgetUploadResult, startBackgroundFormUpload } from '../utils/backgroundUpload.js'

export default function SellerCatalog() {
  const { profile } = useOutletContext()
  const readOnly = useSellerReadOnly()
  const navigate = useNavigate()
  const { snapshot, commit, skipInitialRef } = useSectionSnapshot('seller', 'catalog')
  const [summary, setSummary] = useState(snapshot?.data ?? null)
  const [loading, setLoading] = useState(!snapshot?.data)
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
  const [errorToast, setErrorToast] = useState(null)

  function showProductError(message, title = 'No se pudo guardar el producto') {
    setSuccessMessage('')
    setErrorToast({
      id: `${Date.now()}`,
      tone: 'error',
      title,
      content: message,
    })
  }

  const loadCatalog = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setError('')
      setLoading(true)
    }
    try {
      const token = getSellerToken()
      const data = await fetchSellerCatalog(token)
      setSummary(data)
      commit(data)
    } catch (err) {
      setError(getUserFacingMessage(err, 'No pudimos cargar tu catálogo. Inténtalo de nuevo.'))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [commit])

  useEffect(() => {
    if (skipInitialRef.current) return
    loadCatalog()
  }, [loadCatalog])

  const refreshCatalog = useCallback(
    () => runSectionRefresh('seller', 'catalog', () => loadCatalog({ silent: true })),
    [loadCatalog],
  )
  useRegisterSectionRefresh(refreshCatalog)
  const { handlers: pullHandlers } = usePullToRefresh(refreshCatalog)

  useEffect(() => {
    window.addEventListener(SELLER_PRODUCTS_REFRESH_EVENT, loadCatalog)
    return () => window.removeEventListener(SELLER_PRODUCTS_REFRESH_EVENT, loadCatalog)
  }, [loadCatalog])

  useEffect(() => {
    function handleResult(detail) {
      if (!detail || detail.kind !== 'catalog_product') return
      forgetUploadResult(detail.id)
      if (!detail.ok) {
        showProductError(detail.error || 'No se pudo crear el producto.')
        return
      }
      setError('')
      setSuccessMessage('Producto guardado.')
      loadCatalog()
    }
    consumeUploadResults('catalog_product').forEach(handleResult)
    function onUpload(event) {
      handleResult(event.detail)
    }
    window.addEventListener(BACKGROUND_UPLOAD_EVENT, onUpload)
    return () => window.removeEventListener(BACKGROUND_UPLOAD_EVENT, onUpload)
  }, [loadCatalog])

  function openCreateProduct(localCategoryId = '') {
    if ((summary?.categories?.length ?? 0) === 0) {
      showProductError('Crea primero una categoría local para organizar tu catálogo.', 'Revisa los datos')
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

  function closeProductForm() {
    setShowCreateProduct(false)
    setCreateProductLocalCategoryId('')
    setProductToEdit(null)
  }

  function handleProductSaved(product, { created = false } = {}) {
    closeProductForm()
    setError('')
    setSuccessMessage(
      created ? `Producto «${product.name}» creado.` : `Producto «${product.name}» actualizado.`,
    )
    loadCatalog()
  }

  function handleProductPersist({ isEditing, productId, formData }) {
    setError('')
    closeProductForm()
    const token = getSellerToken()
    if (!isEditing) {
      const fields = {}
      const files = []
      for (const [key, value] of formData.entries()) {
        if (value instanceof Blob) files.push({ file: value, fieldName: key })
        else fields[key] = String(value)
      }
      startBackgroundFormUpload({
        token,
        path: '/api/auth/me/catalog/products',
        files,
        fields,
        notificationTitle: 'Subiendo producto',
        kind: 'catalog_product',
      })
        .then((started) => {
          if (started) {
            setSuccessMessage('El producto se está subiendo. Puedes salir; te avisamos cuando quede guardado.')
            return
          }
          return createCatalogProduct(token, formData).then((saved) =>
            handleProductSaved(saved, { created: true }),
          )
        })
        .catch((err) => {
          setSuccessMessage('')
          showProductError(getUserFacingMessage(err, 'No se pudo crear el producto.'))
        })
      return
    }
    updateCatalogProduct(token, productId, formData)
      .then((saved) => handleProductSaved(saved, { created: false }))
      .catch((err) => {
        showProductError(getUserFacingMessage(err, 'No se pudo actualizar el producto.'))
      })
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
    commit(nextSummary)
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
    commit(nextSummary)
    setSuccessMessage('Orden de productos actualizado.')
  }

  const hasLocalCategories = (summary?.categories?.length ?? 0) > 0
  const canReorderCategories = !readOnly && (summary?.categories?.length ?? 0) >= 2
  const canShareCatalog = Boolean(profile?.store_name)
  const canChangeTheme = !readOnly && Boolean(resolveStoreSlug(profile))
  const canCreate = !readOnly && hasLocalCategories
  const showCatalogActionsMenu =
    !loading && (canCreate || canReorderCategories || canShareCatalog || canChangeTheme)
  const showProductForm = summary && (showCreateProduct || productToEdit)

  return (
    <>
    <section className={sellerCatalogSection} {...pullHandlers}>
      <div className={`${sellerPageWrap} ${sellerSectionGap}`}>
        <SellerPageHeader
          eyebrow="Catálogo"
          subtitle={
            !loading && !hasLocalCategories
              ? 'Crea categorías locales para organizar tu tienda y luego agrega productos.'
              : undefined
          }
        />

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
          <SellerCatalogEmpty onCreateCategory={readOnly ? undefined : () => setShowCreateCategory(true)} />
        )}

        {!loading && !error && hasLocalCategories && (
          <>
            <SellerCatalogView
              summary={summary}
              selectedCategoryId={selectedCategoryId}
              selectedProductIds={selectedProductIds}
              onToggleProduct={toggleProductSelection}
              onShareSelected={openShareSelected}
              onAddProduct={readOnly ? undefined : openCreateProduct}
              onViewProduct={setProductToView}
              onEditProduct={readOnly ? undefined : setProductToEdit}
              onDeleteProduct={readOnly ? undefined : setProductToDelete}
              onDeleteCategory={readOnly ? undefined : setCategoryToDelete}
              onOrganizeProducts={readOnly ? undefined : setCategoryToOrganize}
            />
          </>
        )}

        {productToView && (
          <CatalogProductDetailModal
            product={productToView.product}
            categoryName={productToView.categoryName}
            onClose={() => setProductToView(null)}
            onEdit={readOnly ? undefined : setProductToEdit}
            onDelete={readOnly ? undefined : setProductToDelete}
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
            onClose={closeProductForm}
            onPersist={handleProductPersist}
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
      {showCatalogActionsMenu ? (
        <SellerCatalogActionsMenu
          onAddCategory={canCreate ? () => setShowCreateCategory(true) : undefined}
          onAddProduct={canCreate ? () => openCreateProduct() : undefined}
          canReorderCategories={canReorderCategories}
          canShareCatalog={canShareCatalog}
          canChangeTheme={canChangeTheme}
          onReorderCategories={() => setShowReorderCategories(true)}
          onShareCatalog={() => setShowShareCatalog(true)}
          onChangeTheme={() => navigate('/tienda/catalogo/vista-previa')}
        />
      ) : null}
    </section>
      <SellerNotificationToast
        toast={errorToast}
        aboveNav
        onDone={(id) => setErrorToast((current) => (current?.id === id ? null : current))}
      />
    </>
  )
}
