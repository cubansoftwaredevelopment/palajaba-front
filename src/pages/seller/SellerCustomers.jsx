import { useEffect, useState } from 'react'
import { fetchStoreCustomers } from '../../auth/api'
import { getSellerToken } from '../../lib/sellerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'
import { SELLER_ORDERS_REFRESH_EVENT } from '../../lib/sellerOrdersRefresh'

function dateLabel(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(new Date(value))
}

const statusLabel = { pending_confirmation: 'Pendiente', completed: 'Confirmado', cancelled: 'Cancelado' }

export default function SellerCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    function loadCustomers() {
      fetchStoreCustomers(getSellerToken())
      .then(setCustomers)
      .catch((cause) => setError(getUserFacingMessage(cause, 'No se pudo cargar la lista de clientes.')))
      .finally(() => setLoading(false))
    }
    loadCustomers()
    window.addEventListener(SELLER_ORDERS_REFRESH_EVENT, loadCustomers)
    return () => window.removeEventListener(SELLER_ORDERS_REFRESH_EVENT, loadCustomers)
  }, [])

  return (
    <main className="mx-auto w-full max-w-6xl p-4 sm:p-6">
      <header className="mb-5"><p className="text-xs font-bold uppercase tracking-widest text-brand-green">Tu tienda</p><h1 className="mt-1 font-display text-2xl font-bold text-brand-carmelita sm:text-3xl">Clientes</h1><p className="mt-1 text-sm text-brand-carmelita/70">Clientes que han realizado pedidos en tu tienda.</p></header>
      {error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="rounded-2xl bg-brand-white p-5 text-sm">Cargando clientes…</p> : !customers.length ? <p className="rounded-2xl bg-brand-white p-5 text-sm text-brand-carmelita/70">Aún no tienes clientes registrados por pedidos.</p> : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{customers.map((customer) => <li key={customer.id} className="rounded-2xl border border-brand-green/10 bg-brand-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-brand-carmelita">{customer.full_name}</h2><span className="rounded-full bg-brand-green/8 px-2.5 py-1 text-xs font-bold text-brand-green">{customer.orders_count} pedido{customer.orders_count === 1 ? '' : 's'}</span></div><a href={`tel:${customer.phone}`} className="mt-3 block text-sm text-brand-green">{customer.phone}</a><a href={`mailto:${customer.email}`} className="mt-1 block break-all text-sm text-brand-green">{customer.email}</a><p className="mt-2 text-xs text-brand-carmelita/60">Último pedido: {dateLabel(customer.last_order_at)}</p><ul className="mt-3 space-y-1 border-t border-brand-green/10 pt-3">{customer.orders.slice(0, 4).map((order) => <li key={order.id} className="flex justify-between gap-3 text-xs"><span>{dateLabel(order.created_at)}</span><span className="font-semibold">{statusLabel[order.status] || order.status}</span></li>)}</ul></li>)}</ul>
      )}
    </main>
  )
}
