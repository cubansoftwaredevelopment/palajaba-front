const DOCUMENTS = [
  ['delivery_policy', 'Política de entrega aceptada'],
  ['terms', 'Términos y condiciones aceptada'],
  ['evidence', 'Evidencia'],
]

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m8 11 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function OrderDocumentDownloads({
  agreements,
  evidence,
  downloading,
  onDownload,
  include = ['delivery_policy', 'terms', 'evidence'],
  className = 'mt-4 space-y-2',
}) {
  const available = {
    delivery_policy: Boolean(agreements?.delivery_policy?.content),
    terms: Boolean(agreements?.terms?.content),
    evidence: Boolean(evidence?.content),
  }
  const items = DOCUMENTS.filter(([kind]) => include.includes(kind) && available[kind])
  if (!items.length) return null

  return (
    <div className={className}>
      {items.map(([kind, label]) => (
        <div key={kind} className="flex items-center justify-between gap-3 rounded-xl border border-brand-green/10 px-3 py-2">
          <p className="text-sm font-semibold text-brand-green">{label}</p>
          <button
            type="button"
            aria-label={downloading === kind ? `Generando ${label}` : `Descargar ${label}`}
            disabled={downloading === kind}
            onClick={() => onDownload(kind)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-brand-green transition-colors hover:bg-brand-green/10 disabled:opacity-40"
          >
            <DownloadIcon />
          </button>
        </div>
      ))}
    </div>
  )
}
