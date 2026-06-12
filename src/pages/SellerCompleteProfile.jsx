import { useEffect, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import CategoryAutocomplete from '../components/seller/CategoryAutocomplete'
import LocationMapModal from '../components/seller/LocationMapModal'
import SellerBusinessAreaFields, {
  getBusinessAreaFromSelection,
} from '../components/seller/SellerBusinessAreaFields'
import SellerDeliveryZonesEditor from '../components/seller/SellerDeliveryZonesEditor'
import ProfileProgressBar from '../components/seller/ProfileProgressBar'
import SellerLocationPreview from '../components/seller/SellerLocationPreview'
import SellerProfileAvatarUpload from '../components/seller/SellerProfileAvatarUpload'
import SellerSection from '../components/seller/SellerSection'
import {
  sellerAlertError,
  sellerBtnGhost,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerChoice,
  sellerEyebrow,
  sellerFormGrid,
  sellerFormFull,
  sellerFormActions,
  sellerInput,
  sellerPageWrap,
  sellerStickyBar,
  sellerSubtitle,
  sellerTextarea,
  sellerTitle,
} from '../components/seller/sellerStyles'
import {
  fetchCategories,
  updateSellerProfile,
  uploadSellerProfilePhoto,
} from '../lib/api'
import { getUserFacingMessage } from '../lib/userFacingError'
import { IMAGE_UPLOAD_HINT, validateImageFile } from '../lib/imageUpload'
import { dedupeDeliveryAreas } from '../lib/businessArea'
import { getSellerToken, updateSellerProfileCache } from '../lib/sellerAuth'

export default function SellerCompleteProfile() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useOutletContext()
  const fileInputRef = useRef(null)

  const [categories, setCategories] = useState([])
  const [photoUrl, setPhotoUrl] = useState(profile?.profile_photo_url ?? null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [location, setLocation] = useState(profile?.business_location ?? null)
  const [showMap, setShowMap] = useState(false)
  const [biography, setBiography] = useState(profile?.biography ?? '')
  const [instagram, setInstagram] = useState(profile?.social_instagram ?? '')
  const [facebook, setFacebook] = useState(profile?.social_facebook ?? '')
  const [selectedCategories, setSelectedCategories] = useState(profile?.category_ids ?? [])
  const [businessProvinceId, setBusinessProvinceId] = useState(
    profile?.business_area?.province_id ?? '',
  )
  const [businessMunicipalityId, setBusinessMunicipalityId] = useState(
    profile?.business_area?.municipality_id ?? '',
  )
  const [deliveryAreas, setDeliveryAreas] = useState(profile?.delivery_areas ?? [])
  const [offersDelivery, setOffersDelivery] = useState(
    profile?.offers_delivery === null || profile?.offers_delivery === undefined
      ? null
      : profile.offers_delivery,
  )
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setCategoriesLoading(true)
    setCategoriesError('')

    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data)
      })
      .catch((err) => {
        if (!cancelled) setCategoriesError(getUserFacingMessage(err, 'No pudimos cargar las categorías.'))
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.ok) {
      setError(validation.message)
      return
    }

    setError('')
    setPhotoUploading(true)
    try {
      const token = getSellerToken()
      const updated = await uploadSellerProfilePhoto(token, file)
      setPhotoUrl(updated.profile_photo_url)
      updateSellerProfileCache(updated)
    } catch (err) {
      setError(getUserFacingMessage(err))
    } finally {
      setPhotoUploading(false)
      event.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!photoUrl) {
      setError('Sube una foto de perfil para continuar.')
      return
    }
    if (selectedCategories.length === 0) {
      setError('Selecciona al menos una categoría.')
      return
    }
    if (offersDelivery === null) {
      setError('Indica si haces domicilio.')
      return
    }

    const businessArea = getBusinessAreaFromSelection(businessProvinceId, businessMunicipalityId)
    if (!businessArea) {
      setError('Selecciona la provincia y el municipio de tu negocio.')
      return
    }

    setLoading(true)
    try {
      const token = getSellerToken()
      const payload = {
        biography: biography.trim() || null,
        social_instagram: instagram.trim() || null,
        social_facebook: facebook.trim() || null,
        category_ids: selectedCategories,
        offers_delivery: offersDelivery,
        business_area: businessArea,
        delivery_areas: offersDelivery
          ? dedupeDeliveryAreas(deliveryAreas, businessArea)
          : [],
        clear_business_location: !location,
      }
      if (location) payload.business_location = location

      await updateSellerProfile(token, payload)
      await refreshProfile()
      navigate('/tienda', { replace: true })
    } catch (err) {
      setError(getUserFacingMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const submitDisabled = loading || photoUploading

  const submitButton = (
    <button
      type="submit"
      form="seller-profile-form"
      disabled={submitDisabled}
      className={sellerBtnPrimary}
    >
      {loading ? 'Guardando…' : 'Entrar a mi tienda'}
    </button>
  )

  return (
    <>
      <section className={`animate-fade-in ${sellerPageWrap}`}>
        <p className={sellerEyebrow}>Configuración inicial</p>
        <h2 className={`mt-1 ${sellerTitle}`}>Cuéntanos sobre tu negocio</h2>
        <p className={sellerSubtitle}>
          Solo unos datos para activar tu tienda. Luego podrás subir productos.
        </p>

        <div className="mt-4">
          <ProfileProgressBar
            photo={Boolean(photoUrl)}
            categories={selectedCategories.length}
            location={Boolean(businessProvinceId && businessMunicipalityId)}
            delivery={offersDelivery}
          />
        </div>

        <form id="seller-profile-form" onSubmit={handleSubmit} className={`mt-4 ${sellerFormGrid}`} noValidate>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handlePhotoChange}
          />

          <SellerSection label="Foto de perfil" required>
            <div className="flex items-center gap-4">
              <SellerProfileAvatarUpload
                photoUrl={photoUrl}
                uploading={photoUploading}
                onSelectClick={() => fileInputRef.current?.click()}
                storeName={profile?.store_name}
              />
              <p className="text-[0.65rem] leading-relaxed text-brand-carmelita/70">
                {IMAGE_UPLOAD_HINT}
              </p>
            </div>
          </SellerSection>

          <SellerSection
            label="Provincia y municipio"
            required
            hint="Así te encontrarán los compradores de tu zona."
            className={sellerFormFull}
          >
            <SellerBusinessAreaFields
              provinceId={businessProvinceId}
              municipalityId={businessMunicipalityId}
              onProvinceChange={setBusinessProvinceId}
              onMunicipalityChange={setBusinessMunicipalityId}
            />
          </SellerSection>

          <SellerSection
            label="Ubicación en mapa"
            optional
            hint="Opcional: marca el punto exacto de tu negocio."
          >
            {location ? (
              <SellerLocationPreview location={location} />
            ) : null}
            <div className={`flex flex-col gap-1.5 ${location ? 'mt-3' : ''}`}>
              <button type="button" onClick={() => setShowMap(true)} className={sellerBtnSecondary}>
                {location ? 'Cambiar en mapa' : 'Abrir mapa'}
              </button>
              {location && (
                <button type="button" onClick={() => setLocation(null)} className={sellerBtnGhost}>
                  Quitar ubicación
                </button>
              )}
            </div>
          </SellerSection>

          <SellerSection label="Biografía" optional className={sellerFormFull}>
            <textarea
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Describe tu negocio en pocas palabras…"
              className={sellerTextarea}
            />
          </SellerSection>

          <SellerSection label="Redes sociales" optional className={sellerFormFull}>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-3">
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="Instagram · @tu_tienda"
                className={sellerInput}
                aria-label="Instagram"
              />
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="Facebook · tu página"
                className={sellerInput}
                aria-label="Facebook"
              />
            </div>
          </SellerSection>

          <SellerSection label="Categorías" required hint="Puedes elegir más de una." className={sellerFormFull}>
            {categoriesLoading && (
              <p className="text-xs text-brand-carmelita/80">Cargando categorías…</p>
            )}
            {categoriesError && (
              <p className={sellerAlertError} role="alert">
                {categoriesError}
              </p>
            )}
            {!categoriesLoading && !categoriesError && categories.length === 0 && (
              <p className="text-xs text-brand-carmelita/80">No hay categorías disponibles.</p>
            )}
            <CategoryAutocomplete
              id="seller-complete-profile-categories"
              categories={categories}
              value={selectedCategories}
              onChange={setSelectedCategories}
              multiple
              placeholder="Buscar y agregar categorías…"
              disabled={categoriesLoading || categories.length === 0}
            />
          </SellerSection>

          <SellerSection
            label="¿Haces domicilio?"
            required
            hint="Cada producto puede tener su propia opción de envío al subirlo."
            className={sellerFormFull}
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOffersDelivery(true)}
                className={sellerChoice(offersDelivery === true)}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => {
                  setOffersDelivery(false)
                  setDeliveryAreas([])
                }}
                className={sellerChoice(offersDelivery === false)}
              >
                No
              </button>
            </div>
          </SellerSection>

          {offersDelivery === true && (
            <SellerSection
              label="Zonas de envío"
              optional
              hint="Agrega otros municipios donde entregas además del tuyo."
              className={sellerFormFull}
            >
              <SellerDeliveryZonesEditor
                zones={deliveryAreas}
                businessArea={getBusinessAreaFromSelection(
                  businessProvinceId,
                  businessMunicipalityId,
                )}
                onChange={setDeliveryAreas}
              />
            </SellerSection>
          )}

          {error && (
            <p className={`${sellerFormFull} ${sellerAlertError}`} role="alert">
              {error}
            </p>
          )}

          <div className={`hidden sm:block ${sellerFormActions}`}>{submitButton}</div>
        </form>
      </section>

      {showMap && (
        <LocationMapModal
          initialLocation={location}
          onClose={() => setShowMap(false)}
          onConfirm={(value) => {
            setLocation(value)
            setShowMap(false)
          }}
        />
      )}

      <div className="sm:hidden">
        <div className={sellerStickyBar}>{submitButton}</div>
      </div>
    </>
  )
}
