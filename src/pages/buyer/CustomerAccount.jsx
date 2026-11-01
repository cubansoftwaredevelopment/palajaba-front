import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { fetchCustomerOrders, fetchCustomerProfile, addCustomerAddress, updateCustomerAddress, deleteCustomerAddress, uploadCustomerPhoto, startCustomerEmailOtp, startCustomerPhoneOtp, confirmCustomerContactOtp, updateCustomerIdentityCard } from '../../auth/api'
import { clearCustomerSession, getCustomerToken, updateCustomerProfile } from '../../lib/customerAuth'
import { fetchMarketplaceProduct } from '../../lib/api'
import { getBuyerLocation } from '../../lib/buyerLocation'
import { resolveMediaUrl } from '../../lib/media'
import { formatPrice } from '../../lib/money'
import BuyerOrderLocationMap from '../../components/buyer/BuyerOrderLocationMap'
import BuyerProductCard from '../../components/buyer/BuyerProductCard'
import BuyerModalPortal from '../../components/buyer/BuyerModalPortal'
import { orderModalMotionClass, useDismissibleModal, useOrderModalPresence } from '../../components/buyer/useOrderModalPresence'
import { getUserFacingMessage } from '../../lib/userFacingError'

const sectionClass = 'rounded-2xl border border-brand-green/10 bg-brand-white p-4 shadow-sm sm:p-6'
const statusLabel = { pending_confirmation: 'Pendiente de confirmación', completed: 'Completado', cancelled: 'Cancelado' }
const CUSTOMER_NAV = [
  { id: 'pedidos', path: '/cliente/pedidos', label: 'Mis pedidos', icon: <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" /> },
  { id: 'favoritos', path: '/cliente/favoritos', label: 'Guardados', icon: <path d="M6 4.75A1.75 1.75 0 0 1 7.75 3h8.5A1.75 1.75 0 0 1 18 4.75V21l-6-4-6 4V4.75Z" /> },
  { id: 'direcciones', path: '/cliente/direcciones', label: 'Direcciones', icon: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></> },
  { id: 'perfil', path: '/cliente/perfil', label: 'Perfil', icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></> },
]

function formatDate(value) {
  if (!value) return '—'
  let dateValue = value
  if (typeof value === 'string') {
    const normalized = value.trim().replace(/(\.\d{3})\d+/, '$1')
    const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)
    dateValue = new Date(isDateOnly
      ? `${normalized}T00:00:00`
      : hasTimezone ? normalized : `${normalized}Z`)
  } else {
    dateValue = new Date(value)
  }
  if (Number.isNaN(dateValue.getTime())) return '—'
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(dateValue)
}

function normalizedPhoneDigits(value) {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.startsWith('53') && digits.length === 10 ? digits.slice(2) : digits
}

