import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { fetchCustomerOrders, fetchCustomerProfile, addCustomerAddress, updateCustomerAddress, deleteCustomerAddress, uploadCustomerPhoto, startCustomerEmailOtp, startCustomerPhoneOtp, confirmCustomerContactOtp, updateCustomerIdentityCard, fetchCustomerPaymentNotifications, markCustomerPaymentNotificationRead, dismissCustomerQvaPayPrompt, deleteCustomerAccount } from '../api.js'
import { clearCustomerSession, CUSTOMER_PURCHASE_REVOKED_MESSAGE, getCustomerToken, updateCustomerProfile } from '../../lib/customerAuth'
import AccountDeleteModal from '../../components/AccountDeleteModal'
import { fetchMarketplaceProduct } from '../../buyer/api.js'
import CustomerNavigation from '../components/CustomerNavigation.jsx'
import CustomerQvaPayPrompt from '../components/CustomerQvaPayPrompt.jsx'
import CustomerQvaPaySettings from '../components/CustomerQvaPaySettings.jsx'
import CustomerOrderDetailModal from '../components/CustomerOrderDetailModal.jsx'
import QvaPayReleaseCountdown from '../components/QvaPayReleaseCountdown.jsx'
import { CUSTOMER_NAV } from '../components/customerNav.jsx'
import { formatDate, getBuyerOrderStatusLabel, needsBuyerOrderAttention, normalizedPhoneDigits, orderIsInRange, sectionClass } from '../constants.js'
import { getBuyerLocation } from '../../lib/buyerLocation'
import { resolveMediaUrl } from '../../lib/media'
import { formatPrice } from '../../lib/money'
import BuyerOrderLocationMap from '../../buyer/components/BuyerOrderLocationMap'
import BuyerProductCard from '../../buyer/components/BuyerProductCard'
import Logo from '../../components/Logo'
import SellerLogoutModal from '../../components/seller/SellerLogoutModal'
import SellerNotificationToast from '../../components/seller/SellerNotificationToast'
import { orderModalMotionClass, useOrderModalPresence } from '../../buyer/components/useOrderModalPresence'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { connectCustomerEvents, startCustomerPush, stopCustomerPush } from '../../live/utils'
import FilterModal, { FilterButton } from '../../components/filters/FilterModal'
import { clearedDateFilter, countActiveFilters } from '../../components/filters/filterState'
import { rangeForPeriod } from '../../components/admin/AdminDateRangeControls'


