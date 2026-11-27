import { Children, cloneElement, isValidElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { openExternalUrl } from '../../appReleases/utils/nativeApp.js'
import BuyerProductCard from '../componentes/BuyerProductCard.jsx'
import BuyerStoreBannerCover from '../componentes/BuyerStoreBannerCover.jsx'
import { isCustomerAuthenticated } from '../../customer/utils/customerAuth.js'
import SellerOrderItem from '../../seller/componentes/SellerOrderItem.jsx'
import { isSellerAuthenticated } from '../../seller/utils/sellerAuth.js'
import { CUBA_PROVINCES } from '../../shared/utils/cubaLocations.js'
import SellerStatGrid from '../../seller/componentes/SellerStatGrid.jsx'
import SellerSeriesChart from '../../SellerStatistics/componentes/SellerSeriesChart.jsx'
import SellerTopSold from '../../SellerStatistics/componentes/SellerTopSold.jsx'
import SellerStatsKpis from '../../SellerStatistics/componentes/SellerStatsKpis.jsx'
import SellerViewsByZone from '../../SellerStatistics/componentes/SellerViewsByZone.jsx'
import SellerHighViewsLowSales from '../../SellerStatistics/componentes/SellerHighViewsLowSales.jsx'
import AppLocationMap from '../../map/componentes/AppLocationMap.jsx'
import { sellerNoticeToastCard } from '../../seller/componentes/sellerStyles.js'
import { ADVERTISING_PLANS } from '../../subscriptions/utils/advertisingPlans.js'
import { PLAN_PLUGINS } from '../../subscriptions/utils/planPlugins.js'
import { resolveMediaUrl } from '../../shared/utils/media.js'
import {
  buyerJabaCheckoutActions,
  buyerJabaItemImage,
  buyerJabaItemRow,
  buyerJabaPrimaryBtn,
  buyerJabaQtyBtn,
  buyerJabaSecondaryBtn,
  buyerJabaShippingNote,
  buyerJabaStoreAccordionBtn,
  buyerJabaStoreSection,
  buyerJabaStoreTitle,
} from '../componentes/buyerStyles.js'

const INSTAGRAM_URL = 'https://instagram.com/palajabaaa'
const FALL_STEP_MS = 420
const COVER_LOGO = '/images/pitch/logo-cover.png'
const NEXT_BUTTON = 'flex min-h-11 w-full items-center justify-center rounded-full bg-brand-green px-5 text-sm font-semibold text-brand-white shadow-[0_6px_20px_rgba(89,128,44,0.3)] touch-manipulation'

const BEATS = [
  'Pa\' la jaba, mi socio',
  'Un proyecto cubano',
  'El producto, en tu zona',
  'Lo que te llega a ti',
  'El que ya te compró, que vuelva',
  'Otro vende tu catálogo',
  'El pedido va en la ruta',
  'El dinero espera a que reciba',
  'Si no cuadra, se revisa',
  'Cómo va la tienda',
  'Las fotos detrás del nombre',
  'Reels, posts e historias',
  'Tu tienda, con tu cara',
  'El plan lo armas tú',
]

const HOLGUIN = CUBA_PROVINCES.find((province) => province.id === 'holguin')
const PINAR = CUBA_PROVINCES.find((province) => province.id === 'pinar-del-rio')

const PLAN_ON_NOW = ['mensajeros', 'gestores']

const PRODUCT = {
  id: 'pitch-malanga',
  name: 'Malanga',
  image_url: '/images/pitch/malanga.png',
  base_price: 250,
  base_currency: 'CUP',
  accepted_currencies: ['CUP'],
  stock_quantity: 12,
  stock_unit: 'lb',
  is_available: true,
  store: { store_name: 'La Tienda', store_slug: 'la-tienda' },
}

const HELD_UNTIL = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString()
const VISITS = {
  total: 128,
  points: [
    { label: 'Lun', value: 12 },
    { label: 'Mar', value: 18 },
    { label: 'Mié', value: 15 },
    { label: 'Jue', value: 22 },
    { label: 'Vie', value: 19 },
    { label: 'Sáb', value: 28 },
    { label: 'Dom', value: 14 },
  ],
}
const PITCH_STATS = { profile_views: 128, confirmed_orders: 36, active_products: 18 }
const PITCH_KPIS = {
  visitors: 86,
  product_views: 214,
  delivered_orders: 29,
  revenue: [{ total: 18400, currency: 'CUP' }],
  site_conversion_rate: 17.4,
  site_jabas: 15,
  delivery: [{ total: 900, currency: 'CUP' }],
}
const VIEWS_BY_ZONE = {
  items: [
    { municipality_name: 'Holguín', province_name: 'Holguín', views: 54 },
    { municipality_name: 'Gibara', province_name: 'Holguín', views: 22 },
    { municipality_name: 'Banes', province_name: 'Holguín', views: 16 },
    { municipality_name: 'Mayarí', province_name: 'Holguín', views: 11 },
  ],
}
const QUIET_PRODUCTS = {
  items: [
    { product_id: 'cafe', name: 'Café', views: 64, purchases: 4, conversion_rate: 6.3, image_url: PINAR?.imageUrl },
    { product_id: 'malanga', name: 'Malanga', views: 41, purchases: 3, conversion_rate: 7.3, image_url: HOLGUIN?.imageUrl },
  ],
}
const TOP_SOLD = {
  items: [
    { product_id: 'malanga', name: 'Malanga', units_sold: 18, image_url: HOLGUIN?.imageUrl },
    { product_id: 'cafe', name: 'Café', units_sold: 11, image_url: PINAR?.imageUrl },
  ],
}

function pitchOrder(overrides) {
  return {
    id: 'pitch0001abcd',
    status: 'pending_confirmation',
    created_at: '2026-11-26T15:00:00Z',
    updated_at: '2026-11-26T15:10:00Z',
    buyer_name: 'José',
    buyer_phone: '+53 5 555 0101',
    items: [{ quantity: 2 }],
    subtotals: [{ currency: 'CUP', amount: 500 }],
    payment_currency: 'CUP',
    delivery_requested: true,
    ...overrides,
  }
}

function Story({ title, active, reduced, blocks }) {
  const scrollerRef = useRef(null)
  const itemRefs = useRef([])

  useLayoutEffect(() => {
    if (!active) return undefined
    scrollerRef.current?.scrollTo({ top: 0 })
    return undefined
  }, [active])

  useEffect(() => {
    if (!active || reduced) return undefined
    const timers = blocks.map((_, index) => window.setTimeout(() => {
      const root = scrollerRef.current
      const node = itemRefs.current[index]
      if (!root || !node) return
      const rootBox = root.getBoundingClientRect()
      const nodeBox = node.getBoundingClientRect()
      if (nodeBox.top < rootBox.bottom - 168) return
      root.scrollTo({ top: root.scrollTop + (nodeBox.top - rootBox.top) - 12, behavior: 'smooth' })
    }, index * FALL_STEP_MS))
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [active, reduced])

  const falling = active && !reduced

  return (
    <section
      ref={scrollerRef}
      className="h-full w-full shrink-0 snap-start snap-always overflow-y-auto bg-brand-white px-5 pt-[max(0.85rem,var(--safe-top))] pb-[calc(var(--buyer-nav-space)+10.5rem)]"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <h2 className="text-center font-script text-[clamp(2.8rem,7vw,4.6rem)] leading-[0.9] text-brand-carmelita">{title}</h2>
        {blocks.map((block, index) => (
          <div
            key={block.key}
            ref={(node) => { itemRefs.current[index] = node }}
            className={falling ? 'pitch-fall' : reduced ? undefined : 'pitch-hold'}
            style={falling ? { animationDelay: `${index * 0.42}s` } : undefined}
          >
            {block.node}
          </div>
        ))}
      </div>
    </section>
  )
}

function PitchText({ children }) {
  return <p className="text-lg leading-relaxed text-brand-carmelita/90">{children}</p>
}

function PitchStrong({ children }) {
  return <strong className="font-bold text-brand-green">{children}</strong>
}

function PitchMark({ children }) {
  return <mark className="pitch-mark rounded-md px-1.5 py-0.5 font-semibold">{children}</mark>
}

function driftMotion() {
  const reach = 6 + Math.random() * 6
  const angle = Math.random() * Math.PI * 2
  return {
    '--drift-x': `${(Math.cos(angle) * reach).toFixed(1)}px`,
    '--drift-y': `${(Math.sin(angle) * reach).toFixed(1)}px`,
    animationDuration: `${7 + Math.random() * 4}s`,
    animationDelay: `${(-Math.random() * 8).toFixed(2)}s`,
  }
}

function PitchDrift({ children }) {
  const [motion] = useState(driftMotion)
  return (
    <div className="pitch-drift" style={motion}>
      {children}
    </div>
  )
}

function isDriftStack(child) {
  if (!isValidElement(child)) return false
  const name = child.props?.className
  return typeof name === 'string' && (name.includes('flex-col') || name.includes('grid-cols'))
}

function driftNodes(nodes) {
  return Children.map(nodes, (node) => {
    if (isDriftStack(node)) {
      return cloneElement(node, undefined, driftNodes(node.props.children))
    }
    return <PitchDrift>{node}</PitchDrift>
  })
}

function PitchVisual({ children, live = false }) {
  return (
    <div inert={live ? undefined : true} className={`mx-auto w-full max-w-sm ${live ? '' : 'pointer-events-none'}`}>
      {driftNodes(children)}
    </div>
  )
}

function JabaSnapshot() {
  const imageSrc = resolveMediaUrl(PRODUCT.image_url, { width: 200 })
  return (
    <section className={buyerJabaStoreSection}>
      <div className={buyerJabaStoreAccordionBtn}>
        <div className="min-w-0 flex-1">
          <h3 className={buyerJabaStoreTitle}>La Tienda</h3>
          <p className="mt-0.5 text-xs font-medium text-brand-carmelita">
            1 producto
            <span className="text-brand-green"> · 250 CUP</span>
          </p>
        </div>
      </div>
      <div className="border-t border-brand-green/8 px-3.5 pb-3.5">
        <ul className="mt-1">
          <li className={buyerJabaItemRow}>
            {imageSrc ? <img src={imageSrc} alt="" className={buyerJabaItemImage} /> : null}
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold leading-snug text-brand-green">Malanga</p>
              <p className="mt-0.5 text-xs font-bold text-brand-green">250 CUP</p>
              <p className="mt-0.5 text-[0.68rem] font-semibold text-brand-carmelita">Stock: 12 lb</p>
              <div className="mt-2 flex items-center gap-1">
                <span className={buyerJabaQtyBtn} aria-hidden>−</span>
                <span className="min-w-6 text-center text-sm font-bold text-brand-green">1</span>
                <span className={buyerJabaQtyBtn} aria-hidden>+</span>
              </div>
            </div>
          </li>
        </ul>
        <p className="mt-2 text-xs font-semibold text-brand-carmelita">
          Subtotal: <span className="text-brand-green">250 CUP</span>
        </p>
        <p className={buyerJabaShippingNote}>El costo de entrega se coordina directamente con la tienda</p>
        <div className={buyerJabaCheckoutActions}>
          <span className={buyerJabaPrimaryBtn}>Pedir a domicilio</span>
          <span className={buyerJabaSecondaryBtn}>Recoger en la tienda</span>
        </div>
      </div>
    </section>
  )
}

const CUBA_THOUGHTS = [
  ['Pa\' La Jaba es cubana', 'Todo el trato, en la ventana'],
  ['Está el que compra y el que vende', 'Y quien el mandado atiende'],
  ['El pago era un lío real', 'Informal y desigual'],
  ['Pa\' La Jaba se fajó', 'Y la estafa se acabó'],
  ['Aunque compres desde lejos', 'Los tratos salen parejos'],
  ['Con el cuidado debido', 'Pa\' que llegue el pedido'],
  ['Si hay lío, viene el repaso', 'Y se resuelve el caso'],
]
const THOUGHT_MARKS = ['cubana', 'vende', 'un lío', 'la estafa', 'lejos', 'el pedido', 'el caso']

function highlightLine(line) {
  const phrase = THOUGHT_MARKS.find((item) => line.includes(item))
  if (!phrase) return line
  const index = line.indexOf(phrase)
  return (
    <>
      {line.slice(0, index)}
      <PitchMark>{phrase}</PitchMark>
      {line.slice(index + phrase.length)}
    </>
  )
}

function ThoughtBubble({ lines }) {
  return (
    <>
      <p className="rounded-[1.4rem] border border-brand-green/15 bg-brand-white px-4 py-2.5 text-center text-lg font-bold leading-snug text-brand-green shadow-[0_8px_18px_rgba(89,128,44,0.12)]">
        {lines.map((line) => (
          <span key={line} className="block">{highlightLine(line)}</span>
        ))}
      </p>
      <span className="absolute bottom-2 left-7 h-2.5 w-2.5 rounded-full border border-brand-green/15 bg-brand-white" />
      <span className="absolute bottom-0 left-4 h-1.5 w-1.5 rounded-full border border-brand-green/15 bg-brand-white" />
    </>
  )
}

function placeThought(node) {
  const field = node.offsetParent || node.parentElement
  const room = Math.max(0, field.clientWidth - node.offsetWidth)
  node.style.left = `${Math.round(Math.random() * room)}px`
  node.style.right = 'auto'
}

const THOUGHT_GAP_MS = 2000

function RisingThought({ lines, onDone }) {
  const ref = useRef(null)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return undefined
    placeThought(node)
    const done = (event) => {
      if (event.target !== node || event.animationName !== 'pitch-thought-rise') return
      onDoneRef.current()
    }
    node.addEventListener('animationend', done)
    return () => node.removeEventListener('animationend', done)
  }, [])

  return (
    <div ref={ref} className="pitch-thought pitch-thought-rise absolute top-full w-max max-w-[88%] pb-4" aria-hidden="true">
      <ThoughtBubble lines={lines} />
    </div>
  )
}