function CustomerOrderDetailModal({ order, onClose }) {
  const { dismiss, motionClass } = useDismissibleModal(onClose)

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [dismiss])

  return (
    <BuyerModalPortal>
      <div
        className={`fixed inset-0 z-[120] flex items-end justify-center bg-brand-green/25 p-0 backdrop-blur-[3px] sm:items-center sm:p-4 ${motionClass}`}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) dismiss()
        }}
      >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-order-detail-title"
        className="relative flex max-h-[min(92dvh,44rem)] min-h-0 w-full max-w-2xl animate-fade-in flex-col overflow-y-auto rounded-t-3xl border border-brand-green/12 bg-brand-white p-5 shadow-[0_24px_60px_rgba(89,128,44,0.22)] sm:rounded-3xl sm:p-6"
      >
        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-brand-green/15 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-carmelita/60">Detalle del pedido</p>
            <h2 id="customer-order-detail-title" className="mt-1 text-xl font-bold text-brand-green">{order.store_name}</h2>
            <p className="mt-1 text-sm text-brand-carmelita/70">{formatDate(order.created_at)}</p>
          </div>
          <button type="button" onClick={dismiss} aria-label="Cerrar detalle" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl text-brand-carmelita/70 hover:bg-brand-green/10">×</button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-green/5 p-3">
          <span className="text-sm font-semibold">Estado</span>
          <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">{statusLabel[order.status] || order.status}</span>
        </div>

        <h3 className="mt-5 font-bold">Artículos</h3>
        <ul className="mt-2 divide-y divide-brand-green/10 rounded-xl border border-brand-green/10 px-3">
          {(order.items ?? []).map((item, index) => (
            <li key={`${item.product_id ?? item.name}-${index}`} className="flex items-start justify-between gap-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-green/5 ring-1 ring-brand-green/10">
                  {item.image_url ? (
                    <img src={resolveMediaUrl(item.image_url, { width: 160 })} alt={item.name || 'Artículo del pedido'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-brand-carmelita/55">Sin foto</div>
                  )}
                </div>
                <div className="min-w-0">
                <p className="font-medium">{item.name || 'Producto'}</p>
                <p className="mt-0.5 text-xs text-brand-carmelita/65">{item.quantity} × {formatPrice(item.unit_price, item.currency)}</p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold">{formatPrice(item.line_total ?? item.unit_price * item.quantity, item.currency)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 divide-y divide-brand-green/10 rounded-xl border border-brand-green/10 px-3">
          {(order.subtotals ?? []).map((entry) => (
            <div key={entry.currency} className="flex justify-between gap-4 py-3 text-sm">
              <dt>Subtotal de artículos · {entry.currency}</dt>
              <dd className="font-bold">{formatPrice(entry.amount, entry.currency)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 py-3 text-sm">
            <dt>Mensajería</dt>
            <dd className="text-right font-bold">{order.delivery_requested && order.delivery_price != null ? formatPrice(order.delivery_price, order.delivery_currency || 'CUP') : 'No solicitada · 0'}</dd>
          </div>
        </dl>

        {order.completed_at ? <p className="mt-4 text-xs text-brand-carmelita/65">Completado: {formatDate(order.completed_at)}</p> : null}
      </section>
      </div>
    </BuyerModalPortal>
  )
}

function CustomerNavigation({ mobile = false }) {
  return (
    <nav className={mobile ? 'fixed bottom-0 left-0 right-0 z-30 border-t border-brand-green/10 bg-brand-white/95 shadow-[0_-4px_24px_rgba(89,128,44,0.08)] backdrop-blur-md lg:hidden' : 'hidden lg:flex lg:flex-col lg:gap-1'} style={mobile ? { paddingBottom: 'max(0.375rem, var(--safe-bottom))' } : undefined} aria-label="Secciones de tu cuenta">
      <div className={mobile ? 'mx-auto flex w-full max-w-md items-stretch px-1' : 'flex flex-col gap-1'}>
        {CUSTOMER_NAV.map((item) => <NavLink key={item.id} to={item.path} className={mobile ? 'min-w-0 flex-1' : 'block'}>
          {({ isActive }) => <span className={mobile
            ? `flex flex-col items-center justify-center gap-0.5 py-1.5 text-[0.625rem] font-semibold text-center touch-manipulation ${isActive ? 'text-brand-green' : 'text-brand-carmelita/65'}`
            : `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-brand-green text-white' : 'text-brand-carmelita/80 hover:bg-brand-green/8 hover:text-brand-green'}`}>
            <span className={mobile ? `flex h-9 w-9 items-center justify-center rounded-xl ${isActive ? 'bg-brand-green text-white' : ''}` : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-current/10'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.icon}</svg>
            </span>
            <span className={mobile ? 'w-full truncate px-0.5' : ''}>{item.label}</span>
          </span>}
        </NavLink>)}
      </div>
    </nav>
  )
}

export default function CustomerAccount() {
  const navigate = useNavigate()
  const location = useLocation()
  const section = CUSTOMER_NAV.find((item) => item.path === location.pathname)?.id || 'perfil'
  const token = getCustomerToken()
  const [profile, setProfile] = useState(null)
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [favoriteProducts, setFavoriteProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addressOpen, setAddressOpen] = useState(false)
  const { present: addressPresent, closing: addressClosing } = useOrderModalPresence(addressOpen)
  const addressMotionClass = orderModalMotionClass(addressClosing)
  const [editingAddress, setEditingAddress] = useState(null)
  const [addressText, setAddressText] = useState('')
  const [point, setPoint] = useState(null)
  const [savingAddress, setSavingAddress] = useState(false)
  const [contactDraft, setContactDraft] = useState({ email: '', phone: '', identity_card: '' })
  const [contactChallenge, setContactChallenge] = useState(null)
  const [contactCode, setContactCode] = useState('')
  const [contactLoading, setContactLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [customer, customerOrders] = await Promise.all([fetchCustomerProfile(token), fetchCustomerOrders(token)])
      setProfile(customer)
      setContactDraft({ email: customer.email || '', phone: customer.phone || '', identity_card: customer.identity_card || '' })
      updateCustomerProfile(customer)
      setOrders(customerOrders)
      const location = getBuyerLocation()
      const ids = customer.favorite_product_ids ?? []
      const savedById = new Map((customer.favorites ?? []).map((product) => [product.id, product]))
      if (location?.province?.id && location?.municipality?.id && ids.length) {
        const results = await Promise.allSettled(ids.map((productId) => fetchMarketplaceProduct({ productId, provinceId: location.province.id, municipalityId: location.municipality.id })))
        setFavoriteProducts(results.map((result, index) => {
          if (result.status !== 'fulfilled') {
            return { ...(savedById.get(ids[index]) ?? { id: ids[index], name: 'Oferta guardada' }), unavailable_in_municipality: location.municipality.name }
          }
          return result.value.pickup_required
            ? { ...result.value, warning_municipality: location.municipality.name }
            : result.value
        }))
      } else {
        setFavoriteProducts(ids.map((id) => ({ ...(savedById.get(id) ?? { id, name: 'Oferta guardada' }), unavailable_in_municipality: true })))
      }
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos cargar tu cuenta.'))
    } finally { setLoading(false) }
  }, [token])

  useEffect(() => {
    queueMicrotask(() => { void load() })
  }, [load])

  async function saveAddress(event) {
    event.preventDefault()
    if (!point) {
      setError('Marca la ubicación de esta dirección en el mapa.')
      return
    }
    setSavingAddress(true)
    setError('')
    try {
      const addressPayload = {
        label: addressText.trim().slice(0, 48),
        address: addressText.trim(),
        latitude: point.lat,
        longitude: point.lng,
      }
      const next = editingAddress
        ? await updateCustomerAddress(token, editingAddress.id, addressPayload)
        : await addCustomerAddress(token, addressPayload)
      setProfile(next)
      updateCustomerProfile(next)
      setAddressOpen(false)
      setEditingAddress(null)
      setAddressText('')
      setPoint(null)
    } catch (cause) { setError(getUserFacingMessage(cause, 'No pudimos guardar la dirección.')) }
    finally { setSavingAddress(false) }
  }

  async function removeAddress(id) {
    try {
      const next = await deleteCustomerAddress(token, id)
      setProfile(next)
      updateCustomerProfile(next)
    } catch (cause) { setError(getUserFacingMessage(cause, 'No pudimos eliminar la dirección.')) }
  }

  function openNewAddress() {
    setEditingAddress(null)
    setAddressText('')
    setPoint(null)
    setAddressOpen(true)
  }

  function openEditAddress(address) {
    setEditingAddress(address)
    setAddressText(address.address || '')
    setPoint(address.latitude != null && address.longitude != null
      ? { lat: address.latitude, lng: address.longitude }
      : null)
    setAddressOpen(true)
  }

  async function uploadPhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const next = await uploadCustomerPhoto(token, file)
      setProfile(next)
      updateCustomerProfile(next)
    } catch (cause) { setError(getUserFacingMessage(cause, 'No pudimos actualizar la foto.')) }
    event.target.value = ''
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

  return (
    <div className="min-h-dvh bg-brand-green/[0.035] text-brand-carmelita lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-brand-green/10 bg-brand-white/70 px-3 py-6 lg:block">
        <Link
          to="/comprar"
          className="mb-8 block px-3 text-sm font-bold text-brand-green"
        >
          ← Seguir comprando
        </Link>
        <CustomerNavigation />
      </aside>
      <main className="min-w-0 flex-1 px-4 pb-[calc(5.5rem+var(--safe-bottom))] pt-6 sm:px-6 lg:px-8 lg:pb-8">
        <div className="mx-auto max-w-5xl">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link
                to="/comprar"
                className="text-sm font-bold text-brand-green lg:hidden"
              >
                ← Seguir comprando
              </Link>
              <h1 className="mt-2 font-display text-3xl font-bold">
                {CUSTOMER_NAV.find((item) => item.id === section)?.label ||
                  "Mi cuenta"}
              </h1>
            </div>
          </header>
          {error ? (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}
          {loading ? (
            <div className={sectionClass}>Cargando tu cuenta…</div>
          ) : profile ? (
            <div className="grid gap-4">
              {section === "perfil" ? (
                <>
                  <section
                    className={`${sectionClass} relative isolate overflow-hidden`}
                  >
                    <div
                      className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-brand-yellow/25 blur-3xl"
                      aria-hidden="true"
                    />
                    <div
                      className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-brand-green/15 blur-3xl"
                      aria-hidden="true"
                    />
                    <div className="relative z-10">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold">Mi perfil</h2>
                        <button
                          type="button"
                          onClick={logout}
                          aria-label="Cerrar sesión"
                          title="Cerrar sesión"
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-brand-green/20 text-brand-green transition hover:bg-brand-green/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M10 17l5-5-5-5" />
                            <path d="M15 12H3" />
                            <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <label
                          className="group relative block h-20 w-20 shrink-0 cursor-pointer rounded-full"
                          aria-label="Cambiar foto de perfil"
                        >
                          {profile.profile_photo_url ? (
                            <img
                              src={resolveMediaUrl(profile.profile_photo_url)}
                              alt="Foto de perfil"
                              className="h-20 w-20 rounded-full object-cover ring-2 ring-white shadow-lg"
                            />
                          ) : (
                            <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-yellow/35 text-2xl font-bold text-brand-green ring-2 ring-white shadow-lg">
                              {profile.full_name?.[0]}
                            </span>
                          )}
                          <span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-brand-green text-white shadow-md transition group-hover:bg-brand-carmelita">
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden="true"
                            >
                              <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
                              <circle cx="12" cy="13" r="3" />
                            </svg>
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={uploadPhoto}
                          />
                        </label>
                        <p className="text-sm text-brand-carmelita/75">
                          Toca tu foto para cambiarla.
                        </p>
                      </div>
                      <p className="mt-5 text-sm">
                        <span className="text-brand-carmelita/60">Nombre</span>
                        <br />
                        <strong>{profile.full_name}</strong>
                      </p>
                    </div>
                  </section>

                  {profileError ? (
                    <p
                      role="alert"
                      className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
                    >
                      {profileError}
                    </p>
                  ) : null}
                  {profileMessage ? (
                    <p
                      role="status"
                      className="rounded-xl bg-brand-green/10 p-3 text-sm text-brand-green"
                    >
                      {profileMessage}
                    </p>
                  ) : null}

                  <section className={sectionClass}>
                    <h2 className="mb-4 text-lg font-bold">
                      Datos de contacto
                    </h2>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void startContactChange("email");
                      }}
                      className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
                    >
                      <label className="text-sm font-semibold">
                        Correo electrónico
                        <input
                          type="email"
                          required
                          maxLength={254}
                          value={contactDraft.email}
                          onChange={(event) =>
                            setContactDraft((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={
                          contactLoading ||
                          contactDraft.email.trim().toLowerCase() ===
                          profile.email
                        }
                        className="min-h-11 rounded-xl bg-brand-green px-4 font-bold text-white disabled:opacity-50"
                      >
                        Verificar correo
                      </button>
                    </form>
                    {contactChallenge?.kind === "email" ? (
                      <form
                        onSubmit={confirmContactChange}
                        className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end"
                      >
                        <label className="text-sm font-semibold">
                          Código enviado al nuevo correo
                          <input
                            required
                            minLength={4}
                            maxLength={8}
                            inputMode="numeric"
                            value={contactCode}
                            onChange={(event) =>
                              setContactCode(event.target.value)
                            }
                            className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 px-3 py-2"
                          />
                        </label>
                        <button
                          disabled={contactLoading}
                          className="min-h-11 rounded-xl bg-brand-carmelita px-4 font-bold text-white disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => void startContactChange("email")}
                          className="min-h-11 rounded-xl border border-brand-green/20 px-4 text-sm font-semibold"
                        >
                          Reenviar
                        </button>
                      </form>
                    ) : null}
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void startContactChange("phone");
                      }}
                      className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
                    >
                      <label className="text-sm font-semibold">
                        Teléfono
                        <input
                          type="tel"
                          required
                          value={contactDraft.phone}
                          onChange={(event) =>
                            setContactDraft((current) => ({
                              ...current,
                              phone: event.target.value,
                            }))
                          }
                          className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={
                          contactLoading ||
                          normalizedPhoneDigits(contactDraft.phone) ===
                          normalizedPhoneDigits(profile.phone)
                        }
                        className="min-h-11 rounded-xl bg-brand-green px-4 font-bold text-white disabled:opacity-50"
                      >
                        Verificar teléfono
                      </button>
                    </form>
                    {contactChallenge?.kind === "phone" ? (
                      <form
                        onSubmit={confirmContactChange}
                        className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end"
                      >
                        <label className="text-sm font-semibold">
                          Código enviado al nuevo teléfono
                          <input
                            required
                            minLength={4}
                            maxLength={8}
                            inputMode="numeric"
                            value={contactCode}
                            onChange={(event) =>
                              setContactCode(event.target.value)
                            }
                            className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 px-3 py-2"
                          />
                        </label>
                        <button
                          disabled={contactLoading}
                          className="min-h-11 rounded-xl bg-brand-carmelita px-4 font-bold text-white disabled:opacity-50"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => void startContactChange("phone")}
                          className="min-h-11 rounded-xl border border-brand-green/20 px-4 text-sm font-semibold"
                        >
                          Reenviar
                        </button>
                      </form>
                    ) : null}
                  </section>

                  <section className={sectionClass}>
                    <h2 className="mb-4 text-lg font-bold">
                      Carnet de identidad
                    </h2>
                    <form
                      onSubmit={saveIdentityCard}
                      className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"
                    >
                      <label className="text-sm font-semibold">
                        Número de carnet
                        <input
                          required
                          maxLength={64}
                          value={contactDraft.identity_card}
                          onChange={(event) =>
                            setContactDraft((current) => ({
                              ...current,
                              identity_card: event.target.value,
                            }))
                          }
                          className="mt-1 min-h-11 w-full rounded-xl border border-brand-green/15 bg-white px-3 py-2"
                        />
                      </label>
                      <button
                        disabled={
                          contactLoading ||
                          contactDraft.identity_card.trim() ===
                          profile.identity_card
                        }
                        className="min-h-11 rounded-xl bg-brand-green px-4 font-bold text-white disabled:opacity-50"
                      >
                        Guardar carnet
                      </button>
                    </form>
                  </section>
                </>
              ) : null}

              {section === "direcciones" ? (
                <section className={sectionClass}>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold">Direcciones guardadas</h2>
                    <button
                      type="button"
                      onClick={openNewAddress}
                      aria-label="Agregar dirección"
                      title="Agregar dirección"
                      className="grid h-10 w-10 place-items-center rounded-full bg-brand-green text-white shadow-sm transition hover:bg-brand-carmelita focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30 focus-visible:ring-offset-2"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                  {profile.addresses?.length ? (
                    <ul className="space-y-3">
                      {profile.addresses.map((address) => (
                        <li
                          key={address.id}
                          className="flex items-stretch justify-between gap-3 rounded-xl bg-brand-green/[0.04] p-3"
                        >
                          <button
                            type="button"
                            onClick={() => openEditAddress(address)}
                            aria-label={`Editar dirección ${address.label}`}
                            className="min-w-0 flex-1 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
                          >
                            <p className="font-semibold">{address.label}</p>
                            <p className="text-sm text-brand-carmelita/75">
                              {address.address}
                            </p>
                            {address.latitude != null ? (
                              <p className="mt-1 text-xs text-brand-carmelita/60">
                                Pin guardado
                              </p>
                            ) : null}
                          </button>
                          <div className="flex shrink-0 items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditAddress(address)}
                              aria-label={`Editar dirección ${address.label}`}
                              title="Editar dirección"
                              className="grid h-9 w-9 place-items-center rounded-full text-brand-green transition hover:bg-brand-green/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/30"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="m15 5 4 4M4 20l4.5-1 10.7-10.7a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAddress(address.id)}
                              aria-label={`Eliminar dirección ${address.label}`}
                              title="Eliminar dirección"
                              className="grid h-9 w-9 place-items-center rounded-full text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-brand-carmelita/70">
                      Aún no guardas direcciones.
                    </p>
                  )}
                </section>
              ) : null}

              {section === "pedidos" ? (
                <section>
                  {orders.length ? (
                    <ul className="grid gap-3 md:grid-cols-2">
                      {orders.map((order) => (
                        <li key={order.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            aria-label={`Ver detalle del pedido de ${order.store_name}`}
                            className="w-full rounded-xl border border-brand-green/10 p-4 text-left transition hover:border-brand-green/40 hover:bg-brand-green/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40"
                          >
                          <div className="flex justify-between gap-3">
                            <strong>{order.store_name}</strong>
                            <span className="text-xs font-bold text-brand-green">
                              {statusLabel[order.status] || order.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-brand-carmelita/60">
                            {formatDate(order.created_at)}
                          </p>
                          <p className="mt-2 text-sm">
                            {order.items
                              ?.map((item) => `${item.quantity} × ${item.name}`)
                              .join(", ")}
                          </p>
                          <p className="mt-2 text-xs text-brand-carmelita/70">
                            {order.subtotals
                              ?.map((entry) =>
                                formatPrice(entry.amount, entry.currency),
                              )
                              .join(" · ")}
                          </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-brand-carmelita/70">
                      Aún no tienes pedidos.
                    </p>
                  )}
                </section>
              ) : null}

              {section === "favoritos" ? (
                <section className="space-y-4">
                  {favoriteProducts.length ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {favoriteProducts.map((product) => (
                        <BuyerProductCard
                          key={product.id}
                          product={product}
                          allowBuyAfterWarning={Boolean(
                            product.warning_municipality,
                          )}
                          buyWarning={
                            product.warning_municipality
                              ? `La tienda no ofrece entrega en ${product.warning_municipality}. Debes recoger esta oferta${product.pickup_municipality_name ? ` en ${product.pickup_municipality_name}` : ""}.`
                              : product.unavailable_in_municipality === true
                                ? "No pudimos comprobar que esta oferta esté disponible para tu municipio. Configura tu municipio y vuelve a intentarlo."
                                : product.unavailable_in_municipality
                                  ? `No pudimos comprobar que esta oferta esté disponible en ${product.unavailable_in_municipality}. Cambia tu municipio para buscarla en su zona.`
                                  : ""
                          }
                          onFavoriteChange={(isFavorite) => {
                            if (!isFavorite)
                              setFavoriteProducts((current) =>
                                current.filter(
                                  (item) => item.id !== product.id,
                                ),
                              );
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-brand-carmelita/70">
                      Aún no tienes favoritos.
                    </p>
                  )}
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </main>
      <CustomerNavigation mobile />

      {selectedOrder ? <CustomerOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}

      {addressPresent ? (
        <div
          className={`fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-3 ${addressMotionClass}`}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAddressOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            className={`flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-y-auto rounded-t-3xl bg-brand-white p-5 shadow-xl sm:rounded-3xl sm:p-6 ${addressClosing ? 'motion-safe:animate-address-sheet-out' : 'motion-safe:animate-address-sheet-in'}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {editingAddress ? "Editar dirección" : "Nueva dirección"}
              </h2>
              <button
                type="button"
                onClick={() => setAddressOpen(false)}
                aria-label="Cerrar"
                className="text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={saveAddress} className="mt-4 flex flex-col gap-3">
              <label className="text-sm font-semibold">
                Dirección física
                <input
                  required
                  maxLength={300}
                  value={addressText}
                  onChange={(event) => setAddressText(event.target.value)}
                  placeholder="Calle, número, reparto…"
                  className="mt-1 w-full rounded-xl border border-brand-green/20 px-3 py-2"
                />
              </label>
              <BuyerOrderLocationMap
                initialCoords={point}
                onChange={(coords) => setPoint(coords)}
                heightClass="h-80 sm:h-[28rem]"
              />
              <button
                disabled={savingAddress}
                className="min-h-11 rounded-xl bg-brand-green font-bold text-white disabled:opacity-60"
              >
                {savingAddress
                  ? "Guardando…"
                  : editingAddress
                    ? "Guardar cambios"
                    : "Guardar dirección"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
