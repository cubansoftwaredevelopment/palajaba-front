import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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

import { fetchMarketplaceStore } from '../lib/api'
import { getBuyerLocation } from '../lib/buyerLocation'
import { syncJabaWithBackend } from '../lib/syncBuyerJaba'

import { needsExchangeRatesForDisplay } from '../lib/displayPrice'
import { areExchangeRatesAvailable } from '../lib/exchangeRates'
import { useBuyerDisplayCurrency } from './BuyerDisplayCurrencyContext'
import { recordProductPopularity } from '../lib/productPopularity'
import { submitStoreOrder } from '../lib/submitStoreOrder'
import { openWhatsAppCheckout } from '../lib/whatsappOrder'
import { runStoreCheckout } from '../lib/runStoreCheckout'
import {
  getStoreCheckoutPhones,
  setStoreCheckoutPhones,
} from '../lib/storeCheckoutPhones'

import BuyerDeliveryCheckoutModal from '../components/buyer/BuyerDeliveryCheckoutModal'
import BuyerPhoneCheckoutModal from '../components/buyer/BuyerPhoneCheckoutModal'
import BuyerJabaSyncAlert from '../components/buyer/BuyerJabaSyncAlert'

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

export function BuyerJabaProvider({ children }) {
  const { currency: displayCurrency, cupPerUnit, ratesReady } = useBuyerDisplayCurrency()
  const [items, setItems] = useState(getJabaItems)
  const [open, setOpen] = useState(false)
  const [syncingContacts, setSyncingContacts] = useState(false)
  const [deliveryCheckout, setDeliveryCheckout] = useState(null)
  const [phonePicker, setPhonePicker] = useState(null)
  const [syncRemoved, setSyncRemoved] = useState(null)
  const [checkoutSubmittingStoreId, setCheckoutSubmittingStoreId] = useState(null)

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

  const runWhatsAppCheckout = useCallback(async (payload, delivery = null) => {
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
      })

      if (!result.ok) {
        if (result.message) {
          window.alert(result.message)
        }
        return false
      }

      if (result.warning) {
        window.alert(result.warning)
      }

      return true
    } finally {
      setCheckoutSubmittingStoreId(null)
    }
  }, [cupPerUnit, displayCurrency, ratesReady])

  const beginWhatsAppCheckout = useCallback(
    async (payload, delivery = null) => {
      if (!payload?.items?.length || !payload.storePhone) return 'fail'

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
    addToJaba(product)
    recordProductPopularity(product.id, 'jaba')
  }, [])

  const removeProduct = useCallback((productId) => {
    removeFromJaba(productId)
  }, [])

  const setQuantity = useCallback((productId, quantity) => {
    setJabaItemQuantity(productId, quantity)
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

      setDeliveryCheckout(payload)
      return true
    },
    [groups],
  )

  const checkoutStore = useCallback(
    (storeId) => {
      const group = groups.find((entry) => entry.store_id === storeId)
      const storeItems = group?.items ?? getJabaStoreItems(storeId)
      if (!storeItems.length) return false

      const payload = buildCheckoutPayload(group, storeItems)
      return beginWhatsAppCheckout(payload).then((result) => result !== 'fail')
    },
    [groups, beginWhatsAppCheckout],
  )

  const requestCheckout = useCallback(
    (storeId) => {
      const group = groups.find((entry) => entry.store_id === storeId)
      const storeItems = group?.items ?? getJabaStoreItems(storeId)
      if (!storeItems.length) return false

      const payload = buildCheckoutPayload(group, storeItems)
      if (!payload.storePhone) return false

      if (allItemsOfferDelivery(storeItems)) {
        setDeliveryCheckout(payload)
        return true
      }

      return beginWhatsAppCheckout(payload).then((result) => result !== 'fail')
    },
    [groups, beginWhatsAppCheckout],
  )

  const buyProduct = useCallback(
    (product) => {
      const payload = buildDirectBuyCheckoutPayload(product)
      if (!payload?.storePhone) return false

      if (payload.items[0]?.offers_delivery) {
        setDeliveryCheckout(payload)
        return true
      }

      return beginWhatsAppCheckout(payload).then((result) => result !== 'fail')
    },
    [beginWhatsAppCheckout],
  )

  const closeDeliveryCheckout = useCallback(() => {
    setDeliveryCheckout(null)
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
      }
      return result !== 'fail'
    },
    [deliveryCheckout, beginWhatsAppCheckout],
  )

  const confirmPickupCheckout = useCallback(async () => {
    if (!deliveryCheckout) return false

    const result = await beginWhatsAppCheckout(deliveryCheckout)
    if (result === 'done') {
      setDeliveryCheckout(null)
    }
    return result !== 'fail'
  }, [deliveryCheckout, beginWhatsAppCheckout])

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
      checkoutSubmittingStoreId,
      isInJaba,
      addProduct,
      removeProduct,
      setQuantity,
      clearStore,
      clearAll,
      checkoutStore,
      requestDeliveryCheckout,
      requestCheckout,
      buyProduct,
      closeDeliveryCheckout,
      confirmDeliveryCheckout,
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
      checkoutSubmittingStoreId,
      addProduct,
      removeProduct,
      setQuantity,
      clearStore,
      clearAll,
      checkoutStore,
      requestDeliveryCheckout,
      requestCheckout,
      buyProduct,
      closeDeliveryCheckout,
      confirmDeliveryCheckout,
    ],
  )

  return (
    <BuyerJabaContext.Provider value={value}>
      {children}
      <BuyerDeliveryCheckoutModal
        checkout={phonePicker ? null : deliveryCheckout}
        checkoutSubmitting={Boolean(checkoutSubmittingStoreId)}
        onClose={closeDeliveryCheckout}
        onConfirm={confirmDeliveryCheckout}
        onPickup={confirmPickupCheckout}
      />
      <BuyerPhoneCheckoutModal
        picker={phonePicker}
        checkoutSubmitting={Boolean(checkoutSubmittingStoreId)}
        onClose={closePhonePicker}
        onConfirm={confirmPhonePicker}
      />
      {syncRemoved?.length ? (
        <BuyerJabaSyncAlert removed={syncRemoved} onClose={dismissSyncAlert} />
      ) : null}
    </BuyerJabaContext.Provider>
  )
}

export function useBuyerJaba() {
  const context = useContext(BuyerJabaContext)
  if (!context) {
    throw new Error('useBuyerJaba debe usarse dentro de BuyerJabaProvider')
  }
  return context
}
