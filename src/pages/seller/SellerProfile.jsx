import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import CategoryAutocomplete from '../../components/seller/CategoryAutocomplete'
import LocationMapModal from '../../components/seller/LocationMapModal'
import SellerBusinessAreaFields, {
  getBusinessAreaFromSelection,
} from '../../components/seller/SellerBusinessAreaFields'
import SellerDeliveryZonesEditor from '../../components/seller/SellerDeliveryZonesEditor'
import SellerLocationPreview from '../../components/seller/SellerLocationPreview'
import SellerPageHeader from '../../components/seller/SellerPageHeader'
import SellerProfileFieldGroup from '../../components/seller/SellerProfileFieldGroup'
import SellerProfileHeroCard from '../../components/seller/SellerProfileHeroCard'
import SellerSection from '../../components/seller/SellerSection'
import SellerSuccessAlert from '../../components/seller/SellerSuccessAlert'
import {
  sellerAlertError,
  sellerBtnGhost,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerCharCounter,
  sellerChoice,
  sellerFormActions,
  sellerInputBare,
  sellerInputPrefix,
  sellerInputPrefixWrap,
  sellerLabel,
  sellerPageWrap,
  sellerSectionGap,
  sellerTextarea,
} from '../../components/seller/sellerStyles'
import {
  fetchCategories,
  updateSellerProfile,
  uploadSellerProfilePhoto,
} from '../../lib/api'
import { validateImageFile } from '../../lib/imageUpload'
import {
  dedupeDeliveryAreas,
  sameBusinessArea,
  sameDeliveryAreas,
} from '../../lib/businessArea'
import { getSellerToken, updateSellerProfileCache } from '../../lib/sellerAuth'

const BIO_MAX = 500

function normalizeText(value) {
  return (value ?? '').trim()
}

function sameStringArray(a, b) {
  const left = [...(a ?? [])].sort()
  const right = [...(b ?? [])].sort()
  return left.length === right.length && left.every((item, index) => item === right[index])
}

function sameLocation(a, b) {
  if (!a && !b) return true
  if (!a || !b) return false
  return (
    a.lat === b.lat &&
    a.lng === b.lng &&
    normalizeText(a.label) === normalizeText(b.label)
  )
}

function SocialField({ id, label, prefix, value, onChange, placeholder }) {
  return (
    <div>
      <label htmlFor={id} className={sellerLabel}>
        {label}
      </label>
      <div className={`mt-1.5 ${sellerInputPrefixWrap}`}>
        {prefix && <span className={sellerInputPrefix}>{prefix}</span>}
        <input
          id={id}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={sellerInputBare}
        />
      </div>
    </div>
  )
}

