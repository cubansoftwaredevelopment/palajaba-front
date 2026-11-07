import { Link } from 'react-router-dom'
import AuthShell from '../auth/components/AuthShell'
import { PLATFORM_TERMS_SECTIONS, PLATFORM_TERMS_VERSION } from '../lib/platformTerms'

function TermsBlock({ block }) {
  if (block.type === 'h') {
    return <h3 className="mt-5 text-base font-semibold text-brand-green">{block.text}</h3>
  }
  if (block.type === 'ul') {
    return (
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-brand-carmelita">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  if (block.type === 'lines') {
    return (
      <ul className="mt-3 space-y-1 text-sm leading-relaxed text-brand-carmelita">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    )
  }
  if (block.type === 'table') {
    return (
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-sm text-brand-carmelita">
          <thead>
            <tr className="border-b border-brand-green/15 text-left text-xs font-semibold uppercase tracking-wide text-brand-green">
              {block.headers.map((header) => (
                <th key={header} className="py-2 pr-4 font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row[0]} className="border-b border-brand-green/10">
                <td className="py-2 pr-4">{row[0]}</td>
                <td className="py-2 pr-4">{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  return <p className="mt-3 text-sm leading-relaxed text-brand-carmelita">{block.text}</p>
}

export default function PlatformTerms() {
  return (
    <AuthShell backTo="/" backLabel="Inicio" contentWidth="narrow">
      <article className="pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-carmelita/70">Palajaba</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-green">Términos y condiciones</h1>
        <p className="mt-2 text-xs text-brand-carmelita/70">Versión {PLATFORM_TERMS_VERSION}</p>
        {PLATFORM_TERMS_SECTIONS.map((section) => (
          <section key={section.title} className="mt-8">
            <h2 className="text-lg font-semibold text-brand-green">{section.title}</h2>
            {section.blocks.map((block, index) => (
              <TermsBlock key={`${section.title}-${index}`} block={block} />
            ))}
          </section>
        ))}
        <p className="mt-10 text-sm text-brand-carmelita/80">
          <Link to="/" className="font-semibold text-brand-green underline">Volver al inicio</Link>
        </p>
      </article>
    </AuthShell>
  )
}
