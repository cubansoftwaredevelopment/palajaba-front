import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  adminAlertError,
  adminAlertSuccess,
  adminCard,
  adminFocusRing,
  adminInput,
  adminMuted,
  adminSection,
} from '../components/admin/adminStyles'
import LoadingState from '../components/ui/LoadingState'
import { fetchAdminDispute, fetchAdminDisputes, ruleAdminDispute } from '../lib/api'
import { clearAdminToken, getAdminToken } from '../lib/adminAuth'
import { resolveMediaUrl } from '../lib/media'
import { getUserFacingMessage, isSessionError } from '../lib/userFacingError'

const PRODUCT_STATUS = { publico: 'Público', agotado: 'Agotado', borrado: 'Borrado' }

function formatWhen(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function orderClass(disputed) {
  return `rounded-xl border px-3 py-2 text-sm ${disputed ? 'border-amber-400 bg-amber-500/15' : 'border-zinc-800 bg-zinc-900/40'}`
}

function OrderList({ orders }) {
  if (!orders?.length) return <p className={adminMuted}>Sin pedidos.</p>
  return (
    <ul className="space-y-2">
      {orders.map((order) => (
        <li key={order.id} className={orderClass(order.disputed)}>
          <p className="font-semibold text-zinc-50">#{order.code}{order.disputed ? ' · En disputa' : ''}</p>
          <p className={adminMuted}>{order.store_name} · {order.status} · {order.total || 'Sin total'}</p>
          <p className={adminMuted}>{formatWhen(order.created_at)}</p>
        </li>
      ))}
    </ul>
  )
}

export default function AdminDisputes() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rulingOpen, setRulingOpen] = useState(false)
  const [winner, setWinner] = useState('seller')
  const [reason, setReason] = useState('')
  const [refundUsername, setRefundUsername] = useState('')
  const [ruling, setRuling] = useState(false)
  const [listVersion, setListVersion] = useState(0)

  useEffect(() => {
    let active = true
    fetchAdminDisputes(getAdminToken())
      .then((data) => {
        if (!active) return
        setItems(data)
        setSelectedId((current) => current || data.find((item) => item.status === 'open')?.id || data[0]?.id || '')
        setLoading(false)
      })
      .catch((cause) => {
        if (!active) return
        if (isSessionError(cause)) {
          clearAdminToken()
          navigate('/admin', { replace: true })
          return
        }
        setError(getUserFacingMessage(cause, 'No pudimos cargar las disputas.'))
        setLoading(false)
      })
    return () => { active = false }
  }, [navigate, listVersion])

  useEffect(() => {
    if (!selectedId) return undefined
    let active = true
    fetchAdminDispute(getAdminToken(), selectedId)
      .then((data) => { if (active) { setDetail(data); setDetailLoading(false) } })
      .catch((cause) => { if (active) { setError(getUserFacingMessage(cause, 'No pudimos abrir la disputa.')); setDetailLoading(false) } })
    return () => { active = false }
  }, [selectedId, listVersion])

  async function submitRuling(event) {
    event.preventDefault()
    setRuling(true)
    setError('')
    setSuccess('')
    try {
      await ruleAdminDispute(getAdminToken(), selectedId, {
        winner,
        reason,
        refund_username: winner === 'buyer' ? refundUsername : null,
      })
      setSuccess('El fallo quedó registrado y ambas partes fueron avisadas.')
      setRulingOpen(false)
      setReason('')
      window.dispatchEvent(new Event('admin-disputes-changed'))
      setListVersion((value) => value + 1)
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos resolver la disputa.'))
    } finally {
      setRuling(false)
    }
  }

  if (loading) return <div className={adminSection}><LoadingState /></div>

  return (
    <div className={adminSection}>
      <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[18rem_1fr]">
        <section className="space-y-2">
          {items.length === 0 ? <p className={adminMuted}>No hay disputas.</p> : null}
          {items.map((item) => (
            <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`${adminCard} w-full text-left ${adminFocusRing} ${selectedId === item.id ? 'border-brand-green/50' : ''}`}>
              <p className="font-semibold text-zinc-50">Pedido #{item.order_code}</p>
              <p className="text-sm text-zinc-300">{item.buyer_name} · {item.store_name}</p>
              <p className="mt-1 text-xs font-bold text-brand-yellow">{item.parties_label}</p>
              <p className={`mt-1 text-xs ${item.status === 'open' ? 'text-amber-300' : 'text-zinc-500'}`}>{item.status === 'open' ? 'Por resolver' : 'Resuelta'}</p>
            </button>
          ))}
        </section>

        <section className={adminCard}>
          {error ? <p role="alert" className={adminAlertError}>{error}</p> : null}
          {success ? <p role="status" className={adminAlertSuccess}>{success}</p> : null}
          {!selectedId ? <p className={adminMuted}>No hay una disputa seleccionada.</p> : detailLoading || !detail ? <LoadingState /> : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-50">Pedido #{detail.order_code}</h2>
                  <p className="mt-1 text-sm font-bold text-brand-yellow">{detail.parties_label}</p>
                  {detail.status === 'resolved' ? <p className={`mt-2 text-sm ${adminMuted}`}>Resuelta a favor de {detail.winner === 'buyer' ? 'el comprador' : 'la tienda'}. {detail.reason}</p> : null}
                </div>
                {detail.status === 'open' ? (
                  <button type="button" className={`rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white ${adminFocusRing}`} onClick={() => { setWinner('seller'); setRulingOpen(true) }}>
                    Resolver
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <article className="space-y-3">
                  <h3 className="font-semibold text-zinc-50">Comprador</h3>
                  <div className="flex items-center gap-3">
                    {detail.buyer.profile_photo_url ? <img src={resolveMediaUrl(detail.buyer.profile_photo_url)} alt="" className="h-14 w-14 rounded-full object-cover" /> : <span className="grid h-14 w-14 place-items-center rounded-full bg-zinc-800 text-lg font-bold">{detail.buyer.full_name?.[0] || '?'}</span>}
                    <div className="text-sm text-zinc-200">
                      <p className="font-semibold">{detail.buyer.full_name}</p>
                      <p>{detail.buyer.phone}</p>
                      <p>{detail.buyer.email}</p>
                      <p>Carnet {detail.buyer.identity_card || '—'}</p>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-300">Historial de pedidos</h4>
                  <OrderList orders={detail.buyer.orders} />
                </article>

                <article className="space-y-3">
                  <h3 className="font-semibold text-zinc-50">Tienda</h3>
                  <div className="text-sm text-zinc-200">
                    <p className="font-semibold">{detail.store.name}</p>
                    <p>{detail.store.phone}</p>
                    <p>{detail.store.email}</p>
                    {detail.store.sales_url ? <a className="font-bold text-brand-green" href={detail.store.sales_url}>Ver la tienda</a> : null}
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-300">Productos</h4>
                  <ul className="space-y-2">
                    {detail.store.products.map((product) => (
                      <li key={product.id} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800 px-3 py-2 text-sm">
                        <span className="text-zinc-100">{product.name}</span>
                        <span className={product.status === 'borrado' ? 'text-red-300' : product.status === 'agotado' ? 'text-amber-300' : 'text-brand-green'}>{PRODUCT_STATUS[product.status] || product.status}</span>
                      </li>
                    ))}
                  </ul>
                  <h4 className="text-sm font-semibold text-zinc-300">Pedidos de la tienda</h4>
                  <OrderList orders={detail.store.orders} />
                </article>
              </div>
            </div>
          )}
        </section>
      </div>

      {rulingOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form onSubmit={submitRuling} className={`${adminCard} w-full max-w-md space-y-3`}>
            <h2 className="text-lg font-semibold text-zinc-50">Fallar la disputa</h2>
            <label className="block text-sm text-zinc-200">
              <input type="radio" name="winner" checked={winner === 'seller'} onChange={() => setWinner('seller')} /> A favor de la tienda
            </label>
            <label className="block text-sm text-zinc-200">
              <input type="radio" name="winner" checked={winner === 'buyer'} onChange={() => setWinner('buyer')} /> A favor del comprador
            </label>
            {winner === 'buyer' && !detail?.buyer_username ? (
              <label className="block text-sm text-zinc-200">Usuario QvaPay del comprador
                <input value={refundUsername} onChange={(event) => setRefundUsername(event.target.value)} className={`${adminInput} mt-1`} required />
              </label>
            ) : null}
            <label className="block text-sm text-zinc-200">Motivo
              <textarea value={reason} onChange={(event) => setReason(event.target.value)} required minLength={3} className={`${adminInput} mt-1 min-h-24`} />
            </label>
            <div className="flex gap-2">
              <button type="button" className={`rounded-xl border border-zinc-700 px-4 py-2 text-sm ${adminFocusRing}`} onClick={() => setRulingOpen(false)}>Cancelar</button>
              <button type="submit" disabled={ruling} className={`rounded-xl bg-brand-green px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${adminFocusRing}`}>{ruling ? 'Transfiriendo…' : 'Confirmar fallo'}</button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
