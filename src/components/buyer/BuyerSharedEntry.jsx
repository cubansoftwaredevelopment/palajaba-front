import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBuyerJaba } from '../../context/BuyerJabaContext'
import { fetchMarketplaceProduct, fetchMarketplaceSharedProducts } from '../../lib/api'
import { parseSharedJabaItems } from '../../lib/buyerShare'
import BuyerProductDetailModal from './BuyerProductDetailModal'

const sharedLoads = new Map()

function loadSharedEntry({ productId, jaba, provinceId, municipalityId, importSharedProducts }) {
  const key = `${provinceId}|${municipalityId}|${productId || ''}|${jaba || ''}`
  if (!sharedLoads.has(key)) {
    sharedLoads.set(
      key,
      (async () => {
        let product = null
        let productMissing = false
        const skipped = []
        if (productId) {
          try {
            product = await fetchMarketplaceProduct({ productId, provinceId, municipalityId })
          } catch {
            productMissing = true
          }
        }
        if (jaba) {
          const entries = parseSharedJabaItems(jaba)
          const data = await fetchMarketplaceSharedProducts({
            provinceId,
            municipalityId,
            items: entries.map((entry) => `${entry.id}.${entry.quantity}`),
          })
          const quantityById = new Map(entries.map((entry) => [entry.id, entry.quantity]))
          const notAdded = importSharedProducts(
            (data?.products ?? []).map((item) => ({
              product: item,
              quantity: quantityById.get(item.id) ?? 1,
            })),
          )
          skipped.push(...(data?.unavailable ?? []), ...notAdded)
        }
        return { product, productMissing, skipped }
      })(),
    )
  }
  return sharedLoads.get(key)
}

export default function BuyerSharedEntry({ location }) {
  const navigate = useNavigate()
  const { importSharedProducts, addProduct, buyProduct, isInJaba } = useBuyerJaba()
  const [product, setProduct] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const productId = params.get('producto')
    const jaba = params.get('jaba')
    if (!productId && !jaba) return undefined
    if (!location?.province?.id || !location?.municipality?.id) return undefined

    let cancelled = false
    loadSharedEntry({
      productId,
      jaba,
      provinceId: location.province.id,
      municipalityId: location.municipality.id,
      importSharedProducts,
    })
      .then((result) => {
        if (cancelled) return
        if (result.product) setProduct(result.product)
        const parts = []
        if (result.productMissing) parts.push('Este producto ya no está disponible en esta zona.')
        if (result.skipped?.length) parts.push(`No se pudieron agregar: ${result.skipped.join(', ')}.`)
        if (parts.length) setNotice(parts.join(' '))
      })
      .catch(() => {
        if (!cancelled) setNotice('No se pudo abrir lo que te compartieron.')
      })

    navigate('/comprar', { replace: true })
    return () => {
      cancelled = true
    }
  }, [importSharedProducts, location?.municipality?.id, location?.province?.id, navigate])

  return (
    <>
      {notice ? (
        <p className="mb-4 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/15 px-4 py-3 text-sm leading-relaxed text-brand-carmelita">
          {notice}
        </p>
      ) : null}
      {product ? (
        <BuyerProductDetailModal
          product={product}
          inJaba={isInJaba(product.id)}
          onClose={() => setProduct(null)}
          onBuy={async () => {
            const success = await buyProduct(product)
            if (success) setProduct(null)
          }}
          onAddToJaba={() => addProduct(product)}
        />
      ) : null}
    </>
  )
}