function ThoughtField({ playing }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState([])
  const remove = useCallback((id) => {
    setShown((current) => current.filter((item) => item.id !== id))
  }, [])

  useEffect(() => {
    if (reduced || !playing) {
      setShown([])
      return undefined
    }
    let id = 0
    let timer = 0
    setShown([{ id: 0, lines: CUBA_THOUGHTS[0] }])
    const tick = () => {
      timer = window.setTimeout(() => {
        id += 1
        const nextId = id
        setShown((current) => [...current, { id: nextId, lines: CUBA_THOUGHTS[nextId % CUBA_THOUGHTS.length] }])
        tick()
      }, THOUGHT_GAP_MS)
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [reduced, playing])

  if (reduced) {
    return (
      <ul className="flex flex-col items-center gap-5">
        {CUBA_THOUGHTS.map((lines) => (
          <li key={lines[0]} className="relative w-fit max-w-full pb-4">
            <ThoughtBubble lines={lines} />
          </li>
        ))}
      </ul>
    )
  }
  return (
    <div className="pitch-thought-field">
      <ul className="sr-only">
        {CUBA_THOUGHTS.map((lines) => <li key={lines[0]}>{lines.join('. ')}</li>)}
      </ul>
      {shown.map((item) => (
        <RisingThought key={item.id} lines={item.lines} onDone={() => remove(item.id)} />
      ))}
    </div>
  )
}

function cubaBlocks(playing) {
  return [{ key: 'field', node: <ThoughtField playing={playing} /> }]
}

function jabaBlocks() {
  return [
    {
      key: 'see',
      node: (
        <div className="flex items-start gap-4">
          <p className="min-w-0 flex-1 text-lg leading-relaxed text-brand-carmelita/90">Tu gente abre la tienda y ve el producto con su <PitchMark>foto</PitchMark>, el <PitchStrong>precio</PitchStrong> y lo que queda.</p>
          <div inert className="pointer-events-none w-[46%] max-w-[12.5rem] shrink-0">
            <PitchDrift>
              <BuyerProductCard product={PRODUCT} compact />
            </PitchDrift>
          </div>
        </div>
      ),
    },
    { key: 'bag-text', node: <PitchText>Lo mete en la jaba y elige si <PitchStrong>se lo llevan</PitchStrong> o <PitchMark>pasa a recogerlo</PitchMark>.</PitchText> },
    { key: 'jaba', node: <PitchVisual><JabaSnapshot /></PitchVisual> },
  ]
}

function OrderMock({ order, variant = 'pending', note }) {
  return (
    <div className="rounded-2xl border border-brand-green/12 bg-brand-white px-3">
      {note ? <p className="pt-4 text-sm font-bold uppercase tracking-[0.08em] text-brand-green">{note}</p> : null}
      <SellerOrderItem order={order} variant={variant} onOpen={() => {}} />
    </div>
  )
}

function CustomerRow({ name, orders, phone, last, picked = false }) {
  return (
    <div className={`py-4 ${picked ? 'rounded-2xl bg-brand-green/10 px-3' : ''}`}>
      <span className="flex items-start justify-between gap-3">
        <span className="font-display text-2xl font-bold text-brand-carmelita">{name}</span>
        <span className="shrink-0 rounded-full bg-brand-green/8 px-3 py-1.5 text-sm font-bold text-brand-green">{orders} pedidos</span>
      </span>
      <span className="mt-1.5 block text-base text-brand-green">{phone}</span>
      <span className="mt-1 block text-sm text-brand-carmelita/60">Último pedido: {last}</span>
    </div>
  )
}

function offlineBlocks() {
  const saved = pitchOrder()
  return [
    { key: 'leave-text', node: <PitchText>José confirma la jaba y <PitchStrong>el pedido sale hacia tu tienda</PitchStrong>: lo que pidió, cuánto suma y si se lo llevan o pasa a recogerlo.</PitchText> },
    { key: 'hold-text', node: <PitchText>Si se cae la data en ese momento, <PitchStrong>no se pierde</PitchStrong>. Queda <PitchMark>guardado en su teléfono</PitchMark> y sale solo cuando vuelve la conexión.</PitchText> },
    {
      key: 'hold',
      node: (
        <PitchVisual>
          <div className="flex flex-col gap-3">
            <OrderMock order={saved} note="Enviando" />
            <OrderMock order={saved} note="Guardado en el teléfono" />
          </div>
        </PitchVisual>
      ),
    },
    { key: 'notice-text', node: <PitchText>Al llegar <PitchStrong>te avisa</PitchStrong>. Ves el <PitchMark>código</PitchMark>, cuántos productos trae y si pidió domicilio.</PitchText> },
    {
      key: 'notice',
      node: (
        <PitchVisual>
          <article className={sellerNoticeToastCard}>
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-carmelita/70">La Tienda</p>
            <p className="mt-1 font-display text-sm font-bold leading-snug text-brand-green">Nuevo pedido recibido</p>
            <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/90">Pedido #01ABCD. 2 productos por confirmar. El cliente solicitó entrega a domicilio.</p>
          </article>
        </PitchVisual>
      ),
    },
    { key: 'who-text', node: <PitchText>En el pedido está <PitchMark>José</PitchMark>, su teléfono, los productos y el <PitchStrong>total</PitchStrong>.</PitchText> },
    { key: 'back', node: <PitchVisual><OrderMock order={saved} note="Por confirmar" /></PitchVisual> },
    { key: 'pending-text', node: <PitchText>Queda en <PitchMark>pendientes</PitchMark> hasta que lo confirmes. Desde ahí sigues: se lo llevas, lo recoge o se lo asignas a un <PitchStrong>mensajero</PitchStrong>.</PitchText> },
  ]
}

function customerBlocks() {
  return [
    { key: 'list-text', node: <PitchText>José <PitchStrong>ya te compró</PitchStrong>. Ves cuántos pedidos lleva, su teléfono y cuándo fue el último.</PitchText> },
    {
      key: 'list',
      node: (
        <PitchVisual>
          <div className="divide-y divide-neutral-300">
            <CustomerRow name="José" orders={4} phone="+53 5 555 0101" last="ayer" />
            <CustomerRow name="Yasdiel" orders={2} phone="+53 5 555 0199" last="la semana pasada" />
          </div>
        </PitchVisual>
      ),
    },
    { key: 'find-text', node: <PitchText>Lo buscas por el nombre, o filtras por el <PitchMark>municipio</PitchMark>, el <PitchStrong>producto</PitchStrong> y la moneda.</PitchText> },
    {
      key: 'find',
      node: (
        <PitchVisual>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {['Holguín', 'Malanga', 'CUP'].map((label) => (
                <span key={label} className="rounded-full bg-brand-green px-3 py-1.5 text-sm font-bold text-brand-white">{label}</span>
              ))}
            </div>
            <CustomerRow name="José" orders={4} phone="+53 5 555 0101" last="ayer" picked />
          </div>
        </PitchVisual>
      ),
    },
    { key: 'notice-text', node: <PitchText>Le escribes que <PitchMark>llegó la malanga</PitchMark>. El aviso va para él, o para <PitchStrong>todos los que ya te compraron</PitchStrong>.</PitchText> },
    {
      key: 'notice',
      node: (
        <PitchVisual>
          <article className="rounded-[10px] border border-brand-green/12 bg-brand-white p-5">
            <h3 className="font-display text-3xl font-bold text-brand-carmelita">Llegó malanga</h3>
            <p className="mt-3 text-lg leading-relaxed text-brand-carmelita/80">José, hoy hay. Pasa por la tienda.</p>
            <p className="mt-4 text-base font-semibold text-brand-green">Para José</p>
            <p className="mt-1 text-sm text-brand-carmelita/60">Leído por 1 de 1</p>
          </article>
        </PitchVisual>
      ),
    },
    { key: 'read-text', node: <PitchText>José lo abre en sus avisos. No empiezas de cero, y ves si <PitchStrong>ya lo leyó</PitchStrong>.</PitchText> },
  ]
}

function disputeBlocks() {
  const rejected = pitchOrder({
    payment_method: 'qvapay',
    payment_currency: 'USD',
    subtotals: [{ currency: 'USD', amount: 8 }],
    qvapay: { payment_status: 'paid', evidence: { status: 'rejected' } },
  })
  const cancelled = pitchOrder({
    status: 'cancelled',
    updated_at: '2026-11-26T18:00:00Z',
    payment_method: 'qvapay',
    payment_currency: 'USD',
    subtotals: [{ currency: 'USD', amount: 8 }],
    qvapay: { payment_status: 'refunded', dispute_winner: 'buyer' },
  })
  return [
    { key: 'reject-text', node: <PitchText>Si José dice que <PitchMark>no recibió el pedido</PitchMark>, rechaza la evidencia. El dinero <PitchStrong>sigue retenido</PitchStrong>.</PitchText> },
    { key: 'reject', node: <PitchVisual><OrderMock order={rejected} note="Evidencia rechazada" /></PitchVisual> },
    { key: 'reason-text', node: <PitchText>Escribe el motivo, puede adjuntar fotos, y <PitchStrong>Pa&apos; La Jaba revisa</PitchStrong> lo ocurrido.</PitchText> },
    {
      key: 'reason',
      node: (
        <PitchVisual>
          <article className="rounded-[10px] border border-brand-green/12 bg-brand-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-carmelita/70">Motivo de la disputa</p>
            <p className="mt-3 text-lg leading-relaxed text-brand-carmelita/85">Llegó menos malanga de la que pagué.</p>
          </article>
        </PitchVisual>
      ),
    },
    { key: 'rule-text', node: <PitchText>Si le corresponde a José, <PitchMark>se le devuelve</PitchMark> y el pedido se cancela. Si recibió lo acordado, la compra se completa y <PitchStrong>no hay devolución</PitchStrong>.</PitchText> },
    {
      key: 'rule',
      node: (
        <PitchVisual>
          <div className="flex flex-col gap-3">
            <article className="rounded-2xl border border-brand-green/12 bg-brand-white px-4 py-4">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-brand-green">A favor de José</p>
              <p className="mt-2 text-base leading-relaxed text-brand-carmelita/85">Se le devuelve esa parte. El pedido queda cancelado.</p>
            </article>
            <article className="rounded-2xl border border-brand-green/12 bg-brand-white px-4 py-4">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-brand-green">A favor de la tienda</p>
              <p className="mt-2 text-base leading-relaxed text-brand-carmelita/85">Recibió lo acordado. La compra se completa.</p>
            </article>
            <OrderMock order={cancelled} variant="completed" note="Devuelto" />
          </div>
        </PitchVisual>
      ),
    },
    { key: 'refund-text', node: <PitchText>La tienda también puede <PitchStrong>reembolsar</PitchStrong> sin esperar el reclamo. Baja cantidades, <PitchMark>devuelve el domicilio</PitchMark> y escribe el motivo con una foto.</PitchText> },
    {
      key: 'refund',
      node: (
        <PitchVisual>
          <article className="rounded-[10px] border border-brand-green/12 bg-brand-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-carmelita/70">Reembolsar al comprador</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="font-display text-2xl font-bold text-brand-green">Malanga</span>
              <span className="rounded-full bg-brand-green/10 px-3 py-1 text-sm font-bold text-brand-green">1 de 2</span>
            </div>
            <p className="mt-3 text-base font-semibold text-brand-green">Devolver el domicilio</p>
            <p className="mt-3 text-lg leading-relaxed text-brand-carmelita/85">Faltó una libra.</p>
          </article>
        </PitchVisual>
      ),
    },
    { key: 'notice-text', node: <PitchText>José lo ve en sus avisos, con el motivo y las fotos. Si queda algo, el resto <PitchStrong>sigue retenido</PitchStrong>. Si no queda nada, <PitchMark>recibe lo que pagó</PitchMark>.</PitchText> },
    {
      key: 'notice',
      node: (
        <PitchVisual>
          <article className={sellerNoticeToastCard}>
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-carmelita/70">La Tienda</p>
            <p className="mt-1 font-display text-sm font-bold leading-snug text-brand-green">Reembolso de 4.00 USD</p>
            <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/90">Faltó una libra.</p>
          </article>
        </PitchVisual>
      ),
    },
  ]
}

function gestorBlocks() {
  const sold = pitchOrder()
  return [
    { key: 'user-text', node: <PitchText><PitchStrong>Creas el usuario</PitchStrong>. Camila entra, pone su contraseña y su teléfono.</PitchText> },
    {
      key: 'user',
      node: (
        <PitchVisual>
          <article className="rounded-[10px] border border-brand-green/12 bg-brand-white px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-carmelita/70">Usuario</p>
            <p className="mt-2 font-display text-3xl font-bold text-brand-green">@camila</p>
            <p className="mt-2 text-base text-brand-carmelita/80">Primer ingreso · falta contraseña y teléfono</p>
          </article>
        </PitchVisual>
      ),
    },
    { key: 'catalog-text', node: <PitchText>Tú eliges qué productos puede ofrecer, siempre con <PitchMark>tu precio</PitchMark>.</PitchText> },
    {
      key: 'catalog',
      node: (
        <PitchVisual>
          <ul className="flex flex-col gap-2">
            {['Malanga', 'Café'].map((name) => (
              <li key={name} className="flex items-center justify-between rounded-2xl border border-brand-green/12 bg-brand-white px-4 py-4">
                <span className="font-display text-2xl font-bold text-brand-green">{name}</span>
                <span className="rounded-full bg-brand-green/10 px-3 py-1 text-sm font-bold text-brand-green">En su catálogo</span>
              </li>
            ))}
          </ul>
        </PitchVisual>
      ),
    },
    { key: 'link-text', node: <PitchText>Le pasas el enlace. Desde ahí vende <PitchStrong>lo que le habilitaste</PitchStrong>.</PitchText> },
    {
      key: 'link',
      node: (
        <PitchVisual>
          <article className="rounded-2xl border border-brand-green/12 bg-brand-green/[0.04] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-carmelita/80">Enlace de acceso</p>
            <p className="mt-2 break-all font-display text-lg font-bold text-brand-green">/g/la-tienda/gestor</p>
            <p className="mt-3 text-base text-brand-carmelita">Malanga · Café</p>
          </article>
        </PitchVisual>
      ),
    },
    { key: 'order-text', node: <PitchText>El pedido llega a tu tienda, y ves que <PitchMark>lo vendió Camila</PitchMark>.</PitchText> },
    { key: 'order', node: <PitchVisual><OrderMock order={sold} note="Vendido por Camila" /></PitchVisual> },
  ]
}

const TRACK_STOPS = [
  [20.8782, -76.2732],
  [20.8808, -76.2696],
  [20.8832, -76.2662],
  [20.8852, -76.2638],
  [20.8861, -76.2626],
]

function trackingPoints(stops, total = 15) {
  const segments = []
  let length = 0
  for (let index = 0; index < stops.length - 1; index += 1) {
    const [lat1, lng1] = stops[index]
    const [lat2, lng2] = stops[index + 1]
    const dist = Math.hypot(lat2 - lat1, lng2 - lng1)
    segments.push({ lat1, lng1, lat2, lng2, dist, start: length })
    length += dist
  }
  return Array.from({ length: total }, (_, index) => {
    const target = (length * index) / (total - 1)
    const segment = segments.find((item, itemIndex) => target <= item.start + item.dist || itemIndex === segments.length - 1)
    const t = segment.dist === 0 ? 0 : Math.min(1, (target - segment.start) / segment.dist)
    return {
      lat: segment.lat1 + (segment.lat2 - segment.lat1) * t,
      lng: segment.lng1 + (segment.lng2 - segment.lng1) * t,
    }
  })
}

function messengerBlocks() {
  const order = pitchOrder({ status: 'in_transit' })
  const destination = { lat: 20.8874, lng: -76.2608, label: 'José' }
  const points = trackingPoints(TRACK_STOPS)
  const here = points[points.length - 1]
  return [
    { key: 'create-text', node: <PitchText>Creas a Rocío con su <PitchMark>nombre</PitchMark>, su <PitchStrong>teléfono</PitchStrong> y su alias. Le pasas el enlace para que entre.</PitchText> },
    {
      key: 'create',
      node: (
        <PitchVisual>
          <article className="rounded-[10px] border border-brand-green/12 bg-brand-white px-5 py-5">
            <p className="font-display text-3xl font-bold text-brand-carmelita">Rocío</p>
            <p className="mt-2 text-base text-brand-green">+53 5 555 0188 · @rocio</p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand-carmelita/70">Enlace de acceso</p>
            <p className="mt-1 font-display text-lg font-bold text-brand-green">/mensajero/rocio</p>
          </article>
        </PitchVisual>
      ),
    },
    { key: 'ready-text', node: <PitchText>Al entrar pone su contraseña, su <PitchMark>foto</PitchMark> y el <PitchStrong>carro</PitchStrong> con el que va a salir. Así la reconocen la tienda y José.</PitchText> },
    {
      key: 'ready',
      node: (
        <PitchVisual>
          <article className="flex items-center gap-4 rounded-[10px] border border-brand-green/12 bg-brand-white px-4 py-4">
            <img src="/images/pitch/usuario-mensajero.svg?v=2" alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
            <img src="/images/pitch/carro.svg?v=2" alt="" className="h-16 w-16 shrink-0 object-contain" />
            <span className="min-w-0">
              <span className="block font-display text-2xl font-bold leading-none text-brand-green">Rocío</span>
              <span className="mt-1 block text-sm font-semibold text-brand-carmelita">Carro</span>
            </span>
          </article>
        </PitchVisual>
      ),
    },
    { key: 'assigned-text', node: <PitchText>Desde el pedido <PitchStrong>se lo asignas</PitchStrong>. Ella lo ve en sus rutas.</PitchText> },
    { key: 'assigned', node: <PitchVisual><OrderMock order={order} note="Asignado a Rocío" /></PitchVisual> },
    { key: 'route-text', node: <PitchText>Desliza para comenzar, con el carro de esa ruta. José <PitchMark>sigue el recorrido</PitchMark> y ve a Rocío acercarse.</PitchText> },
    {
      key: 'map',
      node: (
        <PitchVisual>
          <AppLocationMap
            collapsedHeight="16rem"
            destination={destination}
            points={points}
            courier={{
              lat: here.lat,
              lng: here.lng,
              name: 'Rocío',
              profilePhoto: '/images/pitch/usuario-mensajero.svg?v=2',
              vehiclePhoto: '/images/pitch/carro.svg?v=2',
            }}
          />
        </PitchVisual>
      ),
    },
    { key: 'offline-text', node: <PitchText>Si se cae la data, el recorrido <PitchStrong>no se pierde</PitchStrong>. Los puntos quedan <PitchMark>en su teléfono</PitchMark> y salen cuando vuelve la conexión.</PitchText> },
    {
      key: 'offline',
      node: (
        <PitchVisual>
          <article className="rounded-[10px] border border-brand-green/12 bg-brand-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-green">Sin conexión</p>
            <p className="mt-2 text-lg leading-relaxed text-brand-carmelita/90">Los puntos salen cuando vuelve la data.</p>
          </article>
        </PitchVisual>
      ),
    },
    { key: 'near-text', node: <PitchText>Cuando entra en <PitchMark>un kilómetro</PitchMark>, José recibe el aviso. A la tienda también le llega.</PitchText> },
    {
      key: 'near',
      node: (
        <PitchVisual>
          <div className="flex flex-col gap-3">
            <article className={sellerNoticeToastCard}>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-carmelita/70">La Tienda</p>
              <p className="mt-1 font-display text-sm font-bold leading-snug text-brand-green">El mensajero está cerca</p>
              <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/90">Rocío está próxima a tu ubicación.</p>
            </article>
            <article className={sellerNoticeToastCard}>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-brand-carmelita/70">Para la tienda</p>
              <p className="mt-1 font-display text-sm font-bold leading-snug text-brand-green">Mensajero cerca del cliente</p>
              <p className="mt-1 text-xs leading-relaxed text-brand-carmelita/90">El mensajero está próximo a la ubicación de José.</p>
            </article>
          </div>
        </PitchVisual>
      ),
    },
    { key: 'evidence-text', node: <PitchText>Al entregar escribe una nota y puede adjuntar fotos. Con eso <PitchStrong>cierra el pedido</PitchStrong> y tú ves la evidencia.</PitchText> },
    {
      key: 'evidence',
      node: (
        <PitchVisual>
          <article className="rounded-[10px] border border-brand-green/12 bg-brand-white px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-green">Evidencia de Rocío</p>
            <p className="mt-3 text-lg leading-relaxed text-brand-carmelita/90">Lo recibió José en la puerta.</p>
            <p className="mt-4 text-base font-semibold text-brand-green">Pedido cerrado</p>
          </article>
        </PitchVisual>
      ),
    },
  ]
}

function qvapayBlocks() {
  const due = pitchOrder({ payment_method: 'qvapay', payment_currency: 'USD', subtotals: [{ currency: 'USD', amount: 8 }] })
  const held = pitchOrder({
    payment_method: 'qvapay',
    payment_currency: 'USD',
    subtotals: [{ currency: 'USD', amount: 8 }],
    qvapay: { payment_status: 'paid', evidence: { status: 'pending', deadline: HELD_UNTIL } },
  })
  const done = pitchOrder({
    status: 'completed',
    payment_method: 'qvapay',
    payment_currency: 'USD',
    subtotals: [{ currency: 'USD', amount: 8 }],
    completed_at: '2026-11-26T18:00:00Z',
    qvapay: { payment_status: 'paid' },
  })
  return [
    { key: 'hold-text', node: <PitchText>José paga y el dinero <PitchMark>se queda quieto</PitchMark> hasta que recibe.</PitchText> },
    {
      key: 'hold',
      node: (
        <PitchVisual>
          <div className="flex flex-col gap-3">
            <OrderMock order={due} note="Por pagar" />
            <OrderMock order={held} note="Retenido" />
          </div>
        </PitchVisual>
      ),
    },
    { key: 'done-text', node: <PitchText>Al entregar <PitchStrong>se liquida</PitchStrong>. Si Rocío tiene <PitchMark>QvaPay verificado</PitchMark>, el domicilio se le paga por ahí.</PitchText> },
    { key: 'done', node: <PitchVisual><OrderMock order={done} variant="completed" note="Entregado" /></PitchVisual> },
  ]
}

function PluginPills({ ids }) {
  const plugins = ids
    .map((id) => PLAN_PLUGINS.find((plugin) => plugin.id === id))
    .filter(Boolean)
  return (
    <ul className="flex flex-wrap gap-2">
      {plugins.map((plugin) => (
        <li key={plugin.id} className="rounded-full bg-brand-green/10 px-4 py-2 text-lg font-bold text-brand-green">{plugin.label}</li>
      ))}
    </ul>
  )
}

function planBlocks() {
  const later = PLAN_PLUGINS.map((plugin) => plugin.id).filter((id) => !PLAN_ON_NOW.includes(id))
  return [
    { key: 'now-text', node: <PitchText>Prendes <PitchStrong>solo lo que la tienda usa ahora</PitchStrong>.</PitchText> },
    { key: 'now', node: <PitchVisual><PluginPills ids={PLAN_ON_NOW} /></PitchVisual> },
    { key: 'later-text', node: <PitchText>Lo demás también se pide en el plan, <PitchMark>cuando la tienda lo necesite</PitchMark>.</PitchText> },
    { key: 'later', node: <PitchVisual><PluginPills ids={later} /></PitchVisual> },
  ]
}

function PlanCard({ plan, featured = false, raised = false, onPick }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={raised}
      className={`w-full rounded-[10px] border px-3 py-3 text-left transition duration-200 touch-manipulation active:scale-[0.98] ${
        featured
          ? 'z-10 border-brand-yellow bg-brand-yellow/[0.16] shadow-[0_16px_32px_rgba(89,128,44,0.22)] hover:-translate-y-1'
          : 'border-brand-green/12 bg-brand-white shadow-[0_6px_14px_rgba(89,128,44,0.08)] hover:-translate-y-0.5'
      } ${raised && !featured ? 'ring-2 ring-brand-green/30' : ''}`}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-brand-carmelita">{plan.eyebrow}</p>
      {featured ? <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-wide text-brand-green">Recomendado</p> : null}
      <p className={`mt-1 font-display font-bold leading-none text-brand-green ${featured ? 'text-3xl' : 'text-2xl'}`}>{plan.name}</p>
      <ul className="mt-2 flex flex-col gap-0.5">
        {plan.features.map((feature) => (
          <li key={feature} className="text-sm text-brand-green">{feature}</li>
        ))}
      </ul>
    </button>
  )
}

function PlanBricks() {
  const [picked, setPicked] = useState(ADVERTISING_PLANS[1]?.id || '')
  const [first, featured, third] = ADVERTISING_PLANS
  return (
    <div className="grid grid-cols-2 items-start gap-3">
      <div className="flex flex-col gap-3 pt-8">
        <PlanCard plan={first} raised={picked === first.id} onPick={() => setPicked(first.id)} />
        <PlanCard plan={third} raised={picked === third.id} onPick={() => setPicked(third.id)} />
      </div>
      <PlanCard plan={featured} featured raised={picked === featured.id} onPick={() => setPicked(featured.id)} />
    </div>
  )
}

function statsBlocks() {
  return [
    { key: 'visits-text', node: <PitchText>En la semana ves las <PitchStrong>visitas</PitchStrong>, los <PitchStrong>pedidos</PitchStrong> y los productos activos.</PitchText> },
    {
      key: 'visits',
      node: (
        <PitchVisual>
          <div className="flex flex-col gap-3">
            <SellerStatGrid stats={PITCH_STATS} />
            <div className="flex h-56 min-h-0 flex-col overflow-hidden">
              <SellerSeriesChart fill chartId="pitch-visits" title="Visitas" chart={VISITS} valueLabel="visitas" />
            </div>
          </div>
        </PitchVisual>
      ),
    },
    { key: 'kpi-text', node: <PitchText>También ves visitantes, lo cobrado y cuántas visitas <PitchMark>se vuelven jaba</PitchMark>.</PitchText> },
    { key: 'kpis', node: <PitchVisual><SellerStatsKpis kpis={PITCH_KPIS} /></PitchVisual> },
    { key: 'zone-text', node: <PitchText>Y de qué <PitchStrong>municipio</PitchStrong> te están mirando.</PitchText> },
    { key: 'zones', node: <PitchVisual><SellerViewsByZone data={VIEWS_BY_ZONE} /></PitchVisual> },
    { key: 'sold-text', node: <PitchText>Y también <PitchMark>lo que más se fue</PitchMark> de la tienda.</PitchText> },
    { key: 'sold', node: <PitchVisual><SellerTopSold data={TOP_SOLD} /></PitchVisual> },
    { key: 'quiet-text', node: <PitchText>Y qué se mira mucho y todavía <PitchStrong>se vende poco</PitchStrong>.</PitchText> },
    { key: 'quiet', node: <PitchVisual><SellerHighViewsLowSales data={QUIET_PRODUCTS} /></PitchVisual> },
  ]
}

const PITCH_BANNERS = [
  { id: 'pitch-banner-1', image_url: PINAR?.imageUrl, is_active: true },
  { id: 'pitch-banner-2', image_url: HOLGUIN?.imageUrl, is_active: true },
].filter((banner) => banner.image_url)

function bannerBlocks() {
  return [
    { key: 'cover-text', node: <PitchText>Subes las fotos que se ven <PitchMark>detrás del nombre</PitchMark> de la tienda.</PitchText> },
    {
      key: 'cover',
      node: (
        <PitchVisual>
          <div className="overflow-hidden rounded-[10px]">
            <BuyerStoreBannerCover banners={PITCH_BANNERS} />
          </div>
        </PitchVisual>
      ),
    },
    { key: 'turn-text', node: <PitchText>Si hay más de una, se van turnando. <PitchStrong>La que apagas no sale</PitchStrong>.</PitchText> },
    {
      key: 'turn',
      node: (
        <PitchVisual>
          <ul className="flex flex-col gap-3">
            {PITCH_BANNERS.map((banner, index) => (
              <li key={banner.id} className="flex items-center gap-3 rounded-2xl border border-brand-green/12 bg-brand-white p-2">
                <img src={banner.image_url} alt="" className="h-16 w-28 rounded-[10px] object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-bold text-brand-green">Foto {index + 1}</span>
                  <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-sm font-bold ${index === 0 ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-carmelita/10 text-brand-carmelita'}`}>
                    {index === 0 ? 'En la tienda' : 'Apagada'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </PitchVisual>
      ),
    },
  ]
}

function adBlocks() {
  return [
    { key: 'days-text', node: <PitchText>Eliges los días para que la tienda se vea <PitchStrong>fuera de la app</PitchStrong>.</PitchText> },
    {
      key: 'plans',
      node: (
        <PitchVisual live>
          <PlanBricks />
        </PitchVisual>
      ),
    },
    { key: 'name-text', node: <PitchText>Reels, posts e historias salen con <PitchMark>el mismo nombre</PitchMark> de la tienda.</PitchText> },
    {
      key: 'ig',
      node: (
        <PitchVisual live>
          <button
            type="button"
            onClick={() => openExternalUrl(INSTAGRAM_URL)}
            className="inline-flex items-center rounded-full bg-brand-green/10 px-4 py-2 text-base font-extrabold text-brand-green touch-manipulation"
          >
            @palajabaaa
          </button>
        </PitchVisual>
      ),
    },
  ].filter((block) => block.node)
}

function storeBlocks() {
  return [
    { key: 'plain-text', node: <PitchText>Al principio la tienda está <PitchMark>en blanco</PitchMark>, solo con el nombre.</PitchText> },
    {
      key: 'plain',
      node: (
        <PitchVisual>
          <article className="rounded-2xl border border-brand-green/12 bg-brand-white p-2">
            <div className="h-44 rounded-[10px] bg-brand-green/5" />
            <p className="px-3 py-4 font-display text-4xl font-bold text-brand-green">La Tienda</p>
          </article>
        </PitchVisual>
      ),
    },
    { key: 'dressed-text', node: <PitchText>Le pones <PitchStrong>color</PitchStrong> y tu <PitchMark>foto</PitchMark>, y quien entra la distingue antes del primer producto.</PitchText> },
    {
      key: 'dressed',
      node: (
        <PitchVisual>
          <article className="rounded-2xl border border-brand-green/20 bg-brand-green p-2 text-brand-white">
            {PINAR ? <img src={PINAR.imageUrl} alt={PINAR.imageAlt} className="h-44 w-full rounded-[10px] object-cover" /> : null}
            <p className="px-3 py-4 font-display text-4xl font-bold">La Tienda</p>
          </article>
        </PitchVisual>
      ),
    },
  ]
}

function CoverLogo({ reduced }) {
  return (
    <div className="flex h-64 w-64 items-center justify-center [perspective:880px] sm:h-80 sm:w-80">
      <img
        src={COVER_LOGO}
        alt="Pa' La Jaba"
        className={`h-[70.7%] w-auto ${reduced ? '' : 'pitch-logo-flip'}`}
      />
    </div>
  )
}

function Cover({ reduced }) {
  return (
    <section className="flex h-full w-full shrink-0 snap-start snap-always flex-col items-center justify-center bg-black px-6 pb-[calc(var(--buyer-nav-space)+6.5rem)] pt-[max(1rem,var(--safe-top))] text-center">
      <CoverLogo reduced={reduced} />
      <h1 className="font-script text-[clamp(3.4rem,8vw,6.5rem)] leading-none text-white">Pa&apos; la jaba, mi socio</h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-white/80 sm:text-xl">El que quiere <PitchStrong>vender</PitchStrong> vende y el que quiere <PitchMark>comprar</PitchMark> resuelve.</p>
    </section>
  )
}

function Pitch() {
  const reduced = useReducedMotion()
  const scrollerRef = useRef(null)
  const tipRef = useRef(null)
  const [index, setIndex] = useState(0)
  const slideCount = BEATS.length
  const last = index >= slideCount - 1

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('pitch-cover', index === 0)
    return () => root.classList.remove('pitch-cover')
  }, [index])

  function syncIndex(element) {
    const width = element.clientWidth || 1
    setIndex(Math.round(element.scrollLeft / width))
  }

  function goTo(dot) {
    const scroller = scrollerRef.current
    if (!scroller) return
    scroller.scrollTo({ left: scroller.clientWidth * dot, behavior: reduced ? 'auto' : 'smooth' })
  }

  function goNext() {
    goTo(Math.min(index + 1, slideCount - 1))
  }

  useEffect(() => {
    const tip = tipRef.current
    if (!tip) return undefined
    const place = () => {
      tip.style.transform = ''
      const box = tip.getBoundingClientRect()
      const pad = 16
      let next = 0
      if (box.left < pad) next = pad - box.left
      else if (box.right > window.innerWidth - pad) next = window.innerWidth - pad - box.right
      tip.style.transform = `translateX(${next}px)`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [index])

  return (
    <div className="relative h-full overflow-hidden bg-brand-white">
      <div
        ref={scrollerRef}
        onScroll={(event) => syncIndex(event.currentTarget)}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Cover reduced={reduced} />
        <Story title="Un proyecto cubano" active={index === 1} reduced={reduced} blocks={cubaBlocks(index === 1)} />
        <Story title="Tu jaba, tu gente" active={index === 2} reduced={reduced} blocks={jabaBlocks()} />
        <Story title="Lo que te llega a ti" active={index === 3} reduced={reduced} blocks={offlineBlocks()} />
        <Story title="El que ya te compró" active={index === 4} reduced={reduced} blocks={customerBlocks()} />
        <Story title="Gestores" active={index === 5} reduced={reduced} blocks={gestorBlocks()} />
        <Story title="Mensajeros" active={index === 6} reduced={reduced} blocks={messengerBlocks()} />
        <Story title="QvaPay" active={index === 7} reduced={reduced} blocks={qvapayBlocks()} />
        <Story title="Disputas y reembolsos" active={index === 8} reduced={reduced} blocks={disputeBlocks()} />
        <Story title="Estadísticas" active={index === 9} reduced={reduced} blocks={statsBlocks()} />
        <Story title="Banners" active={index === 10} reduced={reduced} blocks={bannerBlocks()} />
        <Story title="Que te vean" active={index === 11} reduced={reduced} blocks={adBlocks()} />
        <Story title="Tu tienda, con tu cara" active={index === 12} reduced={reduced} blocks={storeBlocks()} />
        <Story title="El plan lo armas tú" active={index === 13} reduced={reduced} blocks={planBlocks()} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[calc(var(--buyer-nav-space)+0.5rem)] z-20 px-5">
        <div className="mb-2.5 flex items-center justify-center gap-0.5" aria-label="Diapositivas">
          {BEATS.map((line, dot) => {
            const active = dot === index
            return (
              <button
                key={line}
                type="button"
                onClick={() => goTo(dot)}
                aria-current={active ? 'true' : undefined}
                aria-label={line}
                className={`pointer-events-auto relative grid h-7 place-items-center touch-manipulation transition-[width] duration-300 ${active ? 'w-6' : 'w-3'}`}
              >
                {active ? (
                  <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2">
                    <span
                      ref={tipRef}
                      aria-hidden="true"
                      className="block whitespace-nowrap rounded-lg border border-brand-carmelita/10 bg-white px-2.5 py-1 text-xs font-semibold text-brand-carmelita shadow-[0_8px_18px_rgba(61,43,31,0.16)]"
                    >
                      {line}
                    </span>
                    <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[5px] border-t-[6px] border-x-transparent border-t-white" />
                  </span>
                ) : null}
                <span className={`h-1.5 rounded-full bg-brand-green transition-[width,opacity] duration-300 ${active ? 'w-5' : 'w-1.5 opacity-40'}`} />
              </button>
            )
          })}
        </div>
        {last ? (
          <Link to="/registro/planes" className={`pointer-events-auto ${NEXT_BUTTON}`}>
            Crear cuenta de negocio
          </Link>
        ) : (
          <button type="button" onClick={goNext} className={`pointer-events-auto ${NEXT_BUTTON}`}>
            Siguiente
          </button>
        )}
      </div>
    </div>
  )
}

export default function BuyerPitchPage() {
  if (isCustomerAuthenticated() || isSellerAuthenticated()) {
    return <Navigate to="/comprar" replace />
  }
  return <Pitch />
}
