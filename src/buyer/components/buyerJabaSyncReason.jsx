const REASON_META = {
  deleted: {
    label: 'Ya no existe',
    badgeClass: 'bg-brand-carmelita/12 text-brand-carmelita',
    iconClass: 'bg-brand-carmelita/12 text-brand-carmelita',
  },
  unavailable: {
    label: 'Agotado',
    badgeClass: 'bg-brand-carmelita/12 text-brand-carmelita',
    iconClass: 'bg-brand-carmelita/12 text-brand-carmelita',
  },
  view_only: {
    label: 'Solo consulta',
    badgeClass: 'bg-brand-yellow/25 text-brand-green',
    iconClass: 'bg-brand-yellow/25 text-brand-green',
  },
  store_unavailable: {
    label: 'Tienda no disponible',
    badgeClass: 'bg-brand-green/10 text-brand-green',
    iconClass: 'bg-brand-green/10 text-brand-green',
  },
  no_delivery: {
    label: 'Sin domicilio',
    badgeClass: 'bg-brand-green/10 text-brand-green',
    iconClass: 'bg-brand-green/10 text-brand-green',
  },
}

export function reasonMeta(reason) {
  return REASON_META[reason] ?? {
    label: 'No disponible',
    badgeClass: 'bg-brand-carmelita/12 text-brand-carmelita',
    iconClass: 'bg-brand-carmelita/12 text-brand-carmelita',
  }
}

export function ReasonIcon({ reason }) {
  const shared = 'h-5 w-5'

  if (reason === 'unavailable') {
    return (
      <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
      </svg>
    )
  }

  if (reason === 'view_only') {
    return (
      <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }

  if (reason === 'store_unavailable') {
    return (
      <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
        <path d="M3 9l2-4h14l2 4M9 13h6" />
      </svg>
    )
  }

  if (reason === 'no_delivery') {
    return (
      <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M10 17h4M3 7h11v10H3zM14 10h4l2 3v4h-6z" />
        <circle cx="7.5" cy="17.5" r="1.5" />
        <circle cx="17.5" cy="17.5" r="1.5" />
      </svg>
    )
  }

  return (
    <svg className={shared} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  )
}
