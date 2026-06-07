export default function ProfileProgressBar({ photo, categories, location, delivery, title = 'Perfil obligatorio' }) {
  const steps = [
    { done: photo, label: 'Foto' },
    { done: categories > 0, label: 'Categoría' },
    { done: location, label: 'Zona' },
    { done: delivery !== null, label: 'Domicilio' },
  ]
  const doneCount = steps.filter((s) => s.done).length
  const percent = Math.round((doneCount / steps.length) * 100)

  return (
    <div className="rounded-2xl border border-brand-green/10 bg-brand-green/[0.04] px-3.5 py-3 shadow-[0_2px_12px_rgba(89,128,44,0.04)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-brand-green">{title}</p>
        <span className="text-[0.65rem] font-medium tabular-nums text-brand-carmelita">
          {doneCount}/{steps.length}
        </span>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-brand-green/10">
        <div
          className="h-full rounded-full bg-brand-green transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {steps.map((step) => (
          <span
            key={step.label}
            className={`rounded-md px-2 py-0.5 text-[0.65rem] font-medium ${
              step.done
                ? 'bg-brand-green/15 text-brand-green'
                : 'bg-brand-white text-brand-carmelita/70'
            }`}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  )
}
