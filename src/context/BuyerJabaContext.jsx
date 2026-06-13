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

import { useBuyerDisplayCurrency } from './BuyerDisplayCurrencyContext'
import { recordProductPopularity } from '../lib/productPopularity'
import { submitStoreOrder } from '../lib/submitStoreOrder'
import { openWhatsAppCheckout } from '../lib/whatsappOrder'

import BuyerDeliveryCheckoutModal from '../components/buyer/BuyerDeliveryCheckoutModal'
import BuyerJabaSyncAlert from '../components/buyer/BuyerJabaSyncAlert'

const BuyerJabaContext = createContext(null)

function buildCheckoutPayload(group, storeItems) {
  return {
    storeId: group?.store_id ?? storeItems[0]?.store_id,
    storeName: group?.store_name ?? storeItems[0]?.store_name ?? 'Tienda',
    storePhone: group?.store_phone ?? resolveStorePhone(storeItems),
    items: storeItems,
  }
}

export function BuyerJabaProvider({ children }) {
  const { currency: displayCurrency, cupPerUnit } = useBuyerDisplayCurrency()
  const [items, setItems] = useState(getJabaItems)
  const [open, setOpen] = useState(false)
  const [syncingContacts, setSyncingContacts] = useState(false)
  const [deliveryCheckout, setDeliveryCheckout] = useState(null)
  const [syncRemoved, setSyncRemoved] = useState(null)

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

  const runWhatsAppCheckout = useCallback((payload, delivery = null) => {
    if (!payload?.items?.length || !payload.storePhone) return false

    const opened = openWhatsAppCheckout({
      storeName: payload.storeName,
      storePhone: payload.storePhone,
      items: payload.items,
      delivery,
      displayCurrency,
      cupPerUnit,
    })

    if (!opened) return false

    submitStoreOrder({
      storeId: payload.storeId,
      items: payload.items,
      delivery,
      displayCurrency,
      cupPerUnit,
    }).catch((err) => {
      console.error('No se pudo registrar el pedido en Pa\' La Jaba:', err)
    })

    return true
  }, [cupPerUnit, displayCurrency])

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
      return runWhatsAppCheckout(payload)
    },
    [groups, runWhatsAppCheckout],
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

      return runWhatsAppCheckout(payload)
    },
    [groups, runWhatsAppCheckout],
  )

  const buyProduct = useCallback(
    (product) => {
      const payload = buildDirectBuyCheckoutPayload(product)
      if (!payload?.storePhone) return false

      if (payload.items[0]?.offers_delivery) {
        setDeliveryCheckout(payload)
        return true
      }

      return runWhatsAppCheckout(payload)
    },
    [runWhatsAppCheckout],
  )

  const closeDeliveryCheckout = useCallback(() => {
    setDeliveryCheckout(null)
  }, [])

  const confirmDeliveryCheckout = useCallback(
    (delivery) => {
      if (!deliveryCheckout) return false

      const success = runWhatsAppCheckout(deliveryCheckout, delivery)
      if (success) {
        setDeliveryCheckout(null)
      }
      return success
    },
    [deliveryCheckout, runWhatsAppCheckout],
  )

  const confirmPickupCheckout = useCallback(() => {
    if (!deliveryCheckout) return false

    const success = runWhatsAppCheckout(deliveryCheckout)
    if (success) {
      setDeliveryCheckout(null)
    }
    return success
  }, [deliveryCheckout, runWhatsAppCheckout])

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
        checkout={deliveryCheckout}
        onClose={closeDeliveryCheckout}
        onConfirm={confirmDeliveryCheckout}
        onPickup={confirmPickupCheckout}
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
