const STEPS = [
  { id: 1, label: 'Plan' },
  { id: 2, label: 'Pago' },
  { id: 3, label: 'Datos' },
]

export default function RegisterProgress({ currentStep, className = '' }) {
  return (
    <nav aria-label="Progreso del registro" className={`mb-6 lg:mb-0 ${className}`}>
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((step, index) => {
          const done = currentStep > step.id
          const active = currentStep === step.id
          return (
            <li key={step.id} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full items-center">
                {index > 0 && (
                  <div
                    className={`h-0.5 flex-1 ${done || active ? 'bg-brand-green' : 'bg-brand-green/15'}`}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    done
                      ? 'bg-brand-green text-brand-white'
                      : active
                        ? 'bg-brand-yellow text-brand-green ring-2 ring-brand-green/20'
                        : 'bg-brand-green/10 text-brand-carmelita/70'
                  }`}
                >
                  {done ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 ${done ? 'bg-brand-green' : 'bg-brand-green/15'}`}
                    aria-hidden="true"
                  />
                )}
              </div>
              <span
                className={`text-xs font-semibold ${active ? 'text-brand-green' : 'text-brand-carmelita/70'}`}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
