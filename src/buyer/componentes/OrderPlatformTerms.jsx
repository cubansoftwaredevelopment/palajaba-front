const TONE = {
  light: {
    details: 'rounded-xl border border-brand-green/10 px-3 py-2',
    summary: 'cursor-pointer text-sm font-semibold text-brand-green',
    version: 'mt-1 text-xs text-brand-carmelita/70',
    body: 'text-brand-carmelita',
    heading: 'text-brand-green',
    rule: 'border-brand-green/10',
  },
  admin: {
    details: 'rounded-xl border border-zinc-700 px-3 py-2',
    summary: 'cursor-pointer text-sm font-semibold text-zinc-100',
    version: 'mt-1 text-xs text-zinc-400',
    body: 'text-zinc-300',
    heading: 'text-zinc-100',
    rule: 'border-zinc-700',
  },
}

function TermsBlock({ block, tone }) {
  if (block.type === 'h') {
    return <h3 className={`mt-4 text-sm font-semibold ${tone.heading}`}>{block.text}</h3>
  }
  if (block.type === 'ul') {
    return (
      <ul className={`mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed ${tone.body}`}>
        {(block.items || []).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  if (block.type === 'lines') {
    return (
      <ul className={`mt-2 space-y-1 text-sm leading-relaxed ${tone.body}`}>
        {(block.items || []).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  if (block.type === 'table') {
    return (
      <div className="mt-2 overflow-x-auto">
        <table className={`w-full min-w-[16rem] border-collapse text-sm ${tone.body}`}>
          <thead>
            <tr className={`border-b ${tone.rule} text-left text-xs font-semibold uppercase tracking-wide ${tone.heading}`}>
              {(block.headers || []).map((header) => (
                <th key={header} className="py-2 pr-3 font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(block.rows || []).map((row) => (
              <tr key={row[0]} className={`border-b ${tone.rule}`}>
                <td className="py-2 pr-3">{row[0]}</td>
                <td className="py-2 pr-3">{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  return <p className={`mt-2 text-sm leading-relaxed ${tone.body}`}>{block.text}</p>
}

export default function OrderPlatformTerms({ terms, tone = 'light', className = 'mt-4' }) {
  const sections = Array.isArray(terms?.sections) ? terms.sections : []
  if (!terms?.version || !sections.length) return null
  const style = TONE[tone] || TONE.light

  return (
    <details className={`${style.details} ${className}`}>
      <summary className={style.summary}>Términos y condiciones</summary>
      <p className={style.version}>Versión {terms.version}</p>
      <div className="mt-2 max-h-80 overflow-y-auto pr-1">
        {sections.map((section) => (
          <section key={section.title} className="mt-4">
            <h3 className={`text-sm font-semibold ${style.heading}`}>{section.title}</h3>
            {(section.blocks || []).map((block, index) => (
              <TermsBlock key={`${section.title}-${index}`} block={block} tone={style} />
            ))}
          </section>
        ))}
      </div>
    </details>
  )
}
