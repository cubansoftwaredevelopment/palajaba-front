import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BUYER_DISPLAY_CURRENCY_EVENT,
  getBuyerDisplayCurrencies,
  setBuyerDisplayCurrencies,
  setBuyerDisplayCurrency,
  toggleBuyerDisplayCurrency,
} from '../lib/buyerDisplayCurrency'
import {
  areExchangeRatesAvailable,
  getCupPerUnit,
  getExchangeRatesMeta,
  loadExchangeRates,
} from '../lib/exchangeRates'

import {
  JABA_CHANGE_EVENT,
  addToJaba,
  allItemsOfferDelivery,
  buildDirectBuyCheckoutPayload,
  clearJaba,
  clearJabaStore,
  getJabaItems,
  getJabaStoreIdsMissingPhone,
  getJabaStoreItems,
  groupJabaByStore,
  isInJaba,
  removeFromJaba,
  resolveStorePhone,
  setJabaItemQuantity,
  updateJabaStoreContact,
} from '../lib/buyerJaba'

import { fetchMarketplaceStore } from './api.js'
import { getBuyerLocation } from '../lib/buyerLocation'
import { syncJabaWithBackend } from '../lib/syncBuyerJaba'

import { needsExchangeRatesForDisplay } from '../lib/displayPrice'
import { recordProductPopularity } from '../lib/productPopularity'
import { submitStoreOrder } from '../lib/submitStoreOrder'
import { openWhatsAppCheckout } from '../lib/whatsappOrder'
import { runStoreCheckout } from '../lib/runStoreCheckout'
import {
  getStoreCheckoutPhones,
  setStoreCheckoutPhones,
} from '../lib/storeCheckoutPhones'

import BuyerDeliveryCheckoutModal from './components/BuyerDeliveryCheckoutModal'
import BuyerPickupCheckoutModal from './components/BuyerPickupCheckoutModal'
import BuyerPhoneCheckoutModal from './components/BuyerPhoneCheckoutModal'
import BuyerJabaSyncAlert from './components/BuyerJabaSyncAlert'
import BuyerJabaToast from './components/BuyerJabaToast'
import BuyerCustomerLoginModal from './components/BuyerCustomerLoginModal'
import { clearCustomerSession, getCustomerProfile, getCustomerToken, updateCustomerProfile } from '../lib/customerAuth'
import CustomerQvaPayPrompt from '../customer/components/CustomerQvaPayPrompt.jsx'
import { dismissCustomerQvaPayPrompt } from '../customer/api.js'

export const BuyerDisplayCurrencyContext = createContext(null)
const BuyerDisplayedLocationContext = createContext(null)

