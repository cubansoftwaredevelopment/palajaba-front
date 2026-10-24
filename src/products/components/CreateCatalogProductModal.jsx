import { useEffect, useMemo, useRef, useState } from 'react'

import { createCatalogProduct, fetchCatalogCurrencies, fetchCategories, updateCatalogProduct } from '../api.js'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { IMAGE_UPLOAD_HINT, validateImageFile } from '../../lib/imageUpload'

import { resolveMediaUrl } from '../../lib/media'

import { getSellerToken } from '../../lib/sellerAuth'

import CategoryAutocomplete from '../../components/seller/CategoryAutocomplete'
import SellerSelect from '../../components/seller/SellerSelect'
import Checkbox from '../../components/ui/Checkbox'
import SellerModalPortal from '../../components/seller/SellerModalPortal'
import { useDismissibleModal } from '../../components/buyer/useOrderModalPresence'

import {

  sellerAlertError,

  sellerBtnPrimary,

  sellerBtnSecondary,

  sellerCharCounter,

  sellerCheckboxRow,

  sellerChip,

  sellerHint,

  sellerLabel,

  sellerModalBody,

  sellerModalFooter,

  sellerModalInput,

  sellerModalOverlay,

  sellerModalSheet,

  sellerModalTextarea,

  sellerModalTitle,

} from '../../components/seller/sellerStyles'



function toggleCurrency(code, setCurrent) {

  setCurrent((prev) => (prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code]))

}



function sameStringArray(a, b) {

  const left = [...(a ?? [])].sort()

  const right = [...(b ?? [])].sort()

  return left.length === right.length && left.every((item, index) => item === right[index])

}



function samePrice(input, original) {

  const parsed = Number.parseFloat(String(input).replace(',', '.'))

  if (!Number.isFinite(parsed)) return false

  return parsed === original

}

const MAX_PRODUCT_IMAGES = 6

function sourcePhotos(product) {
  const images = Array.isArray(product?.images) && product.images.length
    ? product.images
    : product?.image_url
      ? [{ id: 'legacy', image_url: product.image_url, is_frontal: true }]
      : []
  const photos = images.map((image) => ({
    key: image.id,
    existingId: image.id,
    file: null,
    preview: resolveMediaUrl(image.image_url),
    isFrontal: Boolean(image.is_frontal),
  }))
  return withSingleFrontal(photos)
}

function withSingleFrontal(photos) {
  if (photos.length === 0) return photos
  if (photos.length === 1 || !photos.some((photo) => photo.isFrontal)) {
    return photos.map((photo, index) => ({ ...photo, isFrontal: index === 0 }))
  }
  let marked = false
  return photos.map((photo) => {
    const isFrontal = Boolean(photo.isFrontal) && !marked
    if (isFrontal) marked = true
    return { ...photo, isFrontal }
  })
}

function photosChanged(photos, product) {
  const original = sourcePhotos(product)
  if (photos.some((photo) => photo.file)) return true
  if (photos.length !== original.length) return true
  return photos.some((photo, index) => (
    photo.existingId !== original[index]?.existingId || photo.isFrontal !== original[index]?.isFrontal
  ))
}


