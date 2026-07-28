import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import CategoryAutocomplete from '../../components/seller/CategoryAutocomplete'
import LoadingState from '../../components/ui/LoadingState'
import LocationMapModal from '../../components/seller/LocationMapModal'
import SellerBusinessAreaFields, {
  getBusinessAreaFromSelection,
} from '../../components/seller/SellerBusinessAreaFields'
import SellerDeliveryZonesEditor from '../../components/seller/SellerDeliveryZonesEditor'
import SellerLocationPreview from '../../components/seller/SellerLocationPreview'
import SellerAdvancedProfileSettings from '../../components/seller/SellerAdvancedProfileSettings'
import SellerFeedbackSection from '../../components/seller/SellerFeedbackSection'
import SellerProfileHeroCard from '../../components/seller/SellerProfileHeroCard'
import SellerProfileMenuList from '../../components/seller/SellerProfileMenuList'
import SellerSection from '../../components/seller/SellerSection'
import SellerSuccessAlert from '../../components/seller/SellerSuccessAlert'
import {
  sellerAlertError,
  sellerBtnGhost,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerCharCounter,
  sellerChoice,
  sellerFocusRing,
  sellerFormActions,
  sellerHint,
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
import { getUserFacingMessage } from '../../lib/userFacingError'
import { validateImageFile } from '../../lib/imageUpload'
import {
  dedupeDeliveryAreas,
  sameBusinessArea,
  sameDeliveryAreas,
} from '../../lib/businessArea'
import { beginSellerMarketplaceVisit } from '../../lib/sellerMarketplaceNav'
import {
  PROFILE_PANEL_IDS,
  closeProfilePanel,
  getProfileMenuSections,
  getProfilePanel,
  isProfileFormPanel,
  openProfilePanel,
  resolveProfileMenuAction,
} from '../../lib/sellerProfileHub'
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

function BackToHubButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-1 py-1 text-sm font-semibold text-brand-green touch-manipulation active:bg-brand-green/8 ${sellerFocusRing}`}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
          clipRule="evenodd"
        />
      </svg>
      Mi cuenta
    </button>
  )
}

export default function SellerProfile() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useOutletContext()
  const fileInputRef = useRef(null)
  const menuSections = useMemo(() => getProfileMenuSections(), [])

  const [activePanel, setActivePanel] = useState(null)
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
  const [gestoresEnabled, setGestoresEnabled] = useState(Boolean(profile?.gestores_enabled))
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
        if (!cancelled) setCategoriesError(getUserFacingMessage(err, 'No pudimos cargar las categorías.'))
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

  function goToHub() {
    setActivePanel(closeProfilePanel())
    setError('')
  }

  function handleMenuSelect(panelId) {
    const action = resolveProfileMenuAction(panelId)
    if (!action) return

    if (action.type === 'action' && action.panelId === PROFILE_PANEL_IDS.marketplace) {
      const path = beginSellerMarketplaceVisit(profile, '/tienda/perfil')
      navigate(path)
      return
    }

    setError('')
    setActivePanel(openProfilePanel(activePanel, action.panelId))
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
      setError(getUserFacingMessage(err))
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
        gestores_enabled: gestoresEnabled,
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
      setError(getUserFacingMessage(err))
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
      gestoresEnabled !== Boolean(profile.gestores_enabled) ||
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
    gestoresEnabled,
    selectedCategories,
    location,
    businessProvinceId,
    businessMunicipalityId,
    deliveryAreas,
  ])

  if (!profile) return null

  const submitDisabled = loading || photoUploading || !hasChanges
  const panelMeta = getProfilePanel(activePanel)
  const showFormSave = isProfileFormPanel(activePanel)

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

  const identityFields = (
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
  )

  const locationFields = (
    <>
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

      <SellerSection
        label="¿Usas gestores de venta?"
        hint="Si lo activas, podrás crear gestores y aparecerá la sección Gestores en tu panel."
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setGestoresEnabled(true)
              markDirty()
            }}
            className={sellerChoice(gestoresEnabled === true)}
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => {
              setGestoresEnabled(false)
              markDirty()
            }}
            className={sellerChoice(gestoresEnabled === false)}
          >
            No
          </button>
        </div>
      </SellerSection>
    </>
  )

  const categoriesFields = (
    <SellerSection label="Categorías" required>
      {categoriesLoading ? (
        <LoadingState variant="compact" size="sm" message="Cargando categorías…" className="!py-2" />
      ) : null}
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
  )

  const socialFields = (
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
  )

  function renderActivePanelBody() {
    switch (activePanel) {
      case PROFILE_PANEL_IDS.identity:
        return identityFields
      case PROFILE_PANEL_IDS.location:
        return locationFields
      case PROFILE_PANEL_IDS.categories:
        return categoriesFields
      case PROFILE_PANEL_IDS.social:
        return socialFields
      case PROFILE_PANEL_IDS.advanced:
        return <SellerAdvancedProfileSettings profile={profile} onUpdated={refreshProfile} embedded />
      case PROFILE_PANEL_IDS.feedback:
        return <SellerFeedbackSection embedded />
      default:
        return null
    }
  }

  return (
    <>
      <section className={`animate-fade-in ${sellerPageWrap}`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handlePhotoChange}
        />

        {!activePanel ? (
          <div className="-mx-4 -mt-4 sm:-mx-5 lg:-mx-8 lg:-mt-8">
            <header className="relative overflow-hidden bg-brand-green px-4 pb-16 pt-5 sm:px-5 sm:pt-6 lg:px-8">
              <div
                className="pointer-events-none absolute -right-10 -top-8 h-36 w-36 rounded-full bg-brand-yellow/20 blur-2xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-brand-white/10 blur-2xl"
                aria-hidden
              />
              <div className="relative mx-auto w-full max-w-md lg:max-w-3xl xl:max-w-4xl">
                <h2 className="font-display text-2xl font-bold text-brand-white sm:text-3xl">
                  Mi cuenta
                </h2>
                <p className="mt-1 text-sm text-brand-white/80">
                  Gestiona los datos de tu tienda
                </p>
              </div>
            </header>

            <div className="relative z-10 mx-auto w-full max-w-md -mt-12 px-4 pb-8 sm:px-5 lg:max-w-3xl lg:px-8 xl:max-w-4xl">
              <SellerSuccessAlert
                message={saved ? 'Cambios guardados correctamente.' : ''}
                onDismiss={() => setSaved(false)}
              />

              {error && !activePanel && (
                <p className={`mb-3 ${sellerAlertError}`} role="alert">
                  {error}
                </p>
              )}

              <SellerProfileHeroCard
                profile={profile}
                photoUrl={photoUrl}
                photoUploading={photoUploading}
                onPhotoClick={() => fileInputRef.current?.click()}
              />

              <div className="mt-5">
                <SellerProfileMenuList sections={menuSections} onSelect={handleMenuSelect} />
              </div>
            </div>
          </div>
        ) : (
          <div className={`${sellerSectionGap} animate-fade-in`}>
            <div className="flex flex-col gap-2">
              <BackToHubButton onClick={goToHub} />
              <div>
                <h2 className="font-display text-xl font-bold text-brand-green sm:text-2xl">
                  {panelMeta?.label}
                </h2>
                {panelMeta?.description ? (
                  <p className={`mt-1 ${sellerHint}`}>{panelMeta.description}</p>
                ) : null}
              </div>
            </div>

            <SellerSuccessAlert
              message={saved ? 'Cambios guardados correctamente.' : ''}
              onDismiss={() => setSaved(false)}
            />

            {showFormSave ? (
              <form
                id="seller-edit-profile-form"
                onSubmit={handleSubmit}
                className={`${sellerSectionGap} rounded-2xl border border-brand-green/12 bg-brand-white p-4 shadow-sm sm:p-5`}
                noValidate
              >
                {renderActivePanelBody()}

                {error && (
                  <p className={sellerAlertError} role="alert">
                    {error}
                  </p>
                )}

                <div className={sellerFormActions}>{submitButton}</div>
              </form>
            ) : (
              <div className="rounded-2xl border border-brand-green/12 bg-brand-white p-4 shadow-sm sm:p-5">
                {renderActivePanelBody()}
              </div>
            )}
          </div>
        )}
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
