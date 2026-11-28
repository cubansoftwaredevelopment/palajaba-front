import { Link } from 'react-router-dom'

export const WEBSITE_GESTION_FEATURES = [
  'Sitio propio',
  'Gestión de catálogo, pedidos y finanzas',
  '3 meses de mantenimiento',
  'El dominio y los correos los eliges tú',
]

export default function WebsiteGestionOfferCard({ layout = 'grid' }) {
  const compact = layout === 'pitch'
  return (
    <Link
      to="/oferta-especial"
      className={
        layout === 'row'
          ? 'flex flex-col rounded-2xl border border-brand-yellow bg-brand-yellow/[0.08] p-4 text-left shadow-sm transition hover:border-brand-green/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40'
          : `flex h-full flex-col rounded-2xl border border-brand-yellow bg-brand-yellow/[0.07] text-left transition hover:border-brand-green/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/40 ${compact ? 'p-3' : 'p-5'}`
      }
    >
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-brand-carmelita/80">Oferta</span>
      <span className={`mt-2 block font-display font-bold text-brand-green ${compact ? 'text-2xl' : 'text-2xl'}`}>Website y gestión</span>
      <span className="mt-2 block text-sm leading-relaxed text-brand-carmelita/85">
        Un sitio y un panel propios. El precio se consulta con soporte.
      </span>
      <span className="mt-3 flex flex-col gap-1">
        {WEBSITE_GESTION_FEATURES.map((feature) => (
          <span key={feature} className="flex items-start gap-2 text-xs leading-relaxed text-brand-green">
            <span aria-hidden="true" className="font-bold">✓</span>
            {feature}
          </span>
        ))}
      </span>
    </Link>
  )
}
