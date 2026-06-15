import { useEffect, useMemo, useRef, useState } from 'react'

import { createCatalogProduct, fetchCatalogCurrencies, fetchCategories, updateCatalogProduct } from '../../lib/api'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { IMAGE_UPLOAD_HINT, validateImageFile } from '../../lib/imageUpload'

import { resolveMediaUrl } from '../../lib/media'

import { getSellerToken } from '../../lib/sellerAuth'

import CategoryAutocomplete from './CategoryAutocomplete'
import SellerModalPortal from './SellerModalPortal'

import {

  sellerAlertError,

  sellerBtnPrimary,

  sellerBtnSecondary,

  sellerCharCounter,

  sellerCheckboxInput,

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

} from './sellerStyles'



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



function buildBusinessCategories(allCategories, businessCategoryIds) {

  return businessCategoryIds.map((id) => {

    const match = allCategories.find((category) => category.id === id)

    return match ?? { id, name: id }

  })

}



export default function CreateCatalogProductModal({

  localCategories = [],

  businessCategoryIds = [],

  initialLocalCategoryId = '',

  initialGlobalCategoryId = '',

  defaultOffersDelivery = false,

  product = null,

  onClose,

  onSaved,

}) {

  const isEditing = Boolean(product)

  const fileInputRef = useRef(null)

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

  const [photoFile, setPhotoFile] = useState(null)

  const [photoPreview, setPhotoPreview] = useState('')

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

        const allowedBusinessCategories = buildBusinessCategories(
          allBusinessCategories,
          businessCategoryIds,
        )

        if (!cancelled) {

          setCurrencies(currencyData)

          setBusinessCategories(allowedBusinessCategories)

          if (currencyData.length > 0) {

            setBaseCurrency((current) =>

              currencyData.some((item) => item.code === current) ? current : currencyData[0].code,

            )

          }

          if (!localCategoryId && localCategories.length > 0) {

            setLocalCategoryId((current) => current || localCategories[0].id)

          }

          if (!globalCategoryId && allowedBusinessCategories.length > 0) {

            setGlobalCategoryId((current) => current || allowedBusinessCategories[0].id)

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

  }, [businessCategoryIds, globalCategoryId, localCategories, localCategoryId])



  useEffect(() => {

    if (photoFile) {

      const url = URL.createObjectURL(photoFile)

      setPhotoPreview(url)

      return () => URL.revokeObjectURL(url)

    }



    if (isEditing && product?.image_url) {

      setPhotoPreview(resolveMediaUrl(product.image_url))

      return undefined

    }



    setPhotoPreview('')

    return undefined

  }, [photoFile, isEditing, product])



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

      baseCurrency !== product.base_currency ||

      localCategoryId !== product.category_id ||

      globalCategoryId !== product.global_category_id ||

      offersDelivery !== product.offers_delivery ||

      viewOnly !== product.view_only ||

      isAvailable !== product.is_available ||

      Boolean(photoFile) ||

      !sameStringArray(acceptedCurrencies, product.accepted_currencies)

    )

  }, [

    isEditing,

    product,

    name,

    description,

    basePrice,

    baseCurrency,

    localCategoryId,

    globalCategoryId,

    offersDelivery,

    viewOnly,

    isAvailable,

    photoFile,

    acceptedCurrencies,

  ])



  function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      setPhotoFile(null)
      return
    }

    const validation = validateImageFile(file)
    if (!validation.ok) {
      setPhotoFile(null)
      setError(validation.message)
      return
    }

    setPhotoFile(file)
    setError('')
  }



  async function handleSubmit(event) {

    event.preventDefault()

    setError('')



    const trimmedName = name.trim()

    if (trimmedName.length < 2) {

      setError('Escribe un nombre de al menos 2 caracteres.')

      return

    }

    if (!photoFile && !isEditing) {

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

    formData.append('base_currency', baseCurrency)

    formData.append('accepted_currencies', JSON.stringify(acceptedCurrencies))

    formData.append('category_id', localCategoryId)

    formData.append('global_category_id', globalCategoryId)

    formData.append('offers_delivery', String(offersDelivery))

    formData.append('view_only', String(viewOnly))

    formData.append('is_available', String(isAvailable))

    if (photoFile) {

      formData.append('photo', photoFile)

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

        className={sellerModalOverlay}

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

              className="sr-only"

              onChange={handlePhotoChange}

            />



            <button

              type="button"

              onClick={() => fileInputRef.current?.click()}

              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-green/22 bg-brand-green/[0.02] px-4 py-5 touch-manipulation active:border-brand-green/35 active:bg-brand-yellow/10"

            >

              {photoPreview ? (

                <img src={photoPreview} alt="" className="h-28 w-28 rounded-2xl object-cover" />

              ) : (

                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">

                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>

                    <path d="M12 5v14M5 12h14" />

                  </svg>

                </span>

              )}

              <span className="text-sm font-semibold text-brand-green">

                {photoPreview ? 'Cambiar imagen' : 'Subir imagen'}

              </span>

              <span className={sellerHint}>

                {isEditing ? 'Opcional si mantienes la actual' : 'Obligatoria'} · {IMAGE_UPLOAD_HINT}

              </span>

            </button>



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

            <select

              id="catalog-product-local-category"

              value={localCategoryId}

              onChange={(event) => {

                setLocalCategoryId(event.target.value)

                setError('')

              }}

              className={`mt-1.5 ${sellerModalInput}`}

              disabled={localCategories.length === 0}

            >

              <option value="">Selecciona una categoría</option>

              {localCategories.map((category) => (

                <option key={category.id} value={category.id}>

                  {category.name}

                </option>

              ))}

            </select>

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

                placeholder="Categoría de tu negocio…"

                disabled={businessCategories.length === 0}

                dropdownZIndex={210}

                useModalInput

              />

            </div>

            <p className={`mt-1 ${sellerHint}`}>

              Una sola por producto. Sale de las categorías que definiste en tu perfil.

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

                <select

                  id="catalog-product-currency"

                  value={baseCurrency}

                  onChange={(event) => setBaseCurrency(event.target.value)}

                  className={`mt-1.5 ${sellerModalInput}`}

                >

                  {currencies.map((currency) => (

                    <option key={currency.code} value={currency.code}>

                      {currency.label}

                    </option>

                  ))}

                </select>

              </div>

            </div>



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

                <input

                  type="checkbox"

                  checked={offersDelivery}

                  onChange={(event) => setOffersDelivery(event.target.checked)}

                  className={sellerCheckboxInput}

                />

                <span>

                  <span className="block text-sm font-semibold text-brand-green">Acepta domicilio</span>

                  <span className={sellerHint}>Puedes cambiarlo por producto.</span>

                </span>

              </label>



              <label className={sellerCheckboxRow}>

                <input

                  type="checkbox"

                  checked={viewOnly}

                  onChange={(event) => setViewOnly(event.target.checked)}

                  className={sellerCheckboxInput}

                />

                <span>

                  <span className="block text-sm font-semibold text-brand-green">Solo vista</span>

                  <span className={sellerHint}>Visible solo en el catálogo de tu tienda.</span>

                </span>

              </label>



              <label className={sellerCheckboxRow}>

                <input

                  type="checkbox"

                  checked={isAvailable}

                  onChange={(event) => setIsAvailable(event.target.checked)}

                  className={sellerCheckboxInput}

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


