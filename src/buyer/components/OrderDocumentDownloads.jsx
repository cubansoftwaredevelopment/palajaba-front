const DOCUMENTS = [
  ['delivery_policy', 'Política de entrega aceptada'],
  ['terms', 'Términos y condiciones aceptada'],
  ['evidence', 'Evidencia'],
]

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
        <button
          key={kind}
          type="button"
          disabled={downloading === kind}
          onClick={() => onDownload(kind)}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-brand-green/10 px-3 py-2 text-left text-sm font-semibold text-brand-green disabled:opacity-60"
        >
          <span>{label}</span>
          <span className="shrink-0 text-xs font-bold uppercase tracking-wide">
            {downloading === kind ? 'Generando…' : 'PDF'}
          </span>
        </button>
      ))}
    </div>
  )
}
