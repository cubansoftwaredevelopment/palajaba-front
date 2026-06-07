import { useCallback, useEffect, useState } from 'react'

import { useOutletContext } from 'react-router-dom'

import CatalogProductDetailModal from '../../components/seller/CatalogProductDetailModal'

import CreateCatalogProductModal from '../../components/seller/CreateCatalogProductModal'

import DeleteCatalogProductModal from '../../components/seller/DeleteCatalogProductModal'

import SellerCatalogEmpty from '../../components/seller/SellerCatalogEmpty'

import SellerCatalogView from '../../components/seller/SellerCatalogView'

import SellerPageHeader from '../../components/seller/SellerPageHeader'

import SellerSuccessAlert from '../../components/seller/SellerSuccessAlert'

import {

  sellerAlertError,

  sellerCatalogSection,

  sellerPageWrap,

  sellerSectionGap,

} from '../../components/seller/sellerStyles'

import { fetchSellerCatalog } from '../../lib/api'

import { getSellerToken } from '../../lib/sellerAuth'



export default function SellerCatalog() {

  const { profile } = useOutletContext()

  const [summary, setSummary] = useState(null)

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [successMessage, setSuccessMessage] = useState('')

  const [showCreateProduct, setShowCreateProduct] = useState(false)

  const [createProductCategoryId, setCreateProductCategoryId] = useState('')

  const [productToEdit, setProductToEdit] = useState(null)

  const [productToDelete, setProductToDelete] = useState(null)

  const [productToView, setProductToView] = useState(null)



  const loadCatalog = useCallback(async () => {

    setError('')

    setLoading(true)

    try {

      const token = getSellerToken()

      const data = await fetchSellerCatalog(token)

      setSummary(data)

    } catch (err) {

      setError(err.message || 'No se pudo cargar tu catálogo.')

    } finally {

      setLoading(false)

    }

  }, [])



  useEffect(() => {

    loadCatalog()

  }, [loadCatalog])



  function openCreateProduct(globalCategoryId = '') {

    setCreateProductCategoryId(globalCategoryId)

    setShowCreateProduct(true)

  }



  function handleProductSaved(product, { created = false } = {}) {

    setShowCreateProduct(false)

    setCreateProductCategoryId('')

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



  const hasProducts = (summary?.total_products ?? 0) > 0

  const showProductForm = summary && (showCreateProduct || productToEdit)



  return (

    <section className={`animate-fade-in ${sellerCatalogSection}`}>

      <div className={`${sellerPageWrap} ${sellerSectionGap}`}>

      <SellerPageHeader

        eyebrow="Catálogo"

        title="Tu catálogo"

        tone="dark"

        subtitle={

          !loading && !hasProducts

            ? 'Agrega productos con foto, precio y categoría global.'

            : undefined

        }

      />



      <SellerSuccessAlert message={successMessage} onDismiss={() => setSuccessMessage('')} />



      {error && (

        <p className={sellerAlertError} role="alert">

          {error}

        </p>

      )}



      {loading && (

        <p className="rounded-2xl border border-brand-green/10 bg-brand-white px-4 py-6 text-center text-sm text-brand-carmelita/85">

          Cargando tu catálogo…

        </p>

      )}



      {!loading && !error && !hasProducts && (

        <SellerCatalogEmpty onCreateProduct={() => openCreateProduct()} />

      )}



      {!loading && !error && hasProducts && (

        <SellerCatalogView

          summary={summary}

          onAddProduct={openCreateProduct}

          onViewProduct={setProductToView}

          onEditProduct={setProductToEdit}

          onDeleteProduct={setProductToDelete}

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



      {showProductForm && summary && (

        <CreateCatalogProductModal

          initialGlobalCategoryId={createProductCategoryId || productToEdit?.global_category_id || ''}

          product={productToEdit}

          defaultOffersDelivery={Boolean(profile?.offers_delivery)}

          onClose={() => {

            setShowCreateProduct(false)

            setCreateProductCategoryId('')

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

      </div>

    </section>

  )

}


