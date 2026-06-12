import { useCallback, useState } from 'react'
import Button from '../Button'
import { WELCOME_ONBOARDING_SLIDES } from '../../constants/welcomeOnboarding'

const ACCENT_STYLES = {
  carmelita: {
    blob: 'bg-brand-carmelita/18',
    ring: 'ring-brand-carmelita/12',
    eyebrow: 'text-brand-carmelita',
    dotActive: 'bg-brand-carmelita',
    dotIdle: 'bg-brand-carmelita/20',
    skip: 'text-brand-carmelita/70 hover:text-brand-carmelita',
    buttonVariant: 'primary',
  },
  green: {
    blob: 'bg-brand-green/14',
    ring: 'ring-brand-green/15',
    eyebrow: 'text-brand-green',
    dotActive: 'bg-brand-green',
    dotIdle: 'bg-brand-green/18',
    skip: 'text-brand-carmelita/70 hover:text-brand-green',
    buttonVariant: 'primary',
  },
  yellow: {
    blob: 'bg-brand-yellow/28',
    ring: 'ring-brand-yellow/35',
    eyebrow: 'text-brand-carmelita',
    dotActive: 'bg-brand-yellow',
    dotIdle: 'bg-brand-yellow/35',
    skip: 'text-brand-carmelita/70 hover:text-brand-carmelita',
    buttonVariant: 'primary',
  },
}

export default function WelcomeOnboarding({ onComplete }) {
  const [step, setStep] = useState(0)
  const slide = WELCOME_ONBOARDING_SLIDES[step]
  const accent = ACCENT_STYLES[slide.accent]
  const isLast = step === WELCOME_ONBOARDING_SLIDES.length - 1

  const finish = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  function goNext() {
    if (isLast) {
      finish()
      return
    }
    setStep((current) => current + 1)
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-brand-white">
      <div
        className={`pointer-events-none absolute -right-16 top-8 h-56 w-56 rounded-full blur-3xl transition-colors duration-700 ${accent.blob}`}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-20 bottom-24 h-64 w-64 rounded-full bg-brand-green/8 blur-3xl"
        aria-hidden="true"
      />

      <header className="relative z-10 flex items-center justify-between gap-4 px-5 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex items-center gap-1.5" aria-label={`Paso ${step + 1} de ${WELCOME_ONBOARDING_SLIDES.length}`}>
          {WELCOME_ONBOARDING_SLIDES.map((item, index) => (
            <span
              key={item.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === step ? `w-7 ${accent.dotActive}` : `w-1.5 ${accent.dotIdle}`
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
        <button
          type="button"
          onClick={finish}
          className={`min-h-9 rounded-full px-3 text-xs font-semibold transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 ${accent.skip}`}
        >
          Saltar
        </button>
      </header>

      <section
        key={slide.id}
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-4 pt-2 animate-fade-in sm:px-8"
        aria-labelledby={`onboarding-title-${slide.id}`}
      >
        <div className="relative mb-6 sm:mb-8">
          <div
            className={`absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-colors duration-700 sm:h-52 sm:w-52 ${accent.blob}`}
            aria-hidden="true"
          />
          <div
            className={`relative overflow-hidden rounded-[2rem] bg-brand-white/60 p-3 ring-1 backdrop-blur-[2px] transition-shadow duration-700 ${accent.ring}`}
          >
            <img
              src={slide.image}
              alt={slide.imageAlt}
              className="h-auto w-[min(72vw,16.5rem)] animate-float object-contain sm:w-[18rem]"
              width={288}
              height={288}
              decoding="async"
            />
          </div>
        </div>

        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
          <p
            className={`text-[0.65rem] font-bold uppercase tracking-[0.14em] ${accent.eyebrow}`}
          >
            {slide.eyebrow}
          </p>
          <h2
            id={`onboarding-title-${slide.id}`}
            className="mt-2 font-display text-[1.65rem] font-bold leading-tight text-brand-green sm:text-3xl"
          >
            {slide.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-brand-carmelita/90 sm:text-base">
            {slide.body}
          </p>
        </div>
      </section>

      <footer className="relative z-10 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 sm:px-8">
        <Button variant={accent.buttonVariant} onClick={goNext}>
          {isLast ? 'Empezar' : 'Siguiente'}
        </Button>
        {!isLast ? (
          <p className="mt-3 text-center text-[0.68rem] font-medium text-brand-carmelita/55">
            {step + 1} de {WELCOME_ONBOARDING_SLIDES.length}
          </p>
        ) : null}
      </footer>
    </main>
  )
}
