import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { startCustomerEmailOtp, startCustomerPhoneOtp, confirmCustomerContactOtp, updateCustomerIdentityCard, uploadCustomerPhoto, dismissCustomerQvaPayPrompt, deleteCustomerAccount } from '../api.js'
import { clearCustomerSession, updateCustomerProfile } from '../utils/customerAuth.js'
import { normalizedPhoneDigits, sectionClass } from '../utils/constants.js'
import { resolveMediaUrl } from '../../shared/utils/media.js'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'
import { useFormErrorToast } from '../../shared/componentes/useFormErrorToast.jsx'
import { IMAGE_TOO_LARGE_MESSAGE, prepareUploadImage } from '../../shared/utils/imageUpload.js'
import AccountDeleteModal from '../../shared/componentes/AccountDeleteModal.jsx'
import SellerLogoutModal from '../../seller/componentes/SellerLogoutModal.jsx'
import CustomerQvaPayPrompt from '../componentes/CustomerQvaPayPrompt.jsx'
import CustomerQvaPaySettings from '../componentes/CustomerQvaPaySettings.jsx'
import { useCustomerAccount } from '../context/CustomerAccountContext.jsx'

function contactDraftFromProfile(profile) {
  return {
    email: profile?.email || '',
    phone: profile?.phone || '',
    identity_card: profile?.identity_card || '',
  }
}

function releaseClippedScroll(from) {
  let node = from?.parentElement || null
  while (node) {
    const overflowY = getComputedStyle(node).overflowY
    if ((overflowY === 'hidden' || overflowY === 'clip') && node.scrollTop) node.scrollTop = 0
    node = node.parentElement
  }
}

function revealAccountSection(id) {
  window.requestAnimationFrame(() => {
    const target = document.getElementById(id)
    if (!target) return
    releaseClippedScroll(target)
    let scroller = target.parentElement
    while (scroller && scroller !== document.documentElement) {
      const overflowY = getComputedStyle(scroller).overflowY
      if (overflowY === 'auto' || overflowY === 'scroll') break
      scroller = scroller.parentElement
    }
    if (!scroller || scroller === document.documentElement) return
    const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 16
    scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  })
}

