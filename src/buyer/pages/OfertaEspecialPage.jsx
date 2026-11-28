import { Children, cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import { openExternalUrl } from '../../appReleases/utils/nativeApp.js'
import { buildWhatsAppUrl } from '../../orders/utils/whatsappOrder.js'
import { fetchRenewalContactPhone } from '../../subscriptions/api.js'

const SUPPORT_MESSAGE = 'Hola, me interesa conocer la oferta de website y gestión, y sus precios.'
const NEXT_BUTTON = 'flex min-h-11 w-full items-center justify-center rounded-full bg-brand-green px-5 text-sm font-semibold text-brand-white shadow-[0_6px_20px_rgba(89,128,44,0.3)] touch-manipulation disabled:opacity-60'

const BEATS = [
  'Website y gestión',
  'El estilo lo eliges tú',
  'Cómo cobra la tienda',
  'Servicios',
  'Mensajeros',
  'Proveedores y caja',
  'Afiliados',
  'Correos',
  'Quién entra',
  'Clientes y llaves',
  'BanderaExpress',
  'La oferta',
]

const STORE_STYLES = [
  { id: 'verde', name: 'Verde', bg: '#fdfbf2', accent: '#59802c', ink: '#3d2b1f', cover: '#59802c' },
  { id: 'noche', name: 'Noche', bg: '#102418', accent: '#f5c71a', ink: '#fdfbf2', cover: '#0b1a12' },
  { id: 'arena', name: 'Arena', bg: '#f6efe4', accent: '#7b4c38', ink: '#3d2b1f', cover: '#c4a574' },
]

const PRODUCTS = [
  { id: 'cafe', name: 'Café molido', category: 'Abarrotes', measure: '12 oz', price: '$8.50', photo: '/images/pitch/cafe.png' },
  { id: 'malanga', name: 'Malanga', category: 'Viandas', measure: '1 lb', price: '$4.20', photo: '/images/pitch/malanga-corte.png?v=2' },
  { id: 'combo', name: 'Combo familiar', category: 'Combos', measure: '4 productos', price: '$18.00', photo: '' },
]

const DELIVERY_STATUSES = ['Pedido recibido', 'En tránsito', 'Entregado', 'Pendiente de pago']
const SERVICE_STATUSES = ['Pedido recibido', 'Procesando', 'Completado', 'Pendiente de pago']

const ROLES = [
  {
    id: 'Admin',
    title: 'Admin',
    description: 'Pedidos, productos y operaciones del panel',
    allows: ['Productos y servicios', 'Pedidos', 'Mensajeros'],
    denies: ['Proveedores', 'Afiliados', 'Usuarios', 'Finanzas', 'Estadísticas'],
  },
  {
    id: 'Marketing',
    title: 'Marketing',
    description: 'Correos de marketing a usuarios de la plataforma',
    allows: ['Comunidad y contenido', 'Visitas', 'Zonas', 'Productos', 'Conversión', 'Clientes', 'Afiliados'],
    denies: ['Pedidos', 'Finanzas', 'Mensajeros'],
  },
  {
    id: 'Proveedor',
    title: 'Proveedor',
    description: 'Llave para su inventario',
    allows: ['Su inventario', 'Su Excel', 'Sus pedidos'],
    denies: ['El resto de la tienda'],
  },
  {
    id: 'Afiliado',
    title: 'Afiliado',
    description: 'Vende el negocio con su código',
    allows: ['Su código', 'Sus visitas', 'Su comisión'],
    denies: ['La operación de la tienda'],
  },
  {
    id: 'Mensajero',
    title: 'Mensajero',
    description: 'Solo lo que tiene asignado',
    allows: ['Su ruta', 'Sus pedidos'],
    denies: ['Catálogo', 'Finanzas', 'Clientes'],
  },
  {
    id: 'SuperAdmin',
    title: 'SuperAdmin',
    description: 'Todo el panel',
    allows: ['Finanzas', 'Deudas', 'Extracciones', 'Usuarios'],
    denies: [],
  },
]

function Story({ title, active, reduced, blocks }) {
  const scrollerRef = useRef(null)

  useLayoutEffect(() => {
    if (!active) return undefined
    scrollerRef.current?.scrollTo({ top: 0 })
    return undefined
  }, [active])

  const falling = active && !reduced

  return (
    <section
      ref={scrollerRef}
      className="h-full w-full shrink-0 snap-start snap-always overflow-y-auto bg-brand-white px-5 pt-[max(0.85rem,var(--safe-top))] pb-[calc(var(--buyer-nav-space)+10.5rem)]"
    >
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <h2 className="text-center font-script text-[clamp(2.4rem,7vw,4.2rem)] leading-[0.9] text-brand-carmelita">{title}</h2>
        {blocks.map((block, index) => (
          <div
            key={block.key}
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
    if (isDriftStack(node)) return cloneElement(node, undefined, driftNodes(node.props.children))
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

function Phone({ children, tone }) {
  return (
    <div
      className="overflow-hidden rounded-[28px] border border-black/10 shadow-[0_16px_40px_rgba(16,36,24,0.16)]"
      style={{ background: tone?.bg || '#fdfbf2', color: tone?.ink || '#3d2b1f' }}
    >
      <div className="flex items-center justify-between px-4 py-2 text-[10px] font-semibold opacity-70">
        <span>9:41</span>
        <span className="h-4 w-24 rounded-full" style={{ background: tone?.cover || '#59802c' }} />
        <span>LTE</span>
      </div>
      <div className="px-3 pb-4">{children}</div>
    </div>
  )
}

function Cover() {
  return (
    <section className="flex h-full w-full shrink-0 snap-start snap-always flex-col items-center justify-center bg-black px-6 pb-[calc(var(--buyer-nav-space)+6.5rem)] pt-[max(1rem,var(--safe-top))] text-center">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Oferta</p>
      <h1 className="mt-3 font-script text-[clamp(3.2rem,8vw,6rem)] leading-none text-white">Website y gestión</h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-white/80 sm:text-xl">Un sistema propio para <PitchStrong>vender</PitchStrong> y para <PitchMark>administrar</PitchMark> la tienda.</p>
    </section>
  )
}

function StyleStore() {
  const [styleId, setStyleId] = useState(STORE_STYLES[0].id)
  const [openId, setOpenId] = useState('')
  const tone = STORE_STYLES.find((item) => item.id === styleId) || STORE_STYLES[0]
  const open = PRODUCTS.find((item) => item.id === openId)

  return (
    <Phone tone={tone}>
      <p className="px-1 font-display text-2xl font-bold" style={{ color: tone.accent }}>La Esquina</p>
      <p className="px-1 text-xs">Elige el estilo de la tienda</p>
      <div className="mt-3 flex gap-2" role="radiogroup" aria-label="Estilo de la tienda">
        {STORE_STYLES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={item.id === tone.id}
            onClick={() => setStyleId(item.id)}
            className="rounded-full px-3 py-1 text-xs font-bold"
            style={{
              background: item.id === tone.id ? tone.accent : 'transparent',
              color: item.id === tone.id ? tone.bg : tone.ink,
              border: `1px solid ${tone.accent}`,
            }}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="mt-3 h-16 rounded-[18px]" style={{ background: tone.cover }} />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {PRODUCTS.map((product) => (
          <article key={product.id} className="rounded-[18px] bg-white/90 p-2 text-[#0d1912]">
            <button type="button" className="w-full text-left" onClick={() => setOpenId(product.id)}>
              <div className="flex h-16 items-center justify-center overflow-hidden rounded-xl bg-[#f6f9f3]">
                {product.photo ? <img src={product.photo} alt="" className="h-full w-auto object-contain" /> : <span className="text-xs text-[#5c6c61]">Sin foto</span>}
              </div>
              <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#5c6c61]">{product.category}</span>
              <span className="line-clamp-2 text-sm font-semibold leading-tight">{product.name}</span>
              <span className="text-xs text-[#5c6c61]">{product.measure}</span>
            </button>
            <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2">
              <span className="text-lg font-bold">{product.price}</span>
              <span className="grid h-8 w-8 place-items-center rounded-full text-sm font-bold text-white" style={{ background: tone.accent }}>+</span>
            </div>
          </article>
        ))}
      </div>
      {open ? (
        <div className="mt-3 rounded-2xl bg-white p-3 text-[#0d1912]">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#5c6c61]">{open.category}</p>
          <p className="font-semibold">{open.name}</p>
          <p className="text-sm text-[#5c6c61]">{open.measure} · {open.price}</p>
          <button type="button" className="mt-2 text-xs font-bold" style={{ color: tone.accent }} onClick={() => setOpenId('')}>Cerrar ficha</button>
        </div>
      ) : null}
    </Phone>
  )
}

function PayStore() {
  const [method, setMethod] = useState('whatsapp')
  const methods = [
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'zelle', label: 'Zelle' },
    { id: 'card', label: 'Tarjeta débito/crédito' },
  ]
  return (
    <Phone>
      <p className="text-sm font-semibold text-[#0d1912]">Tu pedido</p>
      <p className="mt-1 text-sm text-[#5c6c61]">Café molido × 2 · Combo familiar</p>
      <p className="mt-2 text-2xl font-bold text-[#113b20]">$35.00</p>
      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-semibold text-[#0d1912]">Método de pago</legend>
        <div className="grid gap-2">
          {methods.map((item) => {
            const selected = method === item.id
            return (
              <label key={item.id} className={`flex cursor-pointer items-center rounded-[22px] border px-3 py-3 text-sm ${selected ? 'border-[#113b20] bg-[#113b20] font-bold text-white' : 'border-black/10 bg-white font-medium text-[#0d1912]'}`}>
                <input type="radio" name="oferta-pago" className="sr-only" checked={selected} onChange={() => setMethod(item.id)} />
                {item.label}
              </label>
            )
          })}
        </div>
      </fieldset>
      {method === 'card' ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-900">
          <span className="h-2 w-2 rounded-full bg-current" />
          Pendiente de pago
        </p>
      ) : (
        <p className="mt-3 text-xs text-[#5c6c61]">
          {method === 'whatsapp' ? 'El pedido sale directo al WhatsApp de la tienda.' : 'Zelle acredita en la cuenta del exterior.'}
        </p>
      )}
    </Phone>
  )
}

function ServiceStore() {
  const [delivery, setDelivery] = useState(true)
  const [date, setDate] = useState('2026-12-06')
  return (
    <Phone>
      <article className="rounded-[18px] bg-white p-3 text-[#0d1912]">
        <div className="flex h-16 items-center justify-center rounded-xl bg-[#f6f9f3] text-xs text-[#5c6c61]">Servicio</div>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5c6c61]">Servicios</p>
        <p className="font-semibold">Entrega el sábado</p>
        <p className="text-xs text-[#5c6c61]">{delivery ? 'Con domicilio' : 'Sin domicilio'}</p>
        <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2">
          <span className="text-lg font-bold">$12.00</span>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#113b20] text-sm font-bold text-white">+</span>
        </div>
      </article>
      <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Entrega del servicio">
        {[true, false].map((value) => (
          <button
            key={String(value)}
            type="button"
            role="radio"
            aria-checked={delivery === value}
            onClick={() => setDelivery(value)}
            className={`rounded-2xl border px-2 py-2 text-xs font-bold ${delivery === value ? 'border-[#113b20] bg-[#113b20] text-white' : 'border-black/10 bg-white text-[#0d1912]'}`}
          >
            {value ? 'Con entrega' : 'Sin entrega'}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-sm font-medium text-[#0d1912]">
        Fecha de reserva
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm" />
      </label>
      <p className="mt-2 text-xs text-[#5c6c61]">
        {delivery ? 'Entra en la ruta del mensajero.' : 'No entra en la ruta. El aviso va al proveedor.'}
      </p>
    </Phone>
  )
}

function MessengerStore() {
  const [withDelivery, setWithDelivery] = useState(true)
  const [status, setStatus] = useState(0)
  const labels = withDelivery ? DELIVERY_STATUSES : SERVICE_STATUSES
  const [note, setNote] = useState('')

  function pickStatus(next) {
    if (next === 2 && status !== 1) {
      setNote(withDelivery ? 'Marca el pedido como En tránsito antes de Entregado.' : 'Marca el pedido como Procesando antes de Completado.')
      return
    }
    setNote('')
    setStatus(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <Phone>
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-[#0d1912]">Pedido #1042</p>
          <button type="button" className="rounded-full border border-black/10 bg-white px-2 py-1 text-[10px] font-bold text-[#0f6b4f]" onClick={() => { setWithDelivery((value) => !value); setStatus(0); setNote('') }}>
            {withDelivery ? 'Con domicilio' : 'Sin domicilio'}
          </button>
        </div>
        <label className="mt-3 block text-xs font-semibold text-[#0d1912]">
          {withDelivery ? 'Estado del envío' : 'Estado del servicio'}
          <select className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold" value={status} onChange={(event) => pickStatus(Number(event.target.value))}>
            {labels.map((label, index) => (
              <option key={label} value={index}>{label}</option>
            ))}
          </select>
        </label>
        {note ? <p className="mt-2 text-xs font-semibold text-amber-800">{note}</p> : null}
        <div className="mt-3 rounded-2xl bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#5c6c61]">Ruta optimizada · 18.4 km</p>
          <svg viewBox="0 0 240 72" className="mt-2 h-16 w-full" aria-hidden="true">
            <path d="M16 52 C 70 52, 80 16, 120 20 S 180 58, 224 18" fill="none" stroke="#113b20" strokeWidth="3" />
            <circle cx="16" cy="52" r="5" fill="#f5c71a" />
            <circle cx="120" cy="20" r="5" fill="#59802c" />
            <circle cx="224" cy="18" r="5" fill="#59802c" />
          </svg>
          <ul className="mt-1 text-xs text-[#0d1912]">
            <li>1. Recoger en La Esquina</li>
            <li>2. Entrega Coral Gables · 8.2 km</li>
            <li>3. Entrega Hialeah · 10.2 km</li>
          </ul>
        </div>
        <div className="mt-3 rounded-xl border border-black/10 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#5c6c61]">Resumen para TCPs</p>
          <p className="mt-1 text-sm font-bold text-[#0d1912]">La Esquina</p>
          <p className="mt-1 whitespace-pre-line text-xs text-[#5c6c61]">Pedido #1042{'\n'}Café molido x2{'\n'}Recoger en la tienda</p>
          <p className="mt-2 text-xs font-bold text-[#0f6b4f]">Despacho vía WhatsApp</p>
        </div>
      </Phone>
    </div>
  )
}

function ProviderStore() {
  const [imported, setImported] = useState('')
  const [saved, setSaved] = useState(false)
  const [amount, setAmount] = useState('250')
  const [reason, setReason] = useState('Caja de la semana')
  const [date, setDate] = useState('2026-11-20')

  return (
    <Phone>
      <p className="text-sm font-semibold">Bodega Norte</p>
      <p className="text-xs opacity-70">Proveedor · llave de stock activa</p>
      <div className="mt-3 rounded-2xl bg-white p-3 text-[#0d1912]">
        <p className="text-xs font-bold uppercase tracking-wide text-[#5c6c61]">Deuda</p>
        <p className="text-2xl font-extrabold">$420.00</p>
        <p className="text-xs text-[#5c6c61]">Pendiente de liquidar</p>
      </div>
      <div className="mt-3 rounded-2xl bg-white p-3 text-[#0d1912]">
        <p className="text-sm font-semibold">Catálogo de productos</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className="rounded-xl border border-black/10 px-2 py-2 text-xs font-bold">Descargar Excel</button>
          <label className="cursor-pointer rounded-xl border border-black/10 px-2 py-2 text-center text-xs font-bold">
            Importar Excel
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                setImported(`Se actualizaron 18 productos desde ${file.name}.`)
              }}
            />
          </label>
        </div>
        {imported ? <p className="mt-2 text-xs font-semibold text-[#0f6b4f]">{imported}</p> : <p className="mt-2 text-xs text-[#5c6c61]">Café molido · stock 24</p>}
      </div>
      <form
        className="mt-3 space-y-2 rounded-2xl bg-white p-3 text-[#0d1912]"
        onSubmit={(event) => {
          event.preventDefault()
          setSaved(true)
        }}
      >
        <p className="text-sm font-semibold">Registrar extracción</p>
        <label className="block text-xs font-medium">
          Fecha
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 px-2 py-1.5" />
        </label>
        <label className="block text-xs font-medium">
          Monto base
          <input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 px-2 py-1.5" />
        </label>
        <label className="block text-xs font-medium">
          Motivo
          <input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 px-2 py-1.5" />
        </label>
        <button type="submit" className="w-full rounded-full bg-[#113b20] py-2 text-xs font-bold text-white">{saved ? 'Extracción registrada' : 'Registrar'}</button>
      </form>
    </Phone>
  )
}

function AffiliateStore() {
  return (
    <Phone>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">Tu código de afiliado</p>
      <p className="font-display text-3xl font-bold">LUCAS</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-[14px] border border-[#e8e1da] bg-white px-3 py-3 text-[#0d1912]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ventas con tu código</p>
          <p className="mt-1 text-2xl font-extrabold">14</p>
          <p className="mt-1 text-[10px] text-slate-500">Pedidos entregados atribuidos a tu código</p>
        </div>
        <div className="rounded-[14px] border border-[#e8e1da] bg-white px-3 py-3 text-[#0d1912]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Comisión pendiente</p>
          <p className="mt-1 text-2xl font-extrabold">$86</p>
          <p className="mt-1 text-[10px] text-slate-500">Saldo en USD por liquidar</p>
        </div>
      </div>
      <div className="mt-3 rounded-2xl bg-white p-3 text-[#0d1912]">
        <p className="text-xs font-bold uppercase tracking-wide text-[#5c6c61]">Deuda del afiliado</p>
        <p className="font-semibold">Lucas Pérez</p>
        <p className="text-sm">$86.00 · pendiente</p>
      </div>
    </Phone>
  )
}

function MailStore() {
  const [mode, setMode] = useState('manual')
  const [body, setBody] = useState('Hola Ana, tu pedido #1042 ya va en camino.')
  const [sent, setSent] = useState(false)
  return (
    <Phone>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de correo">
        {['manual', 'auto'].map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={mode === item}
            onClick={() => { setMode(item); setSent(false) }}
            className={`rounded-2xl border px-2 py-2 text-xs font-bold ${mode === item ? 'border-[#113b20] bg-[#113b20] text-white' : 'border-black/10 bg-white text-[#0d1912]'}`}
          >
            {item === 'manual' ? 'Redactar correo' : 'Automático'}
          </button>
        ))}
      </div>
      {mode === 'manual' ? (
        <form className="mt-3 space-y-2 rounded-2xl bg-white p-3 text-[#0d1912]" onSubmit={(event) => { event.preventDefault(); setSent(true) }}>
          <p className="text-xs text-[#5c6c61]">Para ana@correo.com</p>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} className="w-full rounded-xl border border-black/10 px-2 py-1.5 text-sm" />
          <button type="submit" className="w-full rounded-full bg-[#113b20] py-2 text-xs font-bold text-white">{sent ? 'Correo enviado' : 'Enviar'}</button>
        </form>
      ) : (
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          <li className="rounded-2xl bg-white px-3 py-2 text-[#0d1912]">Confirmación del pedido al cliente</li>
          <li className="rounded-2xl bg-white px-3 py-2 text-[#0d1912]">Aviso de carrito abandonado</li>
          <li className="rounded-2xl bg-white px-3 py-2 text-[#0d1912]">Aviso al afiliado en En tránsito y Entregado</li>
        </ul>
      )}
    </Phone>
  )
}

function BarRow({ label, value, max }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/10">
        <div className="h-full rounded-full bg-[#0f766e]" style={{ width: `${Math.round((value / max) * 100)}%` }} />
      </div>
    </div>
  )
}

function VisitStore() {
  return (
    <div className="flex flex-col gap-3">
      <article className="rounded-2xl border border-black/10 bg-white p-3 text-[#0d1912]">
        <h3 className="text-sm font-semibold">Tráfico del sitio</h3>
        <p className="text-xs text-[#5c6c61]">86 visitantes únicos · 214 pageviews</p>
        <div className="mt-2 flex flex-col gap-2">
          <BarRow label="Lun" value={22} max={40} />
          <BarRow label="Mié" value={31} max={40} />
          <BarRow label="Sáb" value={40} max={40} />
        </div>
      </article>
      <article className="rounded-2xl border border-black/10 bg-white p-3 text-[#0d1912]">
        <h3 className="text-sm font-semibold">Entrada (landing)</h3>
        <BarRow label="/" value={48} max={48} />
        <div className="mt-2"><BarRow label="/categoria/abarrotes" value={27} max={48} /></div>
        <h3 className="mt-3 text-sm font-semibold">Salida</h3>
        <BarRow label="/checkout" value={19} max={48} />
      </article>
      <article className="rounded-2xl border border-black/10 bg-white p-3 text-[#0d1912]">
        <h3 className="text-sm font-semibold">Zona de entrega</h3>
        <div className="mt-2 flex flex-col gap-2">
          <BarRow label="Miami" value={54} max={54} />
          <BarRow label="Hialeah" value={22} max={54} />
          <BarRow label="Coral Gables" value={16} max={54} />
        </div>
      </article>
      <article className="rounded-2xl border border-black/10 bg-white p-3 text-[#0d1912]">
        <h3 className="text-sm font-semibold">Kilómetros</h3>
        <p className="text-xs text-[#5c6c61]">12 viajes · 42.6 km totales</p>
        <p className="mt-2 text-sm">Proveedores <strong>$180</strong></p>
        <p className="text-sm">Viajes <strong>$64</strong></p>
      </article>
    </div>
  )
}

function PeopleStore() {
  const [roleId, setRoleId] = useState('Admin')
  const role = ROLES.find((item) => item.id === roleId) || ROLES[0]
  return (
    <Phone>
      <div className="rounded-2xl bg-white p-3 text-[#0d1912]">
        <p className="text-sm font-semibold">Ana López</p>
        <p className="text-xs text-[#5c6c61]">ana@correo.com · cliente</p>
      </div>
      <p id="oferta-role-label" className="mb-2 mt-3 text-sm font-medium">Tipo de cuenta</p>
      <div role="radiogroup" aria-labelledby="oferta-role-label" className="grid grid-cols-2 gap-2">
        {ROLES.map((item) => {
          const selected = item.id === role.id
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setRoleId(item.id)}
              className={`rounded-xl border px-2 py-2 text-left text-xs font-semibold ${selected ? 'border-[#0f6b4f] bg-[#0f6b4f]/10 ring-1 ring-[#0f6b4f]/30' : 'border-black/10 bg-white'}`}
            >
              {item.title}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-xs">{role.description}</p>
      <ul className="mt-2 flex flex-col gap-1 text-xs">
        {role.allows.map((item) => <li key={item}>Puede: {item}</li>)}
        {role.denies.map((item) => <li key={item} className="opacity-70">No puede: {item}</li>)}
      </ul>
    </Phone>
  )
}

function CaseCards() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <article className="rounded-2xl border border-black/10 bg-white p-3 text-[#0d1912]">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Pedidos al mes</p>
        <p className="mt-1 text-xl font-extrabold">8 → +30</p>
      </article>
      <article className="rounded-2xl border border-black/10 bg-white p-3 text-[#0d1912]">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Finanzas</p>
        <p className="mt-1 text-xl font-extrabold">$500 → +$6,000</p>
      </article>
    </div>
  )
}

function styleBlocks() {
  return [
    { key: 'style-text', node: <PitchText>La tienda sale con el <PitchStrong>estilo que elijas</PitchStrong>: color, portada y ficha de producto.</PitchText> },
    { key: 'style', node: <PitchVisual live><StyleStore /></PitchVisual> },
  ]
}

function payBlocks() {
  return [
    { key: 'pay-text', node: <PitchText>El pedido puede ir <PitchStrong>directo a WhatsApp</PitchStrong> o cobrarse solo en la <PitchMark>cuenta de banco del exterior</PitchMark>.</PitchText> },
    { key: 'pay', node: <PitchVisual live><PayStore /></PitchVisual> },
    { key: 'pay-note', node: <PitchText>Con tarjeta el pedido queda en <PitchMark>Pendiente de pago</PitchMark> hasta que el banco confirma.</PitchText> },
  ]
}

function serviceBlocks() {
  return [
    { key: 'service-text', node: <PitchText>Un servicio puede ir <PitchStrong>con entrega</PitchStrong> o <PitchMark>sin entrega</PitchMark>, y lleva fecha de reserva.</PitchText> },
    { key: 'service', node: <PitchVisual live><ServiceStore /></PitchVisual> },
  ]
}

function messengerBlocks() {
  return [
    { key: 'step-text', node: <PitchText>Llega en <PitchMark>Pedido recibido</PitchMark>. Se asigna un mensajero y el optimizador arma <PitchStrong>una sola ruta</PitchStrong>: recoge en la tienda o en el proveedor y sigue a cada entrega.</PitchText> },
    { key: 'highlight', node: <PitchText>Esto <PitchStrong>minimiza al máximo el costo de mensajería</PitchStrong>, porque no manda un viaje por pedido.</PitchText> },
    { key: 'wa-text', node: <PitchText>Por WhatsApp se le manda al mensajero y al proveedor toda la información, para que el mensajero <PitchMark>vaya a buscar los productos a la tienda</PitchMark>.</PitchText> },
    { key: 'messenger', node: <PitchVisual live><MessengerStore /></PitchVisual> },
  ]
}

function providerBlocks() {
  return [
    { key: 'provider-text', node: <PitchText>Creas proveedores, ves la <PitchStrong>deuda</PitchStrong> con cada uno y registras <PitchMark>extracciones</PitchMark>.</PitchText> },
    { key: 'keys-text', node: <PitchText>Gestionas sus productos, les das una llave para que actualicen el stock y puedes <PitchStrong>importar su Excel</PitchStrong>.</PitchText> },
    { key: 'provider', node: <PitchVisual live><ProviderStore /></PitchVisual> },
  ]
}

function affiliateBlocks() {
  return [
    { key: 'affiliate-text', node: <PitchText>Un afiliado <PitchStrong>vende tu negocio</PitchStrong> con su código. Queda registrada la deuda de su comisión.</PitchText> },
    { key: 'affiliate', node: <PitchVisual live><AffiliateStore /></PitchVisual> },
  ]
}

function mailBlocks() {
  return [
    { key: 'mail-text', node: <PitchText>Escribes un correo <PitchStrong>a mano</PitchStrong> o dejas que salgan solos: confirmación, carrito abandonado y aviso al afiliado.</PitchText> },
    { key: 'mail', node: <PitchVisual live><MailStore /></PitchVisual> },
  ]
}

function visitBlocks() {
  return [
    { key: 'visit-text', node: <PitchText>Ves <PitchStrong>desde dónde</PitchStrong> te visitan, cuántos entran, cuánto miran y <PitchMark>qué partes</PitchMark> recorren.</PitchText> },
    { key: 'cost-text', node: <PitchText>Y también los <PitchStrong>kilómetros</PitchStrong>, lo que gastas en proveedores y lo que gastas en viajes.</PitchText> },
    { key: 'visits', node: <PitchVisual live><VisitStore /></PitchVisual> },
  ]
}

function peopleBlocks() {
  return [
    { key: 'people-text', node: <PitchText>Conoces a tus clientes y agregas administradores con <PitchMark>permisos limitados</PitchMark>.</PitchText> },
    { key: 'people', node: <PitchVisual live><PeopleStore /></PitchVisual> },
  ]
}

function caseBlocks() {
  return [
    { key: 'case-text', node: <PitchText><PitchStrong>BanderaExpress</PitchStrong>, una compañía de origen norteamericano, confió en este sistema.</PitchText> },
    { key: 'case', node: <PitchVisual><CaseCards /></PitchVisual> },
    { key: 'case-note', node: <PitchText>Pasó de 8 pedidos al mes a más de 30, y de 500 USD al mes a <PitchMark>más de 6 000 USD</PitchMark>.</PitchText> },
  ]
}

function offerBlocks() {
  return [
    { key: 'months', node: <PitchText>La oferta incluye <PitchStrong>3 meses de mantenimiento</PitchStrong>.</PitchText> },
    { key: 'domain', node: <PitchText>El <PitchMark>dominio</PitchMark> y los <PitchMark>correos</PitchMark> los decides tú.</PitchText> },
  ]
}

function Pitch() {
  const reduced = useReducedMotion()
  const scrollerRef = useRef(null)
  const tipRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [supportPhone, setSupportPhone] = useState('')
  const [supportBusy, setSupportBusy] = useState(false)
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

  async function contactSupport() {
    if (supportBusy) return
    let phone = supportPhone
    if (!phone) {
      setSupportBusy(true)
      try {
        const data = await fetchRenewalContactPhone()
        phone = data?.renewal_contact_phone || ''
        setSupportPhone(phone)
      } catch {
        setSupportBusy(false)
        return
      }
      setSupportBusy(false)
    }
    const url = buildWhatsAppUrl(phone, SUPPORT_MESSAGE)
    if (url) openExternalUrl(url)
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
        <Cover />
        <Story title="El estilo lo eliges tú" active={index === 1} reduced={reduced} blocks={styleBlocks()} />
        <Story title="Cómo cobra la tienda" active={index === 2} reduced={reduced} blocks={payBlocks()} />
        <Story title="Servicios" active={index === 3} reduced={reduced} blocks={serviceBlocks()} />
        <Story title="Mensajeros" active={index === 4} reduced={reduced} blocks={messengerBlocks()} />
        <Story title="Proveedores y caja" active={index === 5} reduced={reduced} blocks={providerBlocks()} />
        <Story title="Afiliados" active={index === 6} reduced={reduced} blocks={affiliateBlocks()} />
        <Story title="Correos" active={index === 7} reduced={reduced} blocks={mailBlocks()} />
        <Story title="Quién entra" active={index === 8} reduced={reduced} blocks={visitBlocks()} />
        <Story title="Clientes y llaves" active={index === 9} reduced={reduced} blocks={peopleBlocks()} />
        <Story title="BanderaExpress" active={index === 10} reduced={reduced} blocks={caseBlocks()} />
        <Story title="La oferta" active={index === 11} reduced={reduced} blocks={offerBlocks()} />
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
          <button type="button" onClick={contactSupport} disabled={supportBusy} className={`pointer-events-auto ${NEXT_BUTTON}`}>
            Contactar soporte
          </button>
        ) : (
          <button type="button" onClick={goNext} className={`pointer-events-auto ${NEXT_BUTTON}`}>
            Siguiente
          </button>
        )}
      </div>
    </div>
  )
}

export default function OfertaEspecialPage() {
  return <Pitch />
}