export default function CreateCatalogProductModal({

  localCategories = [],

  initialLocalCategoryId = '',

  initialGlobalCategoryId = '',

  defaultOffersDelivery = false,

  product = null,

  allowProductDiscount = false,

  onClose: requestClose,

  onSaved,

}) {
  const { dismiss: onClose, motionClass } = useDismissibleModal(requestClose)

  const isEditing = Boolean(product)

  const fileInputRef = useRef(null)
  const photosRef = useRef([])

  const [name, setName] = useState(product?.name ?? '')

  const [description, setDescription] = useState(product?.description ?? '')

  const [basePrice, setBasePrice] = useState(product ? String(product.base_price) : '')

  const [baseCurrency, setBaseCurrency] = useState(product?.base_currency ?? 'CUP')

  const [acceptedCurrencies, setAcceptedCurrencies] = useState(product?.accepted_currencies ?? [])

  const [localCategoryId, setLocalCategoryId] = useState(

    product?.category_id ?? initialLocalCategoryId ?? '',

  )

  const [globalCategoryId, setGlobalCategoryId] = useState(

    product?.global_category_id ?? initialGlobalCategoryId ?? '',

  )

  const [offersDelivery, setOffersDelivery] = useState(

    product?.offers_delivery ?? defaultOffersDelivery,

  )

  const [viewOnly, setViewOnly] = useState(product?.view_only ?? false)

  const [isAvailable, setIsAvailable] = useState(product?.is_available ?? true)

  const [discountPercent, setDiscountPercent] = useState(
    product?.discount_percent ? String(product.discount_percent) : '',
  )

  const [photos, setPhotos] = useState(() => (product ? sourcePhotos(product) : []))

  const [currencies, setCurrencies] = useState([])

  const [businessCategories, setBusinessCategories] = useState([])

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')



  useEffect(() => {

    function onKeyDown(e) {

      if (e.key === 'Escape') onClose()

    }

    document.addEventListener('keydown', onKeyDown)

    document.body.style.overflow = 'hidden'

    return () => {

      document.removeEventListener('keydown', onKeyDown)

      document.body.style.overflow = ''

    }

  }, [onClose])



  useEffect(() => {

    let cancelled = false



    async function loadData() {

      try {

        const token = getSellerToken()

        const [currencyData, allBusinessCategories] = await Promise.all([

          fetchCatalogCurrencies(token),

          fetchCategories(),

        ])

        if (!cancelled) {

          setCurrencies(currencyData)

          setBusinessCategories(Array.isArray(allBusinessCategories) ? allBusinessCategories : [])

          if (currencyData.length > 0) {

            setBaseCurrency((current) =>

              currencyData.some((item) => item.code === current) ? current : currencyData[0].code,

            )

          }

          if (localCategories.length > 0) {

            setLocalCategoryId((current) => current || initialLocalCategoryId || localCategories[0].id)

          }

        }

      } catch {

        if (!cancelled) {

          setCurrencies([])

          setBusinessCategories([])

        }

      }

    }



    loadData()

    return () => {

      cancelled = true

    }

  }, [initialLocalCategoryId, localCategories])



  useEffect(() => {

    if (businessCategories.length === 0) return

    const allowedIds = new Set(businessCategories.map((category) => category.id))

    setGlobalCategoryId((current) => {

      if (current && allowedIds.has(current)) return current

      return businessCategories[0]?.id ?? ''

    })

  }, [businessCategories])



  photosRef.current = photos

  useEffect(() => () => {
    photosRef.current.forEach((photo) => {
      if (photo.file && photo.preview?.startsWith('blob:')) URL.revokeObjectURL(photo.preview)
    })
  }, [])



  useEffect(() => {

    setAcceptedCurrencies((current) => current.filter((code) => code !== baseCurrency))

  }, [baseCurrency])



  const alternateCurrencies = useMemo(

    () => currencies.filter((currency) => currency.code !== baseCurrency),

    [currencies, baseCurrency],

  )



  const hasChanges = useMemo(() => {

    if (!isEditing || !product) return true



    return (

      name.trim() !== (product.name ?? '').trim() ||

      description.trim() !== (product.description ?? '').trim() ||

      !samePrice(basePrice, product.base_price) ||

      String(product.discount_percent || '') !== String(discountPercent || '') ||

      baseCurrency !== product.base_currency ||

      localCategoryId !== product.category_id ||

      globalCategoryId !== product.global_category_id ||

      offersDelivery !== product.offers_delivery ||

      viewOnly !== product.view_only ||

      isAvailable !== product.is_available ||

      photosChanged(photos, product) ||

      !sameStringArray(acceptedCurrencies, product.accepted_currencies)

    )

  }, [

    isEditing,

    product,

    name,

    description,

    basePrice,

    discountPercent,

    baseCurrency,

    localCategoryId,

    globalCategoryId,

    offersDelivery,

    viewOnly,

    isAvailable,

    photos,

    acceptedCurrencies,

  ])



  function handlePhotoChange(event) {
    const files = [...(event.target.files ?? [])]
    event.target.value = ''
    if (files.length === 0) return

    let rejected = false
    const next = []
    for (const file of files) {
      const validation = validateImageFile(file)
      if (!validation.ok) {
        rejected = true
        setError(validation.message)
        continue
      }
      next.push({
        key: crypto.randomUUID(),
        existingId: null,
        file,
        preview: URL.createObjectURL(file),
        isFrontal: false,
      })
    }
    if (next.length === 0) return

    const room = MAX_PRODUCT_IMAGES - photos.length
    const accepted = next.slice(0, Math.max(0, room))
    next.slice(accepted.length).forEach((photo) => URL.revokeObjectURL(photo.preview))
    if (next.length > room) {
      setError(`Un producto puede tener hasta ${MAX_PRODUCT_IMAGES} fotos.`)
    } else if (!rejected) {
      setError('')
    }
    if (accepted.length === 0) return
    setPhotos((current) => withSingleFrontal([...current, ...accepted]))
  }

  function chooseFrontal(key) {
    setPhotos((current) => {
      if (current.length < 2) return withSingleFrontal(current)
      return current.map((photo) => ({ ...photo, isFrontal: photo.key === key }))
    })
  }

  function removePhoto(key) {
    setPhotos((current) => {
      if (current.length <= 1) return current
      const target = current.find((photo) => photo.key === key)
      if (target?.file && target.preview?.startsWith('blob:')) URL.revokeObjectURL(target.preview)
      return withSingleFrontal(current.filter((photo) => photo.key !== key))
    })
  }



  async function handleSubmit(event) {

    event.preventDefault()

    setError('')



    const trimmedName = name.trim()

    if (trimmedName.length < 2) {

      setError('Escribe un nombre de al menos 2 caracteres.')

      return

    }

    if (photos.length === 0) {

      setError('Sube una imagen del producto.')

      return

    }

    if (!localCategoryId) {

      setError('Selecciona una categoría local de tu catálogo.')

      return

    }

    if (!globalCategoryId) {

      setError('Selecciona la categoría global de tu negocio.')

      return

    }



    const parsedPrice = Number.parseFloat(String(basePrice).replace(',', '.'))

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {

      setError('Indica un precio base válido.')

      return

    }



    const formData = new FormData()

    formData.append('name', trimmedName)

    formData.append('description', description.trim())

    formData.append('base_price', String(parsedPrice))

    if (allowProductDiscount) {
      const parsedDiscount = Number.parseInt(String(discountPercent).trim(), 10)
      if (String(discountPercent).trim() && (!Number.isInteger(parsedDiscount) || parsedDiscount < 0 || parsedDiscount >= 100)) {
        setError('El descuento debe ser un porcentaje entre 1 y 99.')
        return
      }
      formData.append('discount_percent', Number.isInteger(parsedDiscount) && parsedDiscount > 0 ? String(parsedDiscount) : '')
    }

    formData.append('base_currency', baseCurrency)

    formData.append('accepted_currencies', JSON.stringify(acceptedCurrencies))

    formData.append('category_id', localCategoryId)

    formData.append('global_category_id', globalCategoryId)

    formData.append('offers_delivery', String(offersDelivery))

    formData.append('view_only', String(viewOnly))

    formData.append('is_available', String(isAvailable))

    const frontalIndex = Math.max(0, photos.findIndex((photo) => photo.isFrontal))

    if (!isEditing) {

      photos.forEach((photo) => formData.append('photos', photo.file))

      formData.append('frontal_index', String(photos.length === 1 ? 0 : frontalIndex))

    } else if (photosChanged(photos, product)) {

      const original = sourcePhotos(product)

      const keptIds = new Set(photos.map((photo) => photo.existingId).filter(Boolean))

      const removed = original.filter((photo) => photo.existingId && !keptIds.has(photo.existingId))

      const added = photos.filter((photo) => photo.file)

      added.forEach((photo) => formData.append('photos', photo.file))

      formData.append('remove_image_ids', JSON.stringify(removed.map((photo) => photo.existingId)))

      const frontal = photos[frontalIndex]

      if (frontal?.existingId) formData.append('frontal_image_id', frontal.existingId)

      else formData.append('frontal_new_index', String(Math.max(0, added.indexOf(frontal))))

    }



    setLoading(true)

    try {

      const token = getSellerToken()

      const saved = isEditing

        ? await updateCatalogProduct(token, product.id, formData)

        : await createCatalogProduct(token, formData)

      onSaved(saved)

    } catch (err) {

      setError(getUserFacingMessage(err, `No se pudo ${isEditing ? 'actualizar' : 'crear'} el producto.`))

    } finally {

      setLoading(false)

    }

  }



  return (

    <SellerModalPortal>

      <div

        className={`${sellerModalOverlay} ${motionClass}`}

        role="dialog"

        aria-modal="true"

        aria-labelledby="catalog-product-form-title"

        onClick={onClose}

      >

        <div

          className={sellerModalSheet}

          onClick={(event) => event.stopPropagation()}

        >

          <div className="shrink-0 border-b border-brand-green/8 px-5 py-4">

            <h2 id="catalog-product-form-title" className={sellerModalTitle}>

              {isEditing ? 'Editar producto' : 'Nuevo producto'}

            </h2>

          </div>



          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">

            <div className={sellerModalBody}>

            <input

              ref={fileInputRef}

              type="file"

              accept="image/jpeg,image/png,image/webp"

              multiple

              className="sr-only"

              onChange={handlePhotoChange}

            />

            <div>

              <p className={sellerLabel}>Fotos<span className="text-brand-carmelita"> *</span></p>

              <div className="mt-2 grid grid-cols-3 gap-2">

                {photos.map((photo) => (

                  <div key={photo.key} className="relative">

                    <img

                      src={photo.preview}

                      alt=""

                      className={`aspect-square w-full rounded-2xl object-cover ${photo.isFrontal ? 'ring-2 ring-brand-green' : ''}`}

                    />

                    {photos.length > 1 ? (

                      <button

                        type="button"

                        onClick={() => removePhoto(photo.key)}

                        className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-brand-white/95 text-brand-carmelita touch-manipulation"

                        aria-label="Quitar foto"

                      >

                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>

                          <path d="M18 6 6 18M6 6l12 12" />

                        </svg>

                      </button>

                    ) : null}

                    <button

                      type="button"

                      onClick={() => chooseFrontal(photo.key)}

                      disabled={photos.length < 2}

                      className={`absolute inset-x-1.5 bottom-1.5 rounded-full px-2 py-1 text-[0.65rem] font-semibold touch-manipulation ${photo.isFrontal ? 'bg-brand-green text-brand-white' : 'bg-brand-white/95 text-brand-green'}`}

                    >

                      {photo.isFrontal ? 'Frontal' : 'Elegir frontal'}

                    </button>

                  </div>

                ))}

                {photos.length < MAX_PRODUCT_IMAGES ? (

                  <button

                    type="button"

                    onClick={() => fileInputRef.current?.click()}

                    className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-brand-green/22 bg-brand-green/[0.02] text-brand-green touch-manipulation active:bg-brand-yellow/10"

                  >

                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>

                      <path d="M12 5v14M5 12h14" />

                    </svg>

                    <span className="text-xs font-semibold">Agregar</span>

                  </button>

                ) : null}

              </div>

              <p className={`mt-2 ${sellerHint}`}>

                Hasta {MAX_PRODUCT_IMAGES} fotos. Si solo hay una, esa queda como frontal. {IMAGE_UPLOAD_HINT}

              </p>

            </div>



            <label htmlFor="catalog-product-name" className={`mt-4 block ${sellerLabel}`}>

              Nombre<span className="text-brand-carmelita"> *</span>

            </label>

            <input

              id="catalog-product-name"

              type="text"

              value={name}

              onChange={(event) => {

                setName(event.target.value)

                setError('')

              }}

              maxLength={120}

              placeholder="Ej.: Arroz 1 kg"

              className={`mt-1.5 ${sellerModalInput}`}

              autoComplete="off"

            />

            <p className={`mt-1 ${sellerCharCounter}`}>{name.length}/120</p>



            <label htmlFor="catalog-product-description" className={`mt-4 block ${sellerLabel}`}>

              Descripción

            </label>

            <textarea

              id="catalog-product-description"

              value={description}

              onChange={(event) => setDescription(event.target.value)}

              maxLength={500}

              placeholder="Ingredientes, tallas, detalles…"

              className={`mt-1.5 ${sellerModalTextarea}`}

              rows={3}

            />

            <p className={`mt-1 ${sellerCharCounter}`}>{description.length}/500</p>



            <label htmlFor="catalog-product-local-category" className={`mt-4 block ${sellerLabel}`}>

              Categoría local<span className="text-brand-carmelita"> *</span>

            </label>

            <div className="mt-1.5">

              <SellerSelect

                id="catalog-product-local-category"

                modal

                dropdownZIndex={210}

                value={localCategoryId}

                onChange={(nextId) => {

                  setLocalCategoryId(nextId)

                  setError('')

                }}

                disabled={localCategories.length === 0}

                options={[

                  { value: '', label: 'Selecciona una categoría' },

                  ...localCategories.map((category) => ({ value: category.id, label: category.name })),

                ]}

              />

            </div>

            <p className={`mt-1 ${sellerHint}`}>

              Organiza tu catálogo y la vista pública de tu tienda.

            </p>



            <label htmlFor="catalog-product-global-category" className={`mt-4 block ${sellerLabel}`}>

              Categoría global<span className="text-brand-carmelita"> *</span>

            </label>

            <div className="mt-1.5">

              <CategoryAutocomplete

                id="catalog-product-global-category"

                categories={businessCategories}

                value={globalCategoryId}

                onChange={(nextId) => {

                  setGlobalCategoryId(nextId)

                  setError('')

                }}

                multiple={false}

                placeholder="Buscar categoría…"

                disabled={businessCategories.length === 0}

                dropdownZIndex={210}

                useModalInput

              />

            </div>

            <p className={`mt-1 ${sellerHint}`}>

              Una sola por producto. Elige la que mejor describa este artículo.

            </p>



            <div className="mt-4 grid grid-cols-2 gap-2">

              <div>

                <label htmlFor="catalog-product-price" className={sellerLabel}>

                  Precio base<span className="text-brand-carmelita"> *</span>

                </label>

                <input

                  id="catalog-product-price"

                  type="number"

                  min="0"

                  step="0.01"

                  inputMode="decimal"

                  value={basePrice}

                  onChange={(event) => setBasePrice(event.target.value)}

                  placeholder="0.00"

                  className={`mt-1.5 ${sellerModalInput}`}

                />

              </div>

              <div>

                <label htmlFor="catalog-product-currency" className={sellerLabel}>

                  Moneda base<span className="text-brand-carmelita"> *</span>

                </label>

                <div className="mt-1.5">

                  <SellerSelect

                    id="catalog-product-currency"

                    modal

                    dropdownZIndex={210}

                    value={baseCurrency}

                    onChange={setBaseCurrency}

                    options={currencies.map((currency) => ({ value: currency.code, label: currency.label }))}

                  />

                </div>

              </div>

            </div>

            {allowProductDiscount ? (
              <div className="mt-4">
                <label htmlFor="catalog-product-discount" className={sellerLabel}>
                  Descuento
                </label>
                <input
                  id="catalog-product-discount"
                  type="number"
                  min="0"
                  max="99"
                  step="1"
                  inputMode="numeric"
                  value={discountPercent}
                  onChange={(event) => setDiscountPercent(event.target.value)}
                  placeholder="0"
                  className={`mt-1.5 ${sellerModalInput}`}
                />
                <p className={`mt-1 ${sellerHint}`}>
                  Porcentaje opcional (1–99). Disponible en Pro y Premium. El precio base se muestra tachado en el feed.
                </p>
              </div>
            ) : null}

            {alternateCurrencies.length > 0 && (

              <div className="mt-4">

                <p className={sellerLabel}>Monedas que acepta</p>

                <p className={`mt-0.5 ${sellerHint}`}>

                  Además de la moneda base, selecciona otras formas de pago.

                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">

                  {alternateCurrencies.map((currency) => (

                    <button

                      key={currency.code}

                      type="button"

                      onClick={() => toggleCurrency(currency.code, setAcceptedCurrencies)}

                      className={sellerChip(acceptedCurrencies.includes(currency.code))}

                    >

                      {currency.code}

                    </button>

                  ))}

                </div>

              </div>

            )}



            <div className="mt-4 space-y-2">

              <label className={sellerCheckboxRow}>

                <Checkbox

                  className="mt-0.5"

                  checked={offersDelivery}

                  onChange={(event) => setOffersDelivery(event.target.checked)}

                />

                <span>

                  <span className="block text-sm font-semibold text-brand-green">Acepta domicilio</span>

                  <span className={sellerHint}>Puedes cambiarlo por producto.</span>

                </span>

              </label>



              <label className={sellerCheckboxRow}>

                <Checkbox

                  className="mt-0.5"

                  checked={viewOnly}

                  onChange={(event) => setViewOnly(event.target.checked)}

                />

                <span>

                  <span className="block text-sm font-semibold text-brand-green">Solo vista</span>

                  <span className={sellerHint}>Visible solo en el catálogo de tu tienda.</span>

                </span>

              </label>



              <label className={sellerCheckboxRow}>

                <Checkbox

                  className="mt-0.5"

                  checked={isAvailable}

                  onChange={(event) => setIsAvailable(event.target.checked)}

                />

                <span>

                  <span className="block text-sm font-semibold text-brand-green">Disponible</span>

                  <span className={sellerHint}>Si lo desactivas, se verá como agotado.</span>

                </span>

              </label>

            </div>



            {error && (

              <p className={`mt-4 ${sellerAlertError}`} role="alert">

                {error}

              </p>

            )}

          </div>



          <div className={`${sellerModalFooter} grid grid-cols-2 gap-2`}>

            <button type="button" onClick={onClose} disabled={loading} className={sellerBtnSecondary}>

              Cancelar

            </button>

            <button

              type="submit"

              disabled={loading || (isEditing && !hasChanges)}

              className={sellerBtnPrimary}

            >

              {loading ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear producto'}

            </button>

          </div>

        </form>

        </div>

      </div>

    </SellerModalPortal>

  )

}