export default function CustomerProfilePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { token, profile, setProfile, setError } = useCustomerAccount()
  const [qvaPayPromptHeld, setQvaPayPromptHeld] = useState(() => Boolean(location.state?.focusQvaPay))
  const [contactDraft, setContactDraft] = useState(() => contactDraftFromProfile(profile))
  const [contactChallenge, setContactChallenge] = useState(null)
  const [contactCode, setContactCode] = useState('')
  const [contactLoading, setContactLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const { showError, toastNode } = useFormErrorToast()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const serverContact = useRef(null)

  useEffect(() => {
    if (!profile) return
    const next = contactDraftFromProfile(profile)
    const previous = serverContact.current
    serverContact.current = next
    if (!previous) {
      setContactDraft(next)
      return
    }
    setContactDraft((current) => ({
      email: current.email === previous.email ? next.email : current.email,
      phone: current.phone === previous.phone ? next.phone : current.phone,
      identity_card: current.identity_card === previous.identity_card ? next.identity_card : current.identity_card,
    }))
  }, [profile])

  useEffect(() => {
    if (!location.state?.focusQvaPay) return undefined
    revealAccountSection('cuenta-qvapay')
    return undefined
  }, [location.state])

  const showQvaPayPrompt = Boolean(profile) && !profile.qvapay_username && !profile.qvapay_prompt_dismissed && !qvaPayPromptHeld

  async function finishQvaPayPrompt(dismissForever) {
    setQvaPayPromptHeld(true)
    if (!dismissForever) return
    try {
      await dismissCustomerQvaPayPrompt(token)
      const next = { ...profile, qvapay_prompt_dismissed: true }
      setProfile(next)
      updateCustomerProfile(next)
    } catch (cause) {
      setProfileError(getUserFacingMessage(cause, 'No pudimos guardar tu preferencia.'))
    }
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || photoUploading) return
    const prepared = await prepareUploadImage(file)
    if (!prepared.ok) {
      if (prepared.message === IMAGE_TOO_LARGE_MESSAGE) showError(prepared.message)
      else setError(prepared.message)
      return
    }
    setPhotoUploading(true)
    setError('')
    try {
      const next = await uploadCustomerPhoto(token, prepared.file)
      setProfile(next)
      updateCustomerProfile(next)
    } catch (cause) {
      const message = getUserFacingMessage(cause, 'No pudimos actualizar la foto.')
      if (String(message).includes('pesa demasiado')) showError(IMAGE_TOO_LARGE_MESSAGE)
      else setError(message)
    } finally {
      setPhotoUploading(false)
    }
  }

  async function startContactChange(kind) {
    setContactLoading(true)
    setProfileError('')
    setProfileMessage('')
    try {
      const result = kind === 'email'
        ? await startCustomerEmailOtp(token, contactDraft.email.trim().toLowerCase())
        : await startCustomerPhoneOtp(token, contactDraft.phone)
      if (result.otp_bypassed) {
        const updated = await confirmCustomerContactOtp(token, result.challenge_id, '000000')
        setProfile(updated)
        setContactDraft((current) => ({ ...current, email: updated.email, phone: updated.phone, identity_card: updated.identity_card }))
        updateCustomerProfile(updated)
        setProfileMessage(kind === 'email' ? 'Correo actualizado.' : 'Teléfono actualizado.')
      } else {
        setContactChallenge({ id: result.challenge_id, kind })
        setContactCode('')
        setProfileMessage(result.message)
      }
    } catch (cause) {
      setProfileError(getUserFacingMessage(cause, 'No pudimos iniciar la verificación.'))
    } finally { setContactLoading(false) }
  }

  async function confirmContactChange(event) {
    event.preventDefault()
    setContactLoading(true)
    setProfileError('')
    try {
      const updated = await confirmCustomerContactOtp(token, contactChallenge.id, contactCode)
      setProfile(updated)
      setContactDraft((current) => ({ ...current, email: updated.email, phone: updated.phone, identity_card: updated.identity_card }))
      updateCustomerProfile(updated)
      setContactChallenge(null)
      setContactCode('')
      setProfileMessage(contactChallenge.kind === 'email' ? 'Correo verificado y actualizado.' : 'Teléfono verificado y actualizado.')
    } catch (cause) {
      setProfileError(getUserFacingMessage(cause, 'No pudimos verificar el código.'))
    } finally { setContactLoading(false) }
  }

  async function saveIdentityCard(event) {
    event.preventDefault()
    setContactLoading(true)
    setProfileError('')
    setProfileMessage('')
    try {
      const updated = await updateCustomerIdentityCard(token, contactDraft.identity_card)
      setProfile(updated)
      setContactDraft((current) => ({ ...current, identity_card: updated.identity_card }))
      updateCustomerProfile(updated)
      setProfileMessage('Carnet actualizado.')
    } catch (cause) {
      setProfileError(getUserFacingMessage(cause, 'No pudimos actualizar el carnet.'))
    } finally { setContactLoading(false) }
  }

  function logout() {
    clearCustomerSession()
    navigate('/', { replace: true })
  }

  async function confirmDeleteAccount() {
    if (!token || deleteLoading) return
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deleteCustomerAccount(token)
      clearCustomerSession()
      navigate('/', { replace: true })
    } catch (cause) {
      setDeleteError(getUserFacingMessage(cause, 'No pudimos eliminar la cuenta.'))
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!profile) return null

  return (
    <>
      {toastNode}
      <CustomerQvaPayPrompt
        open={showQvaPayPrompt}
        onAddUser={() => {
          setQvaPayPromptHeld(true)
          revealAccountSection('cuenta-qvapay')
        }}
        onDone={(dismissForever) => { void finishQvaPayPrompt(dismissForever) }}
      />
      <section className={`${sectionClass} relative isolate overflow-hidden`}>
        <div className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-brand-yellow/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-brand-green/15 blur-3xl" aria-hidden="true" />
        <div className="relative z-10">
          <h2 className="mb-4 font-script text-3xl leading-[1.15] text-brand-carmelita">Mi perfil</h2>
          <div className="flex items-center gap-4">
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <label className={`group relative block h-20 w-20 shrink-0 rounded-full ${photoUploading ? 'cursor-wait' : 'cursor-pointer'}`} aria-label="Cambiar foto de perfil">
                {profile.profile_photo_url ? (
                  <img src={resolveMediaUrl(profile.profile_photo_url)} alt="Foto de perfil" className="h-20 w-20 rounded-full object-cover ring-2 ring-white shadow-lg" />
                ) : (
                  <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-yellow/35 text-2xl font-bold text-brand-green ring-2 ring-white shadow-lg">
                    {profile.full_name?.[0]}
                  </span>
                )}
                <span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-brand-green text-white shadow-md transition group-hover:bg-brand-carmelita">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                </span>
                <input type="file" accept="image/*" className="sr-only" disabled={photoUploading} onChange={uploadPhoto} />
              </label>
              {photoUploading ? (
                <p role="status" className="text-center text-xs font-semibold text-brand-carmelita/80">Subiendo...</p>
              ) : null}
            </div>
            <p className="text-sm text-brand-carmelita/75">Toca tu foto para cambiarla.</p>
          </div>
          <p className="mt-5 text-sm">
            <span className="text-brand-carmelita/60">Nombre</span>
            <br />
            <strong>{profile.full_name}</strong>
          </p>
        </div>
      </section>

      <CustomerQvaPaySettings onUpdated={setProfile} />

      {profileError ? (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{profileError}</p>
      ) : null}
      {profileMessage ? (
        <p role="status" className="rounded-xl bg-brand-green/10 p-3 text-sm text-brand-green">{profileMessage}</p>
      ) : null}

      <section className={sectionClass}>
        <h2 className="mb-4 font-script text-3xl leading-[1.15] text-brand-carmelita">Datos de contacto</h2>
        <form onSubmit={(event) => { event.preventDefault(); void startContactChange('email') }} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-sm font-semibold">
            Correo electrónico
            <input type="email" required maxLength={254} value={contactDraft.email} onChange={(event) => setContactDraft((current) => ({ ...current, email: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2" />
          </label>
          <button type="submit" disabled={contactLoading || contactDraft.email.trim().toLowerCase() === profile.email} className="min-h-11 rounded-xl bg-brand-green px-4 font-bold text-white disabled:opacity-50">
            Verificar correo
          </button>
        </form>
        {contactChallenge?.kind === 'email' ? (
          <form onSubmit={confirmContactChange} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <label className="text-sm font-semibold">
              Código enviado al nuevo correo
              <input required minLength={4} maxLength={8} inputMode="numeric" value={contactCode} onChange={(event) => setContactCode(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 px-3 py-2" />
            </label>
            <button disabled={contactLoading} className="min-h-11 rounded-xl bg-brand-carmelita px-4 font-bold text-white disabled:opacity-50">Confirmar</button>
            <button type="button" onClick={() => void startContactChange('email')} className="min-h-11 rounded-xl border border-brand-green/20 px-4 text-sm font-semibold">Reenviar</button>
          </form>
        ) : null}
        <form onSubmit={(event) => { event.preventDefault(); void startContactChange('phone') }} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-sm font-semibold">
            Teléfono
            <input type="tel" required value={contactDraft.phone} onChange={(event) => setContactDraft((current) => ({ ...current, phone: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2" />
          </label>
          <button type="submit" disabled={contactLoading || normalizedPhoneDigits(contactDraft.phone) === normalizedPhoneDigits(profile.phone)} className="min-h-11 rounded-xl bg-brand-green px-4 font-bold text-white disabled:opacity-50">
            Verificar teléfono
          </button>
        </form>
        {contactChallenge?.kind === 'phone' ? (
          <form onSubmit={confirmContactChange} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <label className="text-sm font-semibold">
              Código enviado al nuevo teléfono
              <input required minLength={4} maxLength={8} inputMode="numeric" value={contactCode} onChange={(event) => setContactCode(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 px-3 py-2" />
            </label>
            <button disabled={contactLoading} className="min-h-11 rounded-xl bg-brand-carmelita px-4 font-bold text-white disabled:opacity-50">Confirmar</button>
            <button type="button" onClick={() => void startContactChange('phone')} className="min-h-11 rounded-xl border border-brand-green/20 px-4 text-sm font-semibold">Reenviar</button>
          </form>
        ) : null}
      </section>

      <section className={sectionClass}>
        <h2 className="mb-4 font-script text-3xl leading-[1.15] text-brand-carmelita">Carnet de identidad</h2>
        <form onSubmit={saveIdentityCard} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-sm font-semibold">
            Número de carnet
            <input required maxLength={64} value={contactDraft.identity_card} onChange={(event) => setContactDraft((current) => ({ ...current, identity_card: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2" />
          </label>
          <button disabled={contactLoading || contactDraft.identity_card.trim() === profile.identity_card} className="min-h-11 rounded-xl bg-brand-green px-4 font-bold text-white disabled:opacity-50">
            Guardar carnet
          </button>
        </form>
      </section>

      <div className="flex flex-row flex-wrap items-center gap-3">
        <button type="button" onClick={() => { setDeleteError(''); setDeleteOpen(true) }} className="min-h-11 rounded-xl bg-red-700 px-4 font-bold text-white">
          Eliminar cuenta
        </button>
        <button type="button" onClick={() => setLogoutOpen(true)} className="min-h-11 rounded-xl border border-brand-green/20 bg-brand-white px-4 font-bold text-brand-green">
          Cerrar sesión
        </button>
      </div>

      {logoutOpen ? <SellerLogoutModal onClose={() => setLogoutOpen(false)} onConfirm={logout} /> : null}
      {deleteOpen ? (
        <AccountDeleteModal
          onClose={() => { if (!deleteLoading) setDeleteOpen(false) }}
          onConfirm={() => void confirmDeleteAccount()}
          loading={deleteLoading}
          error={deleteError}
          description="Se borrarán tu perfil, direcciones, favoritos y datos de acceso de forma permanente. Los pedidos ya registrados se conservan como historial para las tiendas."
        />
      ) : null}
    </>
  )
}