export default function CustomerAccount() {
  const navigate = useNavigate()
  const location = useLocation()
  const section = location.pathname === '/cliente/avisos'
    ? 'avisos'
    : CUSTOMER_NAV.find((item) => item.path === location.pathname)?.id || 'perfil'
  const token = getCustomerToken()
  const [profile, setProfile] = useState(null)
  const [qvaPayPromptHeld, setQvaPayPromptHeld] = useState(() => Boolean(location.state?.focusQvaPay))
  const [qvaPayPromptSection, setQvaPayPromptSection] = useState(section)
  if (qvaPayPromptSection !== section) {
    setQvaPayPromptSection(section)
    setQvaPayPromptHeld(section === 'perfil' && Boolean(location.state?.focusQvaPay))
  }
  const [orders, setOrders] = useState([])
  const [paymentNotifications, setPaymentNotifications] = useState([])
  const [liveNotificationToast, setLiveNotificationToast] = useState(null)
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [notificationsError, setNotificationsError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [favoriteProducts, setFavoriteProducts] = useState([])
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFiltersOpen, setOrderFiltersOpen] = useState(false)
  const [storeFilter, setStoreFilter] = useState('')
  const [productFilters, setProductFilters] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [deliveryFilter, setDeliveryFilter] = useState('')
  const [datePeriod, setDatePeriod] = useState('daily')
  const [dateRange, setDateRange] = useState(() => rangeForPeriod('daily'))
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
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

  const loadPaymentNotifications = useCallback(async () => {
    setNotificationsLoading(true)
    setNotificationsError('')
    try {
      const notifications = await fetchCustomerPaymentNotifications(token)
      setPaymentNotifications(Array.isArray(notifications) ? notifications : [])
    } catch (cause) {
      setNotificationsError(getUserFacingMessage(cause, 'No pudimos cargar tus avisos.'))
      setPaymentNotifications([])
    } finally {
      setNotificationsLoading(false)
    }
  }, [token])

  const refreshCustomerOrders = useCallback(async () => {
    try {
      const customerOrders = await fetchCustomerOrders(token)
      setOrders(customerOrders)
      setSelectedOrder((current) => current
        ? customerOrders.find((order) => order.id === current.id) ?? current
        : current)
    } catch {
      /* El siguiente evento o la actualización manual volverá a sincronizar los pedidos. */
    }
  }, [token])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [customer, customerOrders] = await Promise.all([
        fetchCustomerProfile(token), fetchCustomerOrders(token),
      ])
      setProfile(customer)
      setContactDraft({ email: customer.email || '', phone: customer.phone || '', identity_card: customer.identity_card || '' })
      updateCustomerProfile(customer)
      setOrders(customerOrders)
      setSelectedOrder((current) => current ? customerOrders.find((order) => order.id === current.id) ?? current : current)
      void loadPaymentNotifications()
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
  }, [loadPaymentNotifications, token])

  useEffect(() => {
    queueMicrotask(() => { void load() })
  }, [load])

  useEffect(() => {
    if (!token) return undefined
    void startCustomerPush(token)
    return () => { void stopCustomerPush(token) }
  }, [token])

  useEffect(() => {
    if (!token) return undefined
    return connectCustomerEvents(token, (notification) => {
      setPaymentNotifications((current) => current.some((item) => item.id === notification.id)
        ? current
        : [notification, ...current])
      setLiveNotificationToast({
        id: notification.id,
        title: notification.title,
        content: notification.content,
      })
      void refreshCustomerOrders()
    }, () => {
      void refreshCustomerOrders()
      void loadPaymentNotifications()
    })
  }, [loadPaymentNotifications, refreshCustomerOrders, token])

  async function openPaymentNotification(notification) {
    try {
      const updated = notification.read_at ? notification : await markCustomerPaymentNotificationRead(token, notification.id)
      setPaymentNotifications((current) => current.map((item) => item.id === notification.id ? updated : item))
      const order = orders.find((item) => item.id === notification.order_id)
      if (order) setSelectedOrder(order)
      else await load()
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos abrir la notificación.'))
    }
  }

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

  const unreadNotificationCount = paymentNotifications.filter((notification) => !notification.read_at).length
  const hasOrderWarning = orders.some(needsBuyerOrderAttention)
  const orderFilterOptions = useMemo(() => ({
    stores: [...new Set(orders.map((order) => order.store_name).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    products: [...new Set(orders.flatMap((order) => (order.items || []).map((item) => item.name).filter(Boolean)))].sort((a, b) => a.localeCompare(b, 'es')),
    statuses: [...new Set(orders.map(getBuyerOrderStatusLabel).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    currencies: [...new Set(orders.flatMap((order) => [order.payment_currency, ...(order.subtotals || []).map((entry) => entry.currency)].filter(Boolean)))].sort(),
  }), [orders])
  const visibleCustomerOrders = useMemo(() => {
    const query = orderSearch.trim().toLocaleLowerCase('es')
    return orders.filter((order) => {
      const searchable = [
        order.store_name,
        order.id?.slice(-6),
        getBuyerOrderStatusLabel(order),
        ...(order.items || []).map((item) => item.name),
      ].filter(Boolean).join(' ').toLocaleLowerCase('es')
      if (query && !searchable.includes(query)) return false
      if (storeFilter && order.store_name !== storeFilter) return false
      if (productFilters.length && !order.items?.some((item) => productFilters.includes(item.name))) return false
      if (statusFilter && getBuyerOrderStatusLabel(order) !== statusFilter) return false
      if (currencyFilter && order.payment_currency !== currencyFilter && !order.subtotals?.some((entry) => entry.currency === currencyFilter)) return false
      if (deliveryFilter === 'yes' && !order.delivery_requested) return false
      if (deliveryFilter === 'no' && order.delivery_requested) return false
      if (dateFilterEnabled && !orderIsInRange(order, dateRange)) return false
      return true
    })
  }, [orders, orderSearch, storeFilter, productFilters, statusFilter, currencyFilter, deliveryFilter, dateFilterEnabled, dateRange])
  const orderFilterValues = {
    store: storeFilter,
    products: productFilters,
    status: statusFilter,
    currency: currencyFilter,
    delivery: deliveryFilter,
    datePeriod,
    dateRange,
    dateEnabled: dateFilterEnabled,
  }
  const emptyOrderFilters = {
    store: '',
    products: [],
    status: '',
    currency: '',
    delivery: '',
    ...clearedDateFilter(),
  }
  const activeOrderFilterCount = countActiveFilters(orderFilterValues, ['store', 'products', 'status', 'currency', 'delivery'])

  useEffect(() => {
    if (section !== 'perfil' || !location.state?.focusQvaPay) return undefined
    document.getElementById('cuenta-qvapay')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return undefined
  }, [section, location.state])

  const showQvaPayPrompt = section === 'perfil' && Boolean(profile) && !profile.qvapay_username && !profile.qvapay_prompt_dismissed && !qvaPayPromptHeld

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

  function updateOrderFilters(next) {
    setStoreFilter(next.store)
    setProductFilters(next.products)
    setStatusFilter(next.status)
    setCurrencyFilter(next.currency)
    setDeliveryFilter(next.delivery)
    setDatePeriod(next.datePeriod)
    setDateRange(next.dateRange)
    setDateFilterEnabled(next.dateEnabled)
  }

  return (
    <div className="min-h-dvh bg-brand-green/[0.035] text-brand-carmelita lg:flex">
      <CustomerQvaPayPrompt
        open={showQvaPayPrompt}
        onAddUser={() => {
          setQvaPayPromptHeld(true)
          document.getElementById('cuenta-qvapay')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }}
        onDone={(dismissForever) => { void finishQvaPayPrompt(dismissForever) }}
      />
      <aside className="hidden w-60 shrink-0 border-r border-brand-green/10 bg-brand-white/70 px-3 py-6 lg:block">
        <Link
          to="/comprar"
          className="mb-8 block px-3 text-sm font-bold text-brand-green"
        >
          ← Seguir comprando
        </Link>
        <CustomerNavigation hasOrderWarning={hasOrderWarning} />
      </aside>
      <main className="min-w-0 flex-1 pb-[calc(5.5rem+var(--safe-bottom))] lg:pb-8">
        <header className="z-20 shrink-0 border-b border-brand-green/8 bg-brand-white/95 px-4 pt-[max(0.75rem,var(--safe-top))] pb-3 backdrop-blur-md sm:px-5 lg:px-8 lg:pt-[max(1rem,var(--safe-top))] lg:pb-4">
          <div className="mx-auto flex w-full max-w-md items-center gap-2.5 sm:gap-3 lg:max-w-none">
            <Logo className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
            <p className="min-w-0 flex-1 truncate font-display text-sm font-bold text-brand-green sm:text-base lg:text-lg">
              Bienvenido{' '}
              <span className="text-brand-carmelita">{profile?.full_name || ''}</span>
            </p>
            <NavLink
              to="/cliente/avisos"
              aria-label={unreadNotificationCount ? `Notificaciones, ${unreadNotificationCount} sin leer` : 'Notificaciones'}
              title="Notificaciones"
              className={({ isActive }) => `relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-carmelita/70 transition-colors touch-manipulation active:bg-brand-green/8 active:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35 ${isActive ? 'bg-brand-green/8 text-brand-green' : ''}`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotificationCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-carmelita px-1 text-[0.6rem] font-bold leading-none text-brand-white">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              ) : null}
            </NavLink>
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-carmelita/70 transition-colors touch-manipulation active:bg-brand-green/8 active:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/35"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" x2="9" y1="12" y2="12" />
              </svg>
            </button>
          </div>
        </header>
        <div className="mx-auto w-full max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
          <header className="mb-6">
            <div>
              <Link
                to="/comprar"
                className="text-sm font-bold text-brand-green lg:hidden"
              >
                ← Seguir comprando
              </Link>
              <h1 className="mt-2 font-display text-3xl font-bold">
                {section === 'avisos'
                  ? 'Avisos'
                  : CUSTOMER_NAV.find((item) => item.id === section)?.label || 'Mi cuenta'}
              </h1>
            </div>
          </header>
          {profile?.purchase_revoked ? (
            <p role="status" className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              {CUSTOMER_PURCHASE_REVOKED_MESSAGE}
            </p>
          ) : null}
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
                      <h2 className="mb-4 text-lg font-bold">Mi perfil</h2>
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

                  <CustomerQvaPaySettings onUpdated={setProfile} />

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

                  <section className={sectionClass}>
                    <h2 className="mb-2 text-lg font-bold text-red-700">Eliminar cuenta</h2>
                    <p className="text-sm leading-relaxed text-brand-carmelita">
                      Se borrarán tu perfil, direcciones, favoritos y datos de acceso. Los pedidos ya hechos se conservan para las tiendas.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError('')
                        setDeleteOpen(true)
                      }}
                      className="mt-4 min-h-11 rounded-xl bg-red-700 px-4 font-bold text-white"
                    >
                      Eliminar cuenta
                    </button>
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
                <section className="space-y-3">
                  {orders.length ? (
                    <>
                      <div className="relative">
                        <label>
                          <span className="sr-only">Buscar pedidos</span>
                          <input
                            value={orderSearch}
                            onChange={(event) => setOrderSearch(event.target.value)}
                            placeholder="Buscar por tienda, producto o pedido"
                            className="min-h-11 w-full rounded-xl border border-brand-green/15 bg-brand-white py-2 pl-11 pr-14 text-sm text-brand-carmelita placeholder:text-brand-carmelita/45 focus:border-brand-green/40 focus:outline-none focus:ring-2 focus:ring-brand-green/15"
                          />
                        </label>
                        {orderSearch ? (
                          <button
                            type="button"
                            onClick={() => setOrderSearch('')}
                            aria-label="Limpiar búsqueda"
                            title="Limpiar búsqueda"
                            className="absolute left-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-brand-carmelita/60 transition hover:bg-brand-green/8 hover:text-brand-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
                          </button>
                        ) : null}
                        <FilterButton count={activeOrderFilterCount} label="Filtrar pedidos" expanded={orderFiltersOpen} onClick={() => setOrderFiltersOpen(true)} />
                      </div>
                      {visibleCustomerOrders.length ? (
                        <ul className="grid gap-3 md:grid-cols-2">
                      {visibleCustomerOrders.map((order) => {
                        const evidenceStatus = order.payment_method === 'qvapay' ? order.qvapay?.evidence?.status : null
                        const highlighted = needsBuyerOrderAttention(order)
                        return (
                        <li key={order.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            aria-label={`Ver detalle del pedido de ${order.store_name}`}
                            className={`relative w-full overflow-hidden rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 ${highlighted ? evidenceStatus === 'rejected' ? 'border-red-300 bg-red-50/75 shadow-[0_4px_18px_rgba(185,28,28,0.09)] hover:border-red-400' : 'border-amber-300 bg-amber-50/75 shadow-[0_4px_18px_rgba(180,83,9,0.09)] hover:border-amber-400' : 'border-brand-green/10 bg-brand-white hover:border-brand-green/40 hover:bg-brand-green/5'}`}
                          >
                          {highlighted ? <span className={`absolute inset-y-0 left-0 w-1 ${evidenceStatus === 'rejected' ? 'bg-red-600' : 'bg-amber-500'}`} aria-hidden="true" /> : null}
                          <div className="flex justify-between gap-3 pl-1">
                            <strong>{order.store_name}</strong>
                            <span className={`inline-flex shrink-0 items-center gap-1 text-right text-xs font-bold ${evidenceStatus === 'rejected' ? 'text-red-800' : evidenceStatus === 'pending' ? 'text-amber-900' : 'text-brand-green'}`}>
                              {highlighted ? <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[0.65rem] font-extrabold leading-none text-white ${evidenceStatus === 'rejected' ? 'bg-red-700' : 'bg-amber-700'}`} aria-hidden="true">!</span> : null}
                              {getBuyerOrderStatusLabel(order)}
                            </span>
                          </div>
                          <p className="mt-1 pl-1 text-xs text-brand-carmelita/60">
                            {formatDate(order.created_at)}
                          </p>
                          {evidenceStatus === 'pending' ? (
                            <QvaPayReleaseCountdown deadline={order.qvapay?.evidence?.deadline} compact />
                          ) : null}
                          <p className="mt-2 pl-1 text-sm">
                            {order.items
                              ?.map((item) => `${item.quantity} × ${item.name}`)
                              .join(", ")}
                          </p>
                          <p className="mt-2 pl-1 text-xs text-brand-carmelita/70">
                            {order.subtotals
                              ?.map((entry) =>
                                formatPrice(entry.amount, entry.currency),
                              )
                              .join(" · ")}
                          </p>
                          </button>
                        </li>
                      )})}
                        </ul>
                      ) : (
                        <p className="rounded-2xl border border-brand-green/10 bg-brand-white p-4 text-sm text-brand-carmelita/70">No hay pedidos que coincidan con la búsqueda o los filtros.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-brand-carmelita/70">
                      Aún no tienes pedidos.
                    </p>
                  )}
                </section>
              ) : null}

              {section === "avisos" ? (
                <section className="space-y-3">
                  {notificationsLoading ? <div className={sectionClass}><p className="text-sm text-brand-carmelita/70">Cargando avisos…</p></div> : null}
                  {!notificationsLoading && notificationsError ? (
                    <div className={`${sectionClass} space-y-3`}>
                      <p role="alert" className="text-sm text-brand-carmelita">{notificationsError}</p>
                      <button type="button" onClick={loadPaymentNotifications} className="min-h-10 rounded-xl bg-brand-green px-4 text-sm font-bold text-brand-white">Reintentar</button>
                    </div>
                  ) : null}
                  {!notificationsLoading && !notificationsError && paymentNotifications.length ? paymentNotifications.map((notification) => (
                    <button key={notification.id} type="button" onClick={() => openPaymentNotification(notification)} className={`w-full rounded-2xl border p-4 text-left transition ${notification.read_at ? 'border-brand-green/10 bg-brand-white' : 'border-brand-green/25 bg-brand-green/[0.04]'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <strong className="text-brand-green">{notification.title}</strong>
                        {!notification.read_at ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-green" aria-label="Sin leer" /> : null}
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm text-brand-carmelita">{notification.content}</p>
                      {Array.isArray(notification.images) && notification.images.length ? (
                        <span className="mt-3 flex flex-wrap gap-2">
                          {notification.images.map((image) => (
                            <img key={image} src={resolveMediaUrl(image)} alt="" className="h-20 w-20 rounded-xl object-cover" />
                          ))}
                        </span>
                      ) : null}
                      <p className="mt-2 text-xs text-brand-carmelita/60">{formatDate(notification.created_at)} · Toca para abrir el pedido</p>
                    </button>
                  )) : null}
                  {!notificationsLoading && !notificationsError && !paymentNotifications.length ? <div className={sectionClass}><p className="text-sm text-brand-carmelita/70">No tienes avisos de pagos.</p></div> : null}
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
      <CustomerNavigation mobile hasOrderWarning={hasOrderWarning} />

      <FilterModal
        open={orderFiltersOpen}
        onClose={() => setOrderFiltersOpen(false)}
        title="Filtrar pedidos"
        description="Combina los criterios que quieras aplicar."
        titleId="customer-order-filters-title"
        applyLabel="Ver pedidos"
        fields={[
          { key: 'store', label: 'Tienda', placeholder: 'Todas las tiendas', options: orderFilterOptions.stores },
          { key: 'products', label: 'Productos · selección múltiple', placeholder: 'Todos los productos', options: orderFilterOptions.products, multiple: true },
          { key: 'status', label: 'Estado', placeholder: 'Todos los estados', options: orderFilterOptions.statuses },
          { key: 'currency', label: 'Moneda', placeholder: 'Todas las monedas', options: orderFilterOptions.currencies },
          { key: 'delivery', label: 'Domicilio', placeholder: 'Todos', options: [{ value: 'yes', label: 'Sí' }, { value: 'no', label: 'No' }] },
        ]}
        values={orderFilterValues}
        onValuesChange={updateOrderFilters}
        dateLabel="Fecha del pedido"
        emptyValues={emptyOrderFilters}
      />

      {selectedOrder ? <CustomerOrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} onUpdated={load} /> : null}
      {logoutOpen ? <SellerLogoutModal onClose={() => setLogoutOpen(false)} onConfirm={logout} /> : null}
      {deleteOpen ? (
        <AccountDeleteModal
          onClose={() => {
            if (!deleteLoading) setDeleteOpen(false)
          }}
          onConfirm={() => void confirmDeleteAccount()}
          loading={deleteLoading}
          error={deleteError}
          description="Se borrarán tu perfil, direcciones, favoritos y datos de acceso de forma permanente. Los pedidos ya registrados se conservan como historial para las tiendas."
        />
      ) : null}
      <SellerNotificationToast
        toast={liveNotificationToast}
        aboveNav
        onDone={(id) => setLiveNotificationToast((current) => current?.id === id ? null : current)}
        onOpen={() => { setLiveNotificationToast(null); navigate('/cliente/avisos') }}
      />

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