export default function SellerProfile() {
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
  const [offersDelivery, setOffersDelivery] = useState(profile?.offers_delivery ?? false)
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    setCategoriesLoading(true)
    setCategoriesError('')

    fetchCategories()
      .then((data) => {
        if (!cancelled) setCategories(data)
      })
      .catch((err) => {
        if (!cancelled) setCategoriesError(err.message || 'No se pudieron cargar las categorías.')
      })
      .finally(() => {
        if (!cancelled) setCategoriesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  function markDirty() {
    setSaved(false)
  }

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
    markDirty()
    setPhotoUploading(true)
    try {
      const token = getSellerToken()
      const updated = await uploadSellerProfilePhoto(token, file)
      setPhotoUrl(updated.profile_photo_url)
      updateSellerProfileCache(updated)
      await refreshProfile()
    } catch (err) {
      setError(err.message)
    } finally {
      setPhotoUploading(false)
      event.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)

    if (!photoUrl) {
      setError('Sube una foto de perfil para continuar.')
      return
    }
    if (selectedCategories.length === 0) {
      setError('Selecciona al menos una categoría.')
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
      setSaved(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = useMemo(() => {
    if (!profile) return false

    return (
      normalizeText(biography) !== normalizeText(profile.biography) ||
      normalizeText(instagram) !== normalizeText(profile.social_instagram) ||
      normalizeText(facebook) !== normalizeText(profile.social_facebook) ||
      offersDelivery !== (profile.offers_delivery ?? false) ||
      !sameStringArray(selectedCategories, profile.category_ids) ||
      !sameLocation(location, profile.business_location) ||
      !sameBusinessArea(
        getBusinessAreaFromSelection(businessProvinceId, businessMunicipalityId),
        profile.business_area,
      ) ||
      !sameDeliveryAreas(
        offersDelivery ? deliveryAreas : [],
        profile.delivery_areas ?? [],
      )
    )
  }, [
    profile,
    biography,
    instagram,
    facebook,
    offersDelivery,
    selectedCategories,
    location,
    businessProvinceId,
    businessMunicipalityId,
    deliveryAreas,
  ])

  if (!profile) return null

  const submitDisabled = loading || photoUploading || !hasChanges

  const submitButton = (
    <button
      type="submit"
      form="seller-edit-profile-form"
      disabled={submitDisabled}
      className={sellerBtnPrimary}
    >
      {loading ? 'Guardando…' : 'Guardar cambios'}
    </button>
  )

  return (
    <>
      <section className={`animate-fade-in ${sellerPageWrap} ${sellerSectionGap}`}>
        <SellerPageHeader eyebrow="Perfil" title="Tu tienda" />

        <SellerSuccessAlert
          message={saved ? 'Cambios guardados correctamente.' : ''}
          onDismiss={() => setSaved(false)}
        />

        <SellerProfileHeroCard
          profile={profile}
          photoUrl={photoUrl}
          photoUploading={photoUploading}
          onPhotoClick={() => fileInputRef.current?.click()}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handlePhotoChange}
        />

        <form id="seller-edit-profile-form" onSubmit={handleSubmit} className={sellerSectionGap} noValidate>
          <SellerProfileFieldGroup title="Identidad">
            <SellerSection label="Biografía" optional>
              <textarea
                value={biography}
                onChange={(e) => {
                  setBiography(e.target.value)
                  markDirty()
                }}
                rows={4}
                maxLength={BIO_MAX}
                placeholder="Ej.: Panadería artesanal en el Vedado. Panes dulces y salados hechos cada mañana."
                className={sellerTextarea}
              />
              <p className={`mt-1.5 ${sellerCharCounter}`}>
                {biography.length}/{BIO_MAX}
              </p>
            </SellerSection>
          </SellerProfileFieldGroup>

          <SellerProfileFieldGroup title="Ubicación y entrega">
            <SellerSection
              label="Provincia y municipio"
              required
              hint="Así te encontrarán los compradores de tu zona."
            >
              <SellerBusinessAreaFields
                provinceId={businessProvinceId}
                municipalityId={businessMunicipalityId}
                onProvinceChange={(value) => {
                  setBusinessProvinceId(value)
                  markDirty()
                }}
                onMunicipalityChange={(value) => {
                  setBusinessMunicipalityId(value)
                  markDirty()
                }}
                provinceInputId="seller-profile-business-province"
                municipalityInputId="seller-profile-business-municipality"
              />
            </SellerSection>

            <SellerSection label="Ubicación en mapa" optional>
              {location && <SellerLocationPreview location={location} />}
              <div className={`flex flex-col gap-1.5 sm:flex-row sm:items-center ${location ? 'mt-3' : ''}`}>
                <button type="button" onClick={() => setShowMap(true)} className={sellerBtnSecondary}>
                  {location ? 'Cambiar en mapa' : 'Marcar en mapa'}
                </button>
                {location && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocation(null)
                      markDirty()
                    }}
                    className={sellerBtnGhost}
                  >
                    Quitar ubicación
                  </button>
                )}
              </div>
            </SellerSection>

            <SellerSection label="¿Haces domicilio?" required>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOffersDelivery(true)
                    markDirty()
                  }}
                  className={sellerChoice(offersDelivery === true)}
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOffersDelivery(false)
                    setDeliveryAreas([])
                    markDirty()
                  }}
                  className={sellerChoice(offersDelivery === false)}
                >
                  No
                </button>
              </div>
            </SellerSection>

            {offersDelivery && (
              <SellerSection
                label="Zonas de envío"
                optional
                hint="Otros municipios donde entregas además del tuyo."
              >
                <SellerDeliveryZonesEditor
                  zones={deliveryAreas}
                  businessArea={getBusinessAreaFromSelection(
                    businessProvinceId,
                    businessMunicipalityId,
                  )}
                  onChange={(zones) => {
                    setDeliveryAreas(zones)
                    markDirty()
                  }}
                  idPrefix="seller-profile-delivery"
                />
              </SellerSection>
            )}
          </SellerProfileFieldGroup>

          <SellerProfileFieldGroup title="Clasificación">
            <SellerSection label="Categorías" required>
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
                id="seller-profile-categories"
                categories={categories}
                value={selectedCategories}
                onChange={(nextIds) => {
                  markDirty()
                  setSelectedCategories(nextIds)
                }}
                multiple
                placeholder="Buscar y agregar categorías…"
                disabled={categoriesLoading || categories.length === 0}
              />
            </SellerSection>
          </SellerProfileFieldGroup>

          <SellerProfileFieldGroup title="Redes sociales">
            <SellerSection optional>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <SocialField
                  id="profile-instagram"
                  label="Instagram"
                  prefix="@"
                  value={instagram}
                  onChange={(e) => {
                    setInstagram(e.target.value)
                    markDirty()
                  }}
                  placeholder="tu_tienda"
                />
                <SocialField
                  id="profile-facebook"
                  label="Facebook"
                  value={facebook}
                  onChange={(e) => {
                    setFacebook(e.target.value)
                    markDirty()
                  }}
                  placeholder="Nombre de tu página"
                />
              </div>
            </SellerSection>
          </SellerProfileFieldGroup>

          {error && (
            <p className={sellerAlertError} role="alert">
              {error}
            </p>
          )}

          <div className={sellerFormActions}>{submitButton}</div>
        </form>
      </section>

      {showMap && (
        <LocationMapModal
          initialLocation={location}
          onClose={() => setShowMap(false)}
          onConfirm={(value) => {
            setLocation(value)
            setShowMap(false)
            markDirty()
          }}
        />
      )}
    </>
  )
}
