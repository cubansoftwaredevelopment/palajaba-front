import { useCallback, useEffect, useMemo, useState } from 'react'
import SellerEmptyState from '../../components/seller/SellerEmptyState'
import SellerOrderDetailModal from '../../components/seller/SellerOrderDetailModal'
import SellerOrderItem from '../../components/seller/SellerOrderItem'
import SellerOrdersGroup from '../../components/seller/SellerOrdersGroup'
import SellerOrdersTabs from '../../components/seller/SellerOrdersTabs'
import SellerPageHeader from '../../components/seller/SellerPageHeader'
import { sellerPageWrap, sellerSectionGap } from '../../components/seller/sellerStyles'
import {
  deleteSellerOrder,
  downloadSellerOrderInvoice,
  fetchSellerOrders,
  updateSellerOrder,
} from '../../lib/api'
import { getSellerToken } from '../../lib/sellerAuth'
import { SELLER_ORDERS_REFRESH_EVENT } from '../../lib/sellerOrdersRefresh'

const PendingIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)

const CompletedIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const EmptyOrdersIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
  </svg>
)

export default function SellerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('pending')
  const [tabInitialized, setTabInitialized] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [saveError, setSaveError] = useState('')

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }

    try {
      const token = getSellerToken()
      const data = await fetchSellerOrders(token)
      setOrders(data)
    } catch (err) {
      if (!silent) {
        setOrders([])
        setError(err.message || 'No se pudieron cargar los pedidos.')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    function refreshSilently() {
      loadOrders({ silent: true })
    }

    function handleVisible() {
      if (document.visibilityState === 'visible') {
        refreshSilently()
      }
    }

    window.addEventListener(SELLER_ORDERS_REFRESH_EVENT, refreshSilently)
    const intervalId = window.setInterval(refreshSilently, 45_000)
    document.addEventListener('visibilitychange', handleVisible)

    return () => {
      window.removeEventListener(SELLER_ORDERS_REFRESH_EVENT, refreshSilently)
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisible)
    }
  }, [loadOrders])

  const { pendingOrders, completedOrders } = useMemo(() => {
    const pending = []
    const completed = []

    for (const order of orders) {
      if (order.status === 'completed') {
        completed.push(order)
      } else {
        pending.push(order)
      }
    }

    return { pendingOrders: pending, completedOrders: completed }
  }, [orders])

  useEffect(() => {
    if (loading || tabInitialized) return
    setActiveTab(pendingOrders.length > 0 ? 'pending' : 'completed')
    setTabInitialized(true)
  }, [loading, tabInitialized, pendingOrders.length])

  const visibleOrders = activeTab === 'pending' ? pendingOrders : completedOrders

  async function handleDownloadInvoice(type) {
    if (!selectedOrder) return

    setDownloading(type)
    setSaveError('')

    try {
      const token = getSellerToken()
      await downloadSellerOrderInvoice(token, selectedOrder.id, type)
    } catch (err) {
      setSaveError(err.message || 'No se pudo generar la factura.')
    } finally {
      setDownloading(null)
    }
  }

  async function handleCancelOrder() {
    if (!selectedOrder) return

    setCancelling(true)
    setSaveError('')

    try {
      const token = getSellerToken()
      await deleteSellerOrder(token, selectedOrder.id)
      setOrders((current) => current.filter((item) => item.id !== selectedOrder.id))
      setSelectedOrder(null)
    } catch (err) {
      setSaveError(err.message || 'No se pudo cancelar el pedido.')
    } finally {
      setCancelling(false)
    }
  }

  async function handleSaveOrder(payload) {
    if (!selectedOrder) return

    setSaving(true)
    setSaveError('')

    try {
      const token = getSellerToken()
      const updated = await updateSellerOrder(token, selectedOrder.id, payload)
      setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setSelectedOrder(updated)

      if (updated.status === 'completed') {
        setActiveTab('completed')
      }
    } catch (err) {
      setSaveError(err.message || 'No se pudo actualizar el pedido.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className={`animate-fade-in ${sellerPageWrap} ${sellerSectionGap}`}>
      <SellerPageHeader
        eyebrow="Pedidos"
        title="Bandeja de pedidos"
        subtitle="Usa las pestañas para alternar entre pendientes y ventas ya cerradas."
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-brand-carmelita/80">Cargando pedidos…</p>
      ) : null}

      {!loading && error ? (
        <div className="rounded-2xl border border-brand-carmelita/20 bg-brand-carmelita/10 px-4 py-5 text-center">
          <p className="text-sm text-brand-carmelita">{error}</p>
          <button
            type="button"
            onClick={() => loadOrders()}
            className="mt-3 text-sm font-semibold text-brand-green underline-offset-2 hover:underline"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!loading && !error && orders.length === 0 ? (
        <SellerEmptyState
          icon={EmptyOrdersIcon}
          title="Sin pedidos por ahora"
          description="Cuando un cliente pida por WhatsApp desde Pa' La Jaba, aparecerá en la pestaña Por confirmar."
          badge={null}
        />
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <>
          <SellerOrdersTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingCount={pendingOrders.length}
            completedCount={completedOrders.length}
          />

          <SellerOrdersGroup
            tone={activeTab === 'pending' ? 'pending' : 'completed'}
            count={visibleOrders.length}
            emptyIcon={activeTab === 'pending' ? PendingIcon : CompletedIcon}
            emptyTitle={activeTab === 'pending' ? 'Nada pendiente' : 'Aún sin ventas cerradas'}
            emptyDescription={
              activeTab === 'pending'
                ? 'Cuando llegue un pedido nuevo desde la jaba, lo verás en esta pestaña.'
                : 'Al marcar un pedido como realizado, aparecerá aquí.'
            }
          >
            {visibleOrders.map((order) => (
              <SellerOrderItem
                key={order.id}
                order={order}
                variant={activeTab === 'pending' ? 'pending' : 'completed'}
                onOpen={setSelectedOrder}
              />
            ))}
          </SellerOrdersGroup>
        </>
      ) : null}

      {selectedOrder ? (
        <SellerOrderDetailModal
          order={selectedOrder}
          saving={saving}
          cancelling={cancelling}
          downloading={downloading}
          error={saveError}
          onClose={() => {
            setSelectedOrder(null)
            setSaveError('')
            setDownloading(null)
          }}
          onSave={handleSaveOrder}
          onCancel={handleCancelOrder}
          onDownloadInvoice={handleDownloadInvoice}
        />
      ) : null}
    </section>
  )
}
