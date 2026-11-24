import { useEffect, useMemo, useRef, useState } from 'react'
import { useSectionSnapshot } from '../../session/useSectionSnapshot'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { useStepShift } from '../../motion/SellerPageMotion'
import LocationMapModal from '../componentes/LocationMapModal.jsx'
import SellerBusinessAreaFields, {
  getBusinessAreaFromSelection,
} from '../componentes/SellerBusinessAreaFields.jsx'
import SellerDeliveryZonesEditor from '../componentes/SellerDeliveryZonesEditor.jsx'
import SellerLocationPreview from '../componentes/SellerLocationPreview.jsx'
import SellerAdvancedProfileSettings from '../componentes/SellerAdvancedProfileSettings.jsx'
import SellerAdvertisingPlans from '../componentes/SellerAdvertisingPlans.jsx'
import SellerStoreBanners from '../componentes/SellerStoreBanners.jsx'
import SellerStorePages from '../componentes/SellerStorePages.jsx'
import SellerUpgradePlan from '../../subscriptions/componentes/SellerUpgradePlan.jsx'
import SellerQvaPaySettings from '../componentes/SellerQvaPaySettings.jsx'
import { useSellerReadOnly } from '../componentes/sellerReadOnly.js'
import ConfirmModal from '../../shared/componentes/ConfirmModal.jsx'
import SellerProfileHeroCard from '../componentes/SellerProfileHeroCard.jsx'
import SellerProfileMenuList from '../componentes/SellerProfileMenuList.jsx'
import SellerSection from '../componentes/SellerSection.jsx'
import SellerSocialLinksEditor from '../componentes/SellerSocialLinksEditor.jsx'
import SellerSuccessAlert from '../componentes/SellerSuccessAlert.jsx'
import {
  sellerBtnPrimary,
  sellerCharCounter,
  sellerChoice,
  sellerFocusRing,
  sellerFormActions,
  sellerHint,
  sellerLabel,
  sellerPageWrap,
  sellerSectionGap,
  sellerTextarea,
} from '../componentes/sellerStyles.js'
import {
  dismissSellerQvaPayPrompt,
  fetchSellerQvaPayAccount,
  updateSellerProfile,
  uploadSellerProfilePhoto,
} from '../../auth/api.js'
import CustomerQvaPayPrompt from '../../customer/componentes/CustomerQvaPayPrompt.jsx'
import { resolveUserFacingError } from '../../shared/utils/userFacingError.js'
import SellerNotificationToast from '../componentes/SellerNotificationToast.jsx'
import { validateImageFile } from '../../shared/utils/imageUpload.js'
import {
  dedupeDeliveryAreas,
  sameBusinessArea,
  sameDeliveryAreas,
} from '../../shared/utils/businessArea.js'
import {
  socialLinksError,
  socialLinksFromProfile,
  socialLinksPayload,
  socialLinksSignature,
} from '../utils/socialLinks.js'
import {
  PROFILE_PANEL_IDS,
  closeProfilePanel,
  getProfileMenuSections,
  getProfilePanel,
  isProfileFormPanel,
  isProfileHubPanel,
  openProfilePanel,
  resolveProfileMenuAction,
} from '../utils/sellerProfileHub.js'
import { getSellerToken, updateSellerProfileCache } from '../utils/sellerAuth.js'
import { storePageHasContent } from '../utils/storePages.js'
import Button from '../../shared/componentes/Button.jsx'

const BIO_MAX = 500

