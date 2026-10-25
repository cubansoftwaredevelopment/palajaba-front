import { useRef, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import LocationMapModal from '../components/seller/LocationMapModal'
import SellerBusinessAreaFields, {
  getBusinessAreaFromSelection,
} from '../components/seller/SellerBusinessAreaFields'
import SellerDeliveryZonesEditor from '../components/seller/SellerDeliveryZonesEditor'
import ProfileProgressBar from '../components/seller/ProfileProgressBar'
import SellerLocationPreview from '../components/seller/SellerLocationPreview'
import SellerProfileAvatarUpload from '../components/seller/SellerProfileAvatarUpload'
import SellerSection from '../components/seller/SellerSection'
import SellerSocialLinksEditor from '../components/seller/SellerSocialLinksEditor'
import {
  sellerAlertError,
  sellerBtnGhost,
  sellerBtnPrimary,
  sellerBtnSecondary,
  sellerEyebrow,
  sellerFormGrid,
  sellerFormFull,
  sellerFormActions,
  sellerPageWrap,
  sellerStickyBar,
  sellerSubtitle,
  sellerTextarea,
  sellerTitle,
} from '../components/seller/sellerStyles'
import {
  updateSellerProfile,
  uploadSellerProfilePhoto,
} from '../auth/api.js'
import { getUserFacingMessage } from '../lib/userFacingError'
import { IMAGE_UPLOAD_HINT, validateImageFile } from '../lib/imageUpload'
import { dedupeDeliveryAreas } from '../lib/businessArea'
import { getSellerToken, updateSellerProfileCache } from '../lib/sellerAuth'
import { socialLinksError, socialLinksFromProfile, socialLinksPayload } from '../lib/socialLinks'

export default function SellerCompleteProfile() {
  const navigate = useNavigate()
  const { profile, refreshProfile } = useOutletContext()
  const fileInputRef = useRef(null)

  const [photoUrl, setPhotoUrl] = useState(profile?.profile_photo_url ?? null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [location, setLocation] = useState(profile?.business_location ?? null)
  const [showMap, setShowMap] = useState(false)
  const [biography, setBiography] = useState(profile?.biography ?? '')
  const [socialLinks, setSocialLinks] = useState(() => socialLinksFromProfile(profile))
  const [businessProvinceId, setBusinessProvinceId] = useState(
    profile?.business_area?.province_id ?? '',
  )
  const [businessMunicipalityId, setBusinessMunicipalityId] = useState(
    profile?.business_area?.municipality_id ?? '',
  )
  const [deliveryAreas, setDeliveryAreas] = useState(profile?.delivery_areas ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

    const businessArea = getBusinessAreaFromSelection(businessProvinceId, businessMunicipalityId)
    if (!businessArea) {
      setError('Selecciona la provincia y el municipio de tu negocio.')
      return
    }
    const socialError = socialLinksError(socialLinks)
    if (socialError) {
      setError(socialError)
      return
    }

    setLoading(true)
    try {
      const token = getSellerToken()
      const payload = {
        biography: biography.trim() || null,
        social_links: socialLinksPayload(socialLinks),
        offers_delivery: deliveryAreas.length > 0,
        gestores_enabled: Boolean(profile?.gestores_enabled),
        business_area: businessArea,
        delivery_areas: dedupeDeliveryAreas(deliveryAreas, businessArea),
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
            location={Boolean(businessProvinceId && businessMunicipalityId)}
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
            <SellerSocialLinksEditor links={socialLinks} onChange={setSocialLinks} />
          </SellerSection>

          <SellerSection
            label="Zonas de venta"
            optional
            hint="Otros municipios donde entregas además del tuyo. Cada producto indica si acepta domicilio."
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
