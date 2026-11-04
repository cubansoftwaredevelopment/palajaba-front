import RichDocContent from './RichDocContent'

const PAGES = [
  ['delivery_policy', 'Política de entrega'],
  ['terms', 'Términos y condiciones'],
]

export default function OrderAgreements({ agreements }) {
  const items = PAGES
    .map(([key, label]) => (agreements?.[key]?.content ? [key, label, agreements[key]] : null))
    .filter(Boolean)
  if (!items.length) return null

  return (
    <div className="mt-4 space-y-2">
      {items.map(([key, label, page]) => (
        <details key={key} className="rounded-xl border border-brand-green/10 px-3 py-2">
          <summary className="cursor-pointer text-sm font-semibold text-brand-green">{label} aceptada</summary>
          <RichDocContent content={page.content} />
        </details>
      ))}
    </div>
  )
}