function normalizeText(value) {
  return (value ?? '').trim()
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

function releaseSellerScroll(scroller) {
  let node = scroller
  while (node) {
    const overflowY = getComputedStyle(node).overflowY
    if ((overflowY === 'hidden' || overflowY === 'clip') && node.scrollTop) node.scrollTop = 0
    node = node.parentElement
  }
  scroller?.scrollTo({ top: 0 })
}

export default function SellerProfile() {
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const { reduced, shift } = useStepShift()
  const stepClass = reduced ? '' : 'screen-step'
  const { profile, refreshProfile } = useOutletContext()
  const readOnly = useSellerReadOnly()
  const fileInputRef = useRef(null)
  const menuSections = useMemo(() => getProfileMenuSections(profile), [profile])

  const { snapshot: panelSnapshot, commit: commitPanel } = useSectionSnapshot('seller', 'profile-panel')
  const { snapshot: qvaSnapshot, commit: commitQva } = useSectionSnapshot('seller', 'profile-qvapay')
  const cachedQva = qvaSnapshot?.data
  const [activePanel, setActivePanel] = useState(panelSnapshot?.data ?? null)
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
  const [gestoresEnabled, setGestoresEnabled] = useState(Boolean(profile?.gestores_enabled))
  const [loading, setLoading] = useState(false)
  const [errorToast, setErrorToast] = useState(null)
  const [saved, setSaved] = useState(false)
  const [setupNotices, setSetupNotices] = useState([])
  const [qvapayConfigured, setQvapayConfigured] = useState(Boolean(cachedQva?.configured))
  const [qvapayPromptDismissed, setQvapayPromptDismissed] = useState(Boolean(cachedQva?.dismissed))
  const [qvapayAccountLoaded, setQvapayAccountLoaded] = useState(Boolean(cachedQva))
  const [qvapayPromptHeld, setQvapayPromptHeld] = useState(false)
  const [policyWarningDismissed, setPolicyWarningDismissed] = useState(false)
  const setupWarningShownRef = useRef(false)
  const missingStorePolicies = Boolean(profile)
    && !storePageHasContent(profile.store_pages?.delivery_policy)
    && !storePageHasContent(profile.store_pages?.terms)
  if ((!qvapayConfigured || !missingStorePolicies) && policyWarningDismissed) {
    setPolicyWarningDismissed(false)
  }
  const showPolicyWarning = qvapayConfigured && missingStorePolicies && !policyWarningDismissed && setupNotices.length === 0
  const showQvaPayPrompt = qvapayAccountLoaded && !qvapayConfigured && !qvapayPromptDismissed && !qvapayPromptHeld && setupNotices.length === 0 && !showPolicyWarning

  useEffect(() => {
    commitPanel(activePanel)
  }, [activePanel, commitPanel])

  const qvaReadyRef = useRef(Boolean(cachedQva))
  useEffect(() => {
    if (!cachedQva) return
    setQvapayConfigured(Boolean(cachedQva.configured))
    setQvapayPromptDismissed(Boolean(cachedQva.dismissed))
    setQvapayAccountLoaded(true)
  }, [cachedQva])

  useEffect(() => {
    if (!profile || qvaReadyRef.current) return undefined
    let active = true
    fetchSellerQvaPayAccount(getSellerToken())
      .then((account) => {
        if (!active) return
        const next = {
          username: account?.username || '',
          verified: Boolean(account?.verified),
          configured: Boolean(String(account?.username || '').trim()),
          dismissed: Boolean(account?.prompt_dismissed),
        }
        setQvapayConfigured(next.configured)
        setQvapayPromptDismissed(next.dismissed)
        setQvapayAccountLoaded(true)
        qvaReadyRef.current = true
        commitQva(next)
      })
      .catch(() => {
        if (!active) return
        setQvapayConfigured(false)
        setQvapayAccountLoaded(false)
      })
    return () => {
      active = false
    }
  }, [profile])

  useEffect(() => {
    if (!profile || setupWarningShownRef.current) return undefined
    let active = true

    async function collectNotices() {
      const notices = []
      if (!String(profile.email || '').trim()) {
        notices.push({
          id: 'email',
          title: 'Agrega un correo electrónico',
          description: 'Tu cuenta no tiene un correo electrónico configurado. Ve a Perfil avanzado y agrega tu correo para poder recuperar el acceso a tu cuenta si lo necesitas.',
          action: 'Ir a Perfil avanzado',
          panel: PROFILE_PANEL_IDS.advanced,
        })
      }
      if (!active || setupWarningShownRef.current || !notices.length) return
      setupWarningShownRef.current = true
      setSetupNotices(notices)
    }

    collectNotices()
    return () => {
      active = false
    }
  }, [profile])

  async function finishQvaPayPrompt(dismissForever) {
    setQvapayPromptHeld(true)
    if (!dismissForever) return
    try {
      await dismissSellerQvaPayPrompt(getSellerToken())
      setQvapayPromptDismissed(true)
    } catch (err) {
      showCaughtError(err)
    }
  }

  function showFormError(message, title = 'Revisa los datos') {
    if (!message) {
      setErrorToast(null)
      return
    }
    setErrorToast({
      id: `${Date.now()}`,
      tone: 'error',
      title,
      content: message,
    })
  }

  function showCaughtError(err) {
    const resolved = resolveUserFacingError(err)
    showFormError(resolved.message, resolved.title || 'Algo salió mal')
  }

  useEffect(() => {
    const requested = routeLocation?.state?.panel
    if (!requested || !isProfileHubPanel(requested)) return
    setActivePanel(openProfilePanel(null, requested))
    navigate('.', { replace: true, state: null })
  }, [routeLocation, navigate])

  function markDirty() {
    setSaved(false)
  }

  function goToHub() {
    setActivePanel(closeProfilePanel())
    showFormError('')
  }

  function handleMenuSelect(panelId) {
    const action = resolveProfileMenuAction(panelId)
    if (!action) return

    setActivePanel(openProfilePanel(activePanel, action.panelId))
    showFormError('')
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.ok) {
      showFormError(validation.message)
      return
    }

    showFormError('')
    markDirty()
    setPhotoUploading(true)
    try {
      const token = getSellerToken()
      const updated = await uploadSellerProfilePhoto(token, file)
      setPhotoUrl(updated.profile_photo_url)
      updateSellerProfileCache(updated)
      await refreshProfile()
    } catch (err) {
      showCaughtError(err)
    } finally {
      setPhotoUploading(false)
      event.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    showFormError('')
    setSaved(false)

    if (!photoUrl) {
      showFormError('Sube una foto de perfil para continuar.')
      return
    }
    const businessArea = getBusinessAreaFromSelection(businessProvinceId, businessMunicipalityId)
    if (!businessArea) {
      showFormError('Selecciona la provincia y el municipio de tu negocio.')
      return
    }
    const socialError = socialLinksError(socialLinks)
    if (socialError) {
      showFormError(socialError)
      return
    }

    setLoading(true)
    try {
      const token = getSellerToken()
      const payload = {
        biography: biography.trim() || null,
        social_links: socialLinksPayload(socialLinks),
        offers_delivery: deliveryAreas.length > 0,
        gestores_enabled: gestoresEnabled,
        business_area: businessArea,
        delivery_areas: dedupeDeliveryAreas(deliveryAreas, businessArea),
        clear_business_location: !location,
      }
      if (location) payload.business_location = location

      await updateSellerProfile(token, payload)
      await refreshProfile()
      setSaved(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      showCaughtError(err)
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = useMemo(() => {
    if (!profile) return false

    return (
      normalizeText(biography) !== normalizeText(profile.biography) ||
      socialLinksSignature(socialLinks) !== socialLinksSignature(socialLinksFromProfile(profile)) ||
      gestoresEnabled !== Boolean(profile.gestores_enabled) ||
      !sameLocation(location, profile.business_location) ||
      !sameBusinessArea(
        getBusinessAreaFromSelection(businessProvinceId, businessMunicipalityId),
        profile.business_area,
      ) ||
      !sameDeliveryAreas(deliveryAreas, profile.delivery_areas ?? [])
    )
  }, [
    profile,
    biography,
    socialLinks,
    gestoresEnabled,
    location,
    businessProvinceId,
    businessMunicipalityId,
    deliveryAreas,
  ])

  if (!profile) return null

  const submitDisabled = readOnly || loading || photoUploading || !hasChanges
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
    <div>
      <p className={`mb-2.5 ${sellerLabel}`}>
        <span className="underline decoration-brand-carmelita/80 underline-offset-4">Biografía</span>
        <span className="ml-1.5 font-normal text-brand-carmelita/70">(opcional)</span>
      </p>
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
        aria-label="Biografía"
      />
      <p className={`mt-1.5 ${sellerCharCounter}`}>
        {biography.length}/{BIO_MAX}
      </p>
    </div>
  )

  const locationIconButton =
    `grid h-10 w-10 shrink-0 place-items-center rounded-full border border-brand-green/20 bg-brand-white text-brand-green touch-manipulation active:bg-brand-yellow/15 disabled:opacity-50 ${sellerFocusRing}`
  const locationSaveButton =
    `grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-green text-brand-white touch-manipulation active:scale-95 disabled:opacity-50 ${sellerFocusRing}`

  const locationActions = (
    <div className="flex items-center justify-center gap-2">
      {location ? (
        <button
          type="button"
          onClick={() => {
            setLocation(null)
            markDirty()
          }}
          className={`${locationIconButton} text-brand-carmelita`}
          aria-label="Quitar ubicación"
          title="Quitar ubicación"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 7h16" />
            <path d="M9 7V5h6v2" />
            <path d="M7 7l1 12h8l1-12" />
          </svg>
        </button>
      ) : null}
      <button
        type="button"
        onClick={() => setShowMap(true)}
        className={locationIconButton}
        aria-label={location ? 'Cambiar en mapa' : 'Marcar en mapa'}
        title={location ? 'Cambiar en mapa' : 'Marcar en mapa'}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      </button>
      {readOnly ? null : (
        <button
          type="submit"
          form="seller-edit-profile-form"
          disabled={submitDisabled}
          className={locationSaveButton}
          aria-label={loading ? 'Guardando' : 'Guardar cambios'}
          title={loading ? 'Guardando' : 'Guardar cambios'}
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </button>
      )}
    </div>
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
        {location && (
          <SellerLocationPreview
            location={location}
            footer={locationActions}
          />
        )}
        {location ? null : <div className="flex justify-center">{locationActions}</div>}
      </SellerSection>

      <SellerSection
        label="Zonas de venta"
        optional
        hint="Otros municipios donde entregas además del tuyo. Cada producto indica si acepta domicilio."
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
    </>
  )

  const gestoresFields = (
    <SellerSection
      label="¿Usas gestores de venta?"
      hint="Si lo activas, podrás crear gestores y aparecerá la sección Gestores en tu panel. El plan Básico permite 10, Prueba y Pro hasta 25, y Premium es ilimitado."
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
  )

  const socialFields = (
    <SellerSocialLinksEditor
      links={socialLinks}
      onChange={(nextLinks) => {
        setSocialLinks(nextLinks)
        markDirty()
      }}
    />
  )

  function renderActivePanelBody() {
    switch (activePanel) {
      case PROFILE_PANEL_IDS.identity:
        return identityFields
      case PROFILE_PANEL_IDS.location:
        return locationFields
      case PROFILE_PANEL_IDS.social:
        return socialFields
      case PROFILE_PANEL_IDS.gestores:
        return gestoresFields
      case PROFILE_PANEL_IDS.advanced:
        return <SellerAdvancedProfileSettings profile={profile} onUpdated={refreshProfile} embedded readOnly={readOnly} />
      case PROFILE_PANEL_IDS.advertising:
        return <SellerAdvertisingPlans profile={profile} readOnly={readOnly} />
      case PROFILE_PANEL_IDS.plan:
        return <SellerUpgradePlan profile={profile} onUpdated={refreshProfile} />
      case PROFILE_PANEL_IDS.banners:
        return <SellerStoreBanners profile={profile} onUpdated={refreshProfile} readOnly={readOnly} />
      case PROFILE_PANEL_IDS.storeContent:
        return <SellerStorePages profile={profile} onUpdated={refreshProfile} readOnly={readOnly} />
      case PROFILE_PANEL_IDS.payments:
        return <SellerQvaPaySettings onUpdated={refreshProfile} readOnly={readOnly} />
      default:
        return null
    }
  }

  return (
    <>
      {setupNotices.length === 1 ? (
        <ConfirmModal
          title={setupNotices[0].title}
          description={setupNotices[0].description}
          confirmLabel={setupNotices[0].action}
          cancelLabel={null}
          icon={<span className="text-3xl" aria-hidden="true">⚠️</span>}
          onClose={() => setSetupNotices([])}
          onConfirm={() => {
            const panel = setupNotices[0].panel
            setSetupNotices([])
            setActivePanel(openProfilePanel(null, panel))
          }}
        />
      ) : null}
      <CustomerQvaPayPrompt
        open={showQvaPayPrompt && !readOnly}
        description="Agrega y verifica tu usuario de QvaPay en tu perfil para poder recibir pagos."
        addLabel="Ir al perfil"
        onAddUser={() => {
          setQvapayPromptHeld(true)
          setActivePanel(openProfilePanel(null, PROFILE_PANEL_IDS.payments))
          window.requestAnimationFrame(() => {
            const scroller = document.querySelector('.seller-scroll')
            releaseSellerScroll(scroller)
          })
        }}
        onDone={(dismissForever) => { void finishQvaPayPrompt(dismissForever) }}
      />
      {showPolicyWarning ? (
        <ConfirmModal
          title="Publica las condiciones de tu tienda"
          description="Tu tienda ya tiene usuario QvaPay y todavía no tiene la política de entrega ni los términos y condiciones. Publícalos en Servicio al cliente para que el comprador pueda aceptarlos al comprar."
          confirmLabel="Ir a Servicio al cliente"
          cancelLabel={null}
          icon={<span className="text-3xl" aria-hidden="true">⚠️</span>}
          onClose={() => setPolicyWarningDismissed(true)}
          onConfirm={() => {
            setPolicyWarningDismissed(true)
            setActivePanel(openProfilePanel(null, PROFILE_PANEL_IDS.storeContent))
          }}
        />
      ) : null}
      {setupNotices.length > 1 ? (
        <ConfirmModal
          title="Completa tu tienda"
          description="Hay datos pendientes para que tu cuenta y tus ventas queden listas."
          confirmLabel={null}
          cancelLabel="Ahora no"
          icon={<span className="text-3xl" aria-hidden="true">⚠️</span>}
          onClose={() => setSetupNotices([])}
        >
          {setupNotices.map((notice) => (
            <div key={notice.id} className="rounded-2xl border border-brand-green/10 bg-brand-green/[0.04] px-3 py-3 text-left">
              <p className="text-sm font-semibold text-brand-green">{notice.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-brand-carmelita/80">{notice.description}</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={() => {
                  setSetupNotices([])
                  setActivePanel(openProfilePanel(null, notice.panel))
                }}
              >
                {notice.action}
              </Button>
            </div>
          ))}
        </ConfirmModal>
      ) : null}
      <section
        className={`relative ${
          activePanel === PROFILE_PANEL_IDS.banners ? 'w-full' : sellerPageWrap
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={readOnly}
          onChange={handlePhotoChange}
        />

        <AnimatePresence mode="popLayout" initial={false}>
        {!activePanel ? (
          <motion.div key="hub" className={`-mx-4 -mt-4 w-[calc(100%+2rem)] sm:-mx-5 sm:w-[calc(100%+2.5rem)] lg:-mx-8 lg:-mt-8 lg:w-[calc(100%+4rem)] ${stepClass}`} {...shift}>
            <header className="relative overflow-hidden bg-brand-green px-4 pb-16 pt-5 sm:px-5 sm:pt-6 lg:px-8">
              <div
                className="pointer-events-none absolute -right-10 -top-8 h-36 w-36 rounded-full bg-brand-yellow/20 blur-2xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-brand-white/10 blur-2xl"
                aria-hidden
              />
              <div className="relative mx-auto w-full max-w-md text-center lg:max-w-3xl xl:max-w-4xl">
                <h2 className="font-script text-7xl leading-[1.05] text-brand-white sm:text-8xl">
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

              <SellerProfileHeroCard
                profile={profile}
                photoUrl={photoUrl}
                photoUploading={photoUploading}
                onPhotoClick={() => {
                  if (!readOnly) fileInputRef.current?.click()
                }}
                onUpgradeClick={() => handleMenuSelect(PROFILE_PANEL_IDS.plan)}
              />

              <div className="mt-5">
                <SellerProfileMenuList sections={menuSections} onSelect={handleMenuSelect} />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key={activePanel} className={`${sellerSectionGap} ${stepClass}`} {...shift}>
            <div className="flex flex-col gap-2">
              <BackToHubButton onClick={goToHub} />
              <div className="text-center">
                <h2 className="font-script text-7xl leading-[1.05] text-brand-carmelita sm:text-8xl">
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
                <fieldset disabled={readOnly} className="min-w-0 border-0 p-0">
                  {renderActivePanelBody()}
                </fieldset>

                {readOnly || activePanel === PROFILE_PANEL_IDS.location ? null : (
                  <div className={sellerFormActions}>{submitButton}</div>
                )}
              </form>
            ) : (
              <div className="rounded-2xl border border-brand-green/12 bg-brand-white p-4 shadow-sm sm:p-5">
                {renderActivePanelBody()}
              </div>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </section>

      <SellerNotificationToast
        toast={errorToast}
        aboveNav
        onDone={(id) => setErrorToast((current) => (current?.id === id ? null : current))}
      />

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
