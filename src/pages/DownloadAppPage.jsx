import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { BRAND_NAME } from '../constants/branding'
import {
  APP_ANDROID_BADGE,
  APP_DOWNLOAD_FILENAME,
  APP_DOWNLOAD_URL,
  APP_FEATURES,
  APP_HEADLINE,
  APP_INSTALL_HINT,
  APP_LOGO,
  APP_TAGLINE,
} from '../constants/mobileApp'

const downloadButtonClass =
  'inline-flex w-full min-h-12 items-center justify-center gap-2.5 rounded-full bg-brand-green px-6 py-3.5 text-sm font-semibold text-brand-white shadow-[0_8px_24px_rgba(89,128,44,0.32)] transition-all duration-200 touch-manipulation active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-white sm:hover:-translate-y-px sm:hover:bg-[#4d7026]'

function FeatureIcon({ name }) {
  if (name === 'store') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M3 9l1-5h16l1 5M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M9 13h6" />
      </svg>
    )
  }
  if (name === 'bolt') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M6 7h12l-1.2 11.5a1 1 0 0 1-1 .9H8.2a1 1 0 0 1-1-.9L6 7Z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  )
}

function DownloadButton({ className = '' }) {
  return (
    <a
      href={APP_DOWNLOAD_URL}
      download={APP_DOWNLOAD_FILENAME}
      className={`${downloadButtonClass} ${className}`.trim()}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      Descargar APK
    </a>
  )
}

export default function DownloadAppPage() {
  return (
    <div className="relative min-h-dvh bg-brand-white">
      <div
        className="pointer-events-none fixed -right-20 top-0 h-72 w-72 rounded-full bg-brand-yellow/18 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed -left-24 bottom-32 h-80 w-80 rounded-full bg-brand-green/10 blur-3xl"
        aria-hidden="true"
      />

      <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pt-[max(1rem,var(--safe-top))] pb-[max(7.5rem,calc(6.5rem+var(--safe-bottom)))] sm:px-8 sm:pb-10">
        <header className="mb-8 flex shrink-0 items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex min-h-10 items-center gap-1 rounded-full px-1 text-sm font-semibold text-brand-carmelita/85 touch-manipulation active:text-brand-green"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Inicio
          </Link>
          <Logo className="h-7 w-auto opacity-90" />
        </header>

        <section
          className="flex flex-col items-center text-center animate-fade-in"
          aria-labelledby="app-download-title"
        >
          <div className="relative mb-6">
            <div
              className="absolute inset-0 scale-110 rounded-[2rem] bg-brand-yellow/25 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative overflow-hidden rounded-[1.85rem] border border-brand-green/12 bg-brand-white p-4 shadow-[0_16px_48px_rgba(89,128,44,0.14)]">
              <img
                src={APP_LOGO.src}
                alt={APP_LOGO.alt}
                className="h-24 w-24 object-contain sm:h-28 sm:w-28"
                width={112}
                height={112}
                decoding="async"
              />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-green/15 bg-brand-green/[0.06] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-brand-green">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8z" />
            </svg>
            {APP_ANDROID_BADGE}
          </span>

          <h1
            id="app-download-title"
            className="mt-4 font-display text-[1.75rem] font-bold leading-[1.15] text-brand-green sm:text-3xl"
          >
            {APP_HEADLINE}
          </h1>
          <p className="mt-2 max-w-[16rem] text-sm leading-snug text-brand-carmelita/90">{APP_TAGLINE}</p>

          <ul className="mt-8 grid w-full grid-cols-3 gap-2">
            {APP_FEATURES.map((feature) => (
              <li
                key={feature.label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-brand-green/10 bg-brand-white/90 px-2 py-3.5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow/20 text-brand-green">
                  <FeatureIcon name={feature.icon} />
                </span>
                <span className="text-xs font-bold text-brand-green">{feature.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 hidden w-full sm:block">
            <DownloadButton />
          </div>

          <details className="group mt-6 w-full text-left">
            <summary className="cursor-pointer list-none rounded-2xl border border-brand-green/10 bg-brand-white/80 px-4 py-3 text-sm font-semibold text-brand-carmelita/90 touch-manipulation marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-2">
                ¿Primera vez con un APK?
                <svg
                  className="h-4 w-4 shrink-0 text-brand-green transition-transform group-open:rotate-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </summary>
            <p className="mt-2 rounded-2xl border border-brand-green/8 bg-brand-green/[0.03] px-4 py-3 text-xs leading-relaxed text-brand-carmelita/85">
              {APP_INSTALL_HINT}
            </p>
          </details>

          <Link
            to="/comprar"
            className="mt-6 text-xs font-semibold text-brand-carmelita/75 underline-offset-2 hover:text-brand-green hover:underline"
          >
            Seguir en el navegador
          </Link>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-brand-green/10 bg-brand-white/95 px-5 py-3 backdrop-blur-md pb-[max(0.75rem,var(--safe-bottom))] sm:hidden">
        <DownloadButton />
        <p className="mt-2 text-center text-[0.65rem] text-brand-carmelita/70">{BRAND_NAME} · Android</p>
      </div>
    </div>
  )
}