export function BuyerDisplayCurrencyProvider({ children }) {
  const [currencies, setCurrenciesState] = useState(getBuyerDisplayCurrencies)
  const [cupPerUnit, setCupPerUnitState] = useState(getCupPerUnit)
  const [ratesReady, setRatesReady] = useState(areExchangeRatesAvailable)
  const [ratesMeta, setRatesMeta] = useState(getExchangeRatesMeta)

  useEffect(() => {
    let cancelled = false
    loadExchangeRates()
      .then(() => {
        if (cancelled) return
        setCupPerUnitState(getCupPerUnit())
        setRatesMeta(getExchangeRatesMeta())
        setRatesReady(areExchangeRatesAvailable())
      })
      .catch(() => {
        if (!cancelled) {
          setCupPerUnitState(getCupPerUnit())
          setRatesMeta(getExchangeRatesMeta())
          setRatesReady(false)
        }
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    function onChange(event) {
      setCurrenciesState(Array.isArray(event.detail) ? event.detail : getBuyerDisplayCurrencies())
    }
    window.addEventListener(BUYER_DISPLAY_CURRENCY_EVENT, onChange)
    return () => window.removeEventListener(BUYER_DISPLAY_CURRENCY_EVENT, onChange)
  }, [])

  const value = useMemo(() => ({
    currencies,
    currency: currencies[0],
    cupPerUnit,
    ratesReady,
    ratesMeta,
    setCurrency: (code) => setCurrenciesState(setBuyerDisplayCurrency(code)),
    setCurrencies: (codes) => setCurrenciesState(setBuyerDisplayCurrencies(codes)),
    toggleCurrency: (code) => setCurrenciesState(toggleBuyerDisplayCurrency(code)),
  }), [currencies, cupPerUnit, ratesMeta, ratesReady])

  return createElement(BuyerDisplayCurrencyContext.Provider, { value }, children)
}

export function useBuyerDisplayCurrency() {
  const context = useContext(BuyerDisplayCurrencyContext)
  if (!context) throw new Error('useBuyerDisplayCurrency debe usarse dentro de BuyerDisplayCurrencyProvider')
  return context
}

export function BuyerDisplayedLocationProvider({ location, children }) {
  return createElement(BuyerDisplayedLocationContext.Provider, { value: location ?? null }, children)
}

export function useDisplayedLocation() {
  return useContext(BuyerDisplayedLocationContext) ?? getBuyerLocation()
}

function buildJabaAddedToastMessage(productName) {
  const name = String(productName ?? '').trim() || 'Producto'
  const short = name.length > 42 ? `${name.slice(0, 39)}…` : name
  return `${short} agregado a tu jaba`
}

const BuyerJabaContext = createContext(null)

function buildCheckoutPayload(group, storeItems) {
  const gestorItem = storeItems.find((item) => item.gestor_id)
  return {
    storeId: group?.store_id ?? storeItems[0]?.store_id,
    storeName: group?.store_name ?? storeItems[0]?.store_name ?? 'Tienda',
    storePhone: group?.store_phone ?? resolveStorePhone(storeItems),
    gestorId: gestorItem?.gestor_id ?? null,
    gestorUsername: gestorItem?.gestor_username ?? null,
    items: storeItems,
  }
}

async function loadCheckoutPhonesForStore(storeId) {
  const cached = getStoreCheckoutPhones(storeId)
  if (cached?.length) return cached

  try {
    const store = await fetchMarketplaceStore(storeId)
    if (store?.phone) {
      updateJabaStoreContact(storeId, store.phone, store.store_name)
    }
    const phones = Array.isArray(store?.checkout_phones) ? store.checkout_phones : []
    if (phones.length) {
      setStoreCheckoutPhones(storeId, phones)
      return phones
    }
  } catch {
    // Sin opciones extra: se usa el teléfono de la tienda del payload.
  }
  return null
}

function readRestoredCheckout() {
  if (!getCustomerToken()) return null
  try {
    const pending = JSON.parse(sessionStorage.getItem('pala_jaba_pending_customer_checkout') || 'null')
    return pending?.payload && ['delivery', 'pickup'].includes(pending.type) ? pending : null
  } catch { return null }
}

export function BuyerJabaProvider({ children }) {
  const { currency: displayCurrency, cupPerUnit, ratesReady } = useBuyerDisplayCurrency()
  const [restoredCheckout] = useState(readRestoredCheckout)
  const [items, setItems] = useState(getJabaItems)
  const [open, setOpen] = useState(false)
  const [syncingContacts, setSyncingContacts] = useState(false)
  const [deliveryCheckout, setDeliveryCheckout] = useState(() => restoredCheckout?.type === 'delivery' ? restoredCheckout.payload : null)
  const [pickupCheckout, setPickupCheckout] = useState(() => restoredCheckout?.type === 'pickup' ? restoredCheckout.payload : null)
  const [phonePicker, setPhonePicker] = useState(null)
  const [syncRemoved, setSyncRemoved] = useState(null)
  const [checkoutSubmittingStoreId, setCheckoutSubmittingStoreId] = useState(null)
  const [jabaToast, setJabaToast] = useState(null)
  const [badgePulseId, setBadgePulseId] = useState(0)
  const [customerLoginOpen, setCustomerLoginOpen] = useState(false)
  const [qvaPayPromptOpen, setQvaPayPromptOpen] = useState(false)
  const navigate = useNavigate()
  const [pendingCustomerCheckout, setPendingCustomerCheckout] = useState(null)

  const continueCheckout = useCallback(async (type, payload) => {
    let enrichedPayload = payload
    try {
      const store = await fetchMarketplaceStore(payload.storeId)
      enrichedPayload = {
        ...payload,
        qvapayEnabled: Boolean(store?.qvapay_enabled),
        storeSlug: store?.store_slug || '',
        storePages: store?.store_pages || {},
      }
    } catch {
      enrichedPayload = { ...payload, qvapayEnabled: false }
    }
    if (type === 'delivery') {
      setPickupCheckout(null)
      setDeliveryCheckout(enrichedPayload)
    } else {
      setDeliveryCheckout(null)
      setPickupCheckout(enrichedPayload)
    }
  }, [])

  const requestCustomerCheckout = useCallback((type, payload) => {
    if (!getCustomerToken()) {
      setPendingCustomerCheckout({ type, payload })
      try { sessionStorage.setItem('pala_jaba_pending_customer_checkout', JSON.stringify({ type, payload })) } catch { /* ignore */ }
      setCustomerLoginOpen(true)
      return true
    }
    continueCheckout(type, payload)
    return true
  }, [continueCheckout])

  useEffect(() => {
    if (restoredCheckout) sessionStorage.removeItem('pala_jaba_pending_customer_checkout')
  }, [restoredCheckout])

  useEffect(() => {
    function onChange(event) {
      setItems(Array.isArray(event.detail) ? event.detail : getJabaItems())
    }

    window.addEventListener(JABA_CHANGE_EVENT, onChange)
    return () => window.removeEventListener(JABA_CHANGE_EVENT, onChange)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function syncOnLoad() {
      if (!getJabaItems().length) return

      try {
        const { removed } = await syncJabaWithBackend(getBuyerLocation())
        if (!cancelled && removed.length) {
          setSyncRemoved(removed)
        }
      } catch {
        // Si falla la red, conservamos la jaba local.
      }
    }

    syncOnLoad()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false

    async function syncMissingStorePhones() {
      const missingStoreIds = getJabaStoreIdsMissingPhone()
      if (!missingStoreIds.length) {
        setSyncingContacts(false)
        return
      }

      setSyncingContacts(true)

      for (const storeId of missingStoreIds) {
        if (cancelled) return

        try {
          const store = await fetchMarketplaceStore(storeId)
          updateJabaStoreContact(storeId, store.phone, store.store_name)
          if (Array.isArray(store.checkout_phones) && store.checkout_phones.length) {
            setStoreCheckoutPhones(storeId, store.checkout_phones)
          }
        } catch {
          // La tienda puede no existir o no tener teléfono público.
        }
      }

      if (!cancelled) {
        setSyncingContacts(false)
      }
    }

    syncMissingStorePhones()

    return () => {
      cancelled = true
    }
  }, [open])

  const count = useMemo(() => items.reduce((total, item) => total + (item.quantity ?? 1), 0), [items])
  const groups = useMemo(() => groupJabaByStore(items), [items])

  const runWhatsAppCheckout = useCallback(async (payload, delivery = null, paymentMethod = 'contact') => {
    if (!payload?.items?.length || !payload.storePhone) return false

    setCheckoutSubmittingStoreId(payload.storeId ?? '__checkout__')

    try {
      const result = await runStoreCheckout({
        payload,
        delivery,
        displayCurrency,
        cupPerUnit,
        ratesReady,
        areExchangeRatesAvailable,
        needsExchangeRatesForDisplay,
        submitStoreOrder,
        openWhatsAppCheckout,
        paymentMethod,
      })

      if (!result.ok) {
        if (result.error?.status === 401) {
          clearCustomerSession()
          const type = delivery?.mode === 'pickup' ? 'pickup' : 'delivery'
          const pending = { type, payload }
          setPendingCustomerCheckout(pending)
          try { sessionStorage.setItem('pala_jaba_pending_customer_checkout', JSON.stringify(pending)) } catch { /* ignore */ }
          setCustomerLoginOpen(true)
          return true
        }
        if (result.message) {
          window.alert(result.message)
        }
        return false
      }

      if (result.warning) {
        window.alert(result.warning)
      }
      if (paymentMethod === 'qvapay') {
        window.alert('La solicitud de pago fue enviada a la tienda. Te avisaremos cuando acepte y comparta la factura QvaPay.')
      }

      return true
    } finally {
      setCheckoutSubmittingStoreId(null)
    }
  }, [cupPerUnit, displayCurrency, ratesReady])

  const beginWhatsAppCheckout = useCallback(
    async (payload, delivery = null) => {
      if (!payload?.items?.length || !payload.storePhone) return 'fail'

      if (delivery?.payment_method === 'qvapay') {
        if (!payload.qvapayEnabled) return 'fail'
        return (await runWhatsAppCheckout(payload, delivery, 'qvapay')) ? 'done' : 'fail'
      }

      // Catálogo de gestor: WhatsApp ya apunta al gestor; no mostrar selector.
      if (payload.gestorId) {
        return (await runWhatsAppCheckout(payload, delivery)) ? 'done' : 'fail'
      }

      const phones = await loadCheckoutPhonesForStore(payload.storeId)
      if (phones && phones.length > 1) {
        setPhonePicker({ payload, delivery, phones })
        return 'picker'
      }

      if (phones?.length === 1 && phones[0].phone) {
        return (await runWhatsAppCheckout({ ...payload, storePhone: phones[0].phone }, delivery))
          ? 'done'
          : 'fail'
      }

      return (await runWhatsAppCheckout(payload, delivery)) ? 'done' : 'fail'
    },
    [runWhatsAppCheckout],
  )

  const addProduct = useCallback((product) => {
    if (product?.is_available === false) return

    addToJaba(product)
    recordProductPopularity(product.id, 'jaba')
    setJabaToast({
      id: Date.now(),
      message: buildJabaAddedToastMessage(product?.name),
    })
    setBadgePulseId((current) => current + 1)
  }, [])

  const dismissJabaToast = useCallback((toastId) => {
    setJabaToast((current) => (current?.id === toastId ? null : current))
  }, [])

  const removeProduct = useCallback((productId) => {
    removeFromJaba(productId)
  }, [])

  const setQuantity = useCallback((productId, quantity) => {
    setJabaItemQuantity(productId, quantity)
  }, [])

  const importSharedProducts = useCallback((entries) => {
    const skipped = []
    for (const entry of entries ?? []) {
      const product = entry?.product
      const quantity = Math.max(1, Math.floor(Number(entry?.quantity) || 1))
      if (!product?.id || product.is_available === false || product.view_only) {
        if (product?.name) skipped.push(product.name)
        continue
      }
      if (!isInJaba(product.id)) addToJaba(product)
      setJabaItemQuantity(product.id, quantity)
    }
    setOpen(true)
    return skipped
  }, [])

  const clearStore = useCallback((storeId) => {
    clearJabaStore(storeId)
  }, [])

  const clearAll = useCallback(() => {
    clearJaba()
  }, [])

  const requestDeliveryCheckout = useCallback(
    (storeId) => {
      const group = groups.find((entry) => entry.store_id === storeId)
      const storeItems = group?.items ?? getJabaStoreItems(storeId)
      if (!storeItems.length) return false

      const payload = buildCheckoutPayload(group, storeItems)
      if (!payload.storePhone) return false

      return requestCustomerCheckout('delivery', payload)
    },
    [groups, requestCustomerCheckout],
  )

  const requestPickupCheckout = useCallback(
    (storeId) => {
      const group = groups.find((entry) => entry.store_id === storeId)
      const storeItems = group?.items ?? getJabaStoreItems(storeId)
      if (!storeItems.length) return false

      const payload = buildCheckoutPayload(group, storeItems)
      if (!payload.storePhone) return false

      return requestCustomerCheckout('pickup', payload)
    },
    [groups, requestCustomerCheckout],
  )

  /** @deprecated Prefer requestPickupCheckout — kept for callers that still use checkoutStore */
  const checkoutStore = requestPickupCheckout

  const requestCheckout = useCallback(
    (storeId) => {
      const group = groups.find((entry) => entry.store_id === storeId)
      const storeItems = group?.items ?? getJabaStoreItems(storeId)
      if (!storeItems.length) return false

      const payload = buildCheckoutPayload(group, storeItems)
      if (!payload.storePhone) return false

      if (allItemsOfferDelivery(storeItems)) {
        return requestCustomerCheckout('delivery', payload)
      }

      return requestCustomerCheckout('pickup', payload)
    },
    [groups, requestCustomerCheckout],
  )

  const buyProduct = useCallback((product) => {
    const payload = buildDirectBuyCheckoutPayload(product)
    if (!payload?.storePhone) return false

    return requestCustomerCheckout(payload.items[0]?.offers_delivery ? 'delivery' : 'pickup', payload)
  }, [requestCustomerCheckout])

  const finishCustomerLogin = useCallback(() => {
    setCustomerLoginOpen(false)
    setPendingCustomerCheckout(null)
    if (pendingCustomerCheckout) continueCheckout(pendingCustomerCheckout.type, pendingCustomerCheckout.payload)
    try { sessionStorage.removeItem('pala_jaba_pending_customer_checkout') } catch { /* ignore */ }
  }, [continueCheckout, pendingCustomerCheckout])

  const closeCustomerLogin = useCallback(() => {
    setCustomerLoginOpen(false)
    setPendingCustomerCheckout(null)
    try { sessionStorage.removeItem('pala_jaba_pending_customer_checkout') } catch { /* ignore */ }
  }, [])

  const closeDeliveryCheckout = useCallback(() => {
    setDeliveryCheckout(null)
  }, [])

  const closePickupCheckout = useCallback(() => {
    setPickupCheckout(null)
  }, [])

  const closePhonePicker = useCallback(() => {
    setPhonePicker(null)
  }, [])

  const confirmDeliveryCheckout = useCallback(
    async (delivery) => {
      if (!deliveryCheckout) return false

      const result = await beginWhatsAppCheckout(deliveryCheckout, delivery)
      if (result === 'done') {
        setDeliveryCheckout(null)
        setPickupCheckout(null)
      }
      return result !== 'fail'
    },
    [deliveryCheckout, beginWhatsAppCheckout],
  )

  const confirmPickupCheckout = useCallback(
    async (pickup) => {
      if (!pickupCheckout) return false

      const result = await beginWhatsAppCheckout(pickupCheckout, pickup)
      if (result === 'done') {
        setPickupCheckout(null)
        setDeliveryCheckout(null)
      }
      return result !== 'fail'
    },
    [pickupCheckout, beginWhatsAppCheckout],
  )

  const confirmPhonePicker = useCallback(
    async (selected) => {
      if (!phonePicker || !selected?.phone) return false

      const success = await runWhatsAppCheckout(
        { ...phonePicker.payload, storePhone: selected.phone },
        phonePicker.delivery,
      )
      if (success) {
        setPhonePicker(null)
        setDeliveryCheckout(null)
        setPickupCheckout(null)
      }
      return success
    },
    [phonePicker, runWhatsAppCheckout],
  )

  const dismissSyncAlert = useCallback(() => {
    setSyncRemoved(null)
  }, [])

  const value = useMemo(
    () => ({
      items,
      count,
      groups,
      open,
      syncingContacts,
      deliveryCheckout,
      pickupCheckout,
      checkoutSubmittingStoreId,
      badgePulseId,
      isInJaba,
      addProduct,
      importSharedProducts,
      removeProduct,
      setQuantity,
      clearStore,
      clearAll,
      checkoutStore,
      requestDeliveryCheckout,
      requestPickupCheckout,
      requestCheckout,
      buyProduct,
      closeDeliveryCheckout,
      closePickupCheckout,
      confirmDeliveryCheckout,
      confirmPickupCheckout,
      openPanel: () => setOpen(true),
      closePanel: () => setOpen(false),
      togglePanel: () => setOpen((current) => !current),
    }),
    [
      items,
      count,
      groups,
      open,
      syncingContacts,
      deliveryCheckout,
      pickupCheckout,
      checkoutSubmittingStoreId,
      badgePulseId,
      addProduct,
      importSharedProducts,
      removeProduct,
      setQuantity,
      clearStore,
      clearAll,
      checkoutStore,
      requestDeliveryCheckout,
      requestPickupCheckout,
      requestCheckout,
      buyProduct,
      closeDeliveryCheckout,
      closePickupCheckout,
      confirmDeliveryCheckout,
      confirmPickupCheckout,
    ],
  )

  const activeCheckoutModal = phonePicker
    ? null
    : deliveryCheckout
      ? 'delivery'
      : pickupCheckout
        ? 'pickup'
        : null

  return createElement(
    BuyerJabaContext.Provider,
    { value },
    children,
    createElement(BuyerJabaToast, { toast: jabaToast, onDone: dismissJabaToast }),
    createElement(BuyerDeliveryCheckoutModal, {
      checkout: activeCheckoutModal === 'delivery' ? deliveryCheckout : null,
      checkoutSubmitting: Boolean(checkoutSubmittingStoreId),
      onClose: closeDeliveryCheckout,
      onConfirm: confirmDeliveryCheckout,
      onQvaPayRequired: () => setQvaPayPromptOpen(true),
    }),
    createElement(BuyerPickupCheckoutModal, {
      checkout: activeCheckoutModal === 'pickup' ? pickupCheckout : null,
      checkoutSubmitting: Boolean(checkoutSubmittingStoreId),
      onClose: closePickupCheckout,
      onConfirm: confirmPickupCheckout,
      onQvaPayRequired: () => setQvaPayPromptOpen(true),
    }),
    createElement(BuyerPhoneCheckoutModal, {
      picker: phonePicker,
      checkoutSubmitting: Boolean(checkoutSubmittingStoreId),
      onClose: closePhonePicker,
      onConfirm: confirmPhonePicker,
    }),
    customerLoginOpen
      ? createElement(BuyerCustomerLoginModal, { onClose: closeCustomerLogin, onLogin: finishCustomerLogin })
      : null,
    createElement(CustomerQvaPayPrompt, {
      open: qvaPayPromptOpen,
      onAddUser: () => {
        setQvaPayPromptOpen(false)
        navigate('/cliente/perfil', { state: { focusQvaPay: true } })
      },
      onDone: (dismissForever) => {
        setQvaPayPromptOpen(false)
        if (!dismissForever) return
        const token = getCustomerToken()
        if (!token) return
        void dismissCustomerQvaPayPrompt(token).then(() => {
          const profile = getCustomerProfile()
          if (profile) updateCustomerProfile({ ...profile, qvapay_prompt_dismissed: true })
        }).catch(() => {})
      },
    }),
    syncRemoved?.length
      ? createElement(BuyerJabaSyncAlert, { removed: syncRemoved, onClose: dismissSyncAlert })
      : null,
  )
}

export function useBuyerJaba() {
  const context = useContext(BuyerJabaContext)
  if (!context) {
    throw new Error('useBuyerJaba debe usarse dentro de BuyerJabaProvider')
  }
  return context
}
