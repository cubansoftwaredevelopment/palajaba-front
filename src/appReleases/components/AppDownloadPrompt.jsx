import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import BuyerModalPortal from '../../buyer/components/BuyerModalPortal'
import {
  buyerProductDetailBody,
  buyerProductDetailModal,
  buyerProductDetailName,
  buyerProductDetailOverlay,
  buyerProductDetailStickyBar,
} from '../../buyer/components/buyerStyles'
import { useDismissibleModal } from '../../buyer/components/useOrderModalPresence'
import { APP_LOGO } from '../constants.js'
import { rememberDownloadPromptDismissed } from '../lib/prompt.js'
import {
  androidDownloadFallbackHref,
  isInNativeApp,
  loadMainAppReleases,
  releaseFileHref,
  shouldShowDownloadPrompt,
  startAppReleaseDownload,
} from '../lib/releases.js'

function AndroidIcon({ className = '' }) {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.6 9.48 19.1 6.9a.5.5 0 0 0-.86-.5l-1.55 2.68A8.2 8.2 0 0 0 12 8c-1.7 0-3.27.5-4.69 1.35L5.76 6.4a.5.5 0 1 0-.86.5l1.5 2.58A8 8 0 0 0 4 15.5V16a1 1 0 0 0 1 1h1v2.5a1.5 1.5 0 0 0 3 0V17h6v2.5a1.5 1.5 0 0 0 3 0V17h1a1 1 0 0 0 1-1v-.5a8 8 0 0 0-2.4-5.52ZM9.25 13.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
    </svg>
  )
}

function AppleIcon({ className = '' }) {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M16.7 12.2c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.7-1.7-3.3-1.7-1.4-.1-2.7.8-3.4.8s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.4-.9-2.5-3.7Zm-2.4-7c.6-.8 1.1-1.8.9-2.9-1 0-2.1.6-2.7 1.4-.5.7-1.1 1.8-.9 2.8 1.1.1 2.1-.5 2.7-1.3Z" />
    </svg>
  )
}

const platformButtonClass =
  'flex min-h-[4.5rem] flex-1 items-stretch gap-0 overflow-hidden rounded-2xl border border-brand-green/15 bg-brand-white text-left transition-colors touch-manipulation active:bg-brand-green/[0.06] disabled:opacity-50 sm:hover:bg-brand-green/[0.04]'

const BOUNCE_MS = 700

function PlatformDownloadButton({ label, version, bouncing, onClick, icon, ariaLabel }) {
  return (
    <button
      type="button"
      disabled={bouncing}
      onClick={onClick}
      className={platformButtonClass}
      aria-label={ariaLabel}
    >
      <span className="flex w-[3.25rem] shrink-0 items-center justify-center bg-brand-green text-brand-white sm:w-14">
        <span className={bouncing ? 'motion-safe:animate-app-download-bounce' : undefined}>{icon}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-3 py-2.5">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-brand-carmelita/70">
          {label}
        </span>
        <span className="truncate text-base font-semibold tabular-nums text-brand-green">{version}</span>
      </span>
    </button>
  )
}

export function DownloadModal({ onClose, mains, bouncePlatform, onDownload }) {
  const titleId = useId()
  const { dismiss, motionClass } = useDismissibleModal(onClose)

  const android = mains?.android || null
  const ios = mains?.ios || null
  const androidHref = androidDownloadFallbackHref(mains)
  const iosHref = releaseFileHref(ios)
  const showAndroid = Boolean(android && androidHref)
  const showIos = Boolean(ios && iosHref)

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [dismiss])

  function handlePlatformDownload(platform, release, href) {
    onDownload(platform, release, href)
    window.setTimeout(() => dismiss(), 220)
  }

  return (
    <BuyerModalPortal>
      <div
        className={`${buyerProductDetailOverlay} z-[110] ${motionClass}`}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) dismiss()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`${buyerProductDetailModal} max-h-[min(92dvh,32rem)]`}
        >
          <div className="shrink-0 px-5 pt-3">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-brand-green/15 sm:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-brand-green/8 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.06em] text-brand-green">
                App móvil
              </span>
              <button
                type="button"
                onClick={dismiss}
                className="flex h-10 w-10 items-center justify-center rounded-full text-brand-carmelita touch-manipulation active:bg-brand-green/8"
                aria-label="Cerrar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className={buyerProductDetailBody}>
            <div className="flex flex-col items-center px-5 pb-5 pt-2 text-center">
              <div className="relative mb-4 overflow-hidden rounded-2xl border border-brand-green/12 bg-brand-white p-3 shadow-[0_8px_28px_rgba(89,128,44,0.12)]">
                <img
                  src={APP_LOGO.src}
                  alt={APP_LOGO.alt}
                  className="h-20 w-20 object-contain"
                  width={80}
                  height={80}
                  decoding="async"
                />
              </div>
              <h2 id={titleId} className={`${buyerProductDetailName} !mt-0`}>
                Lleva Pa&apos; La Jaba en el bolsillo
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-brand-carmelita/90">
                {showAndroid && showIos
                  ? 'Descarga la app para Android o iOS y compra o vende con más comodidad.'
                  : showAndroid
                    ? 'Descarga la app para Android y compra o vende con más comodidad.'
                    : showIos
                      ? 'Descarga la app para iOS y compra o vende con más comodidad.'
                      : 'Pronto podrás descargar la app móvil.'}
              </p>
              <Link
                to="/aplicacion"
                onClick={dismiss}
                className="mt-4 inline-flex text-xs font-semibold text-brand-green underline-offset-2 hover:underline"
              >
                Ver más sobre la app
              </Link>
            </div>
          </div>

          {showAndroid || showIos ? (
            <div className={buyerProductDetailStickyBar}>
              <div className="flex gap-px">
                {showAndroid ? (
                  <PlatformDownloadButton
                    label="android"
                    version={android.version}
                    bouncing={bouncePlatform === 'android'}
                    onClick={() => handlePlatformDownload('android', android, androidHref)}
                    icon={<AndroidIcon />}
                    ariaLabel={`Descargar Android ${android.version}`}
                  />
                ) : null}
                {showIos ? (
                  <PlatformDownloadButton
                    label="apple"
                    version={ios.version}
                    bouncing={bouncePlatform === 'ios'}
                    onClick={() => handlePlatformDownload('ios', ios, iosHref)}
                    icon={<AppleIcon />}
                    ariaLabel={`Descargar Apple ${ios.version}`}
                  />
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </BuyerModalPortal>
  )
}

export default function AppDownloadPrompt() {
  const [open, setOpen] = useState(false)
  const [mains, setMains] = useState(null)
  const [bouncePlatform, setBouncePlatform] = useState('')
  const visible = shouldShowDownloadPrompt() && !isInNativeApp()
  const showAndroid = Boolean(mains?.android)
  const showIos = Boolean(mains?.ios)
  const hasAnyBuild = showAndroid || showIos

  useEffect(() => {
    if (!visible) return undefined
    let cancelled = false
    loadMainAppReleases().then((data) => {
      if (!cancelled) setMains(data)
    })
    return () => {
      cancelled = true
    }
  }, [visible])

  useEffect(() => {
    if (!bouncePlatform) return undefined
    const timer = window.setTimeout(() => setBouncePlatform(''), BOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [bouncePlatform])

  if (!visible || mains === null || !hasAnyBuild) return null

  function handleClose() {
    rememberDownloadPromptDismissed()
    setOpen(false)
  }

  function handleDownload(platform, release, fallbackHref) {
    setBouncePlatform(platform)
    rememberDownloadPromptDismissed()
    if (release) {
      void startAppReleaseDownload(release)
      return
    }
    if (fallbackHref) window.location.assign(fallbackHref)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 min-w-[3.25rem] items-center justify-center gap-1 rounded-full px-1.5 text-brand-green/40 transition-colors touch-manipulation active:bg-brand-green/10 active:text-brand-green/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green/25 sm:hover:bg-brand-green/8 sm:hover:text-brand-green/60 lg:h-12 lg:min-w-[3.5rem]"
        aria-label="Descargar la app"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Descargar la app"
      >
        {showAndroid ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
            className={`lg:h-7 lg:w-7 ${bouncePlatform === 'android' ? 'text-brand-green motion-safe:animate-app-download-bounce' : ''}`}
          >
            <path d="M17.6 9.48 19.1 6.9a.5.5 0 0 0-.86-.5l-1.55 2.68A8.2 8.2 0 0 0 12 8c-1.7 0-3.27.5-4.69 1.35L5.76 6.4a.5.5 0 1 0-.86.5l1.5 2.58A8 8 0 0 0 4 15.5V16a1 1 0 0 0 1 1h1v2.5a1.5 1.5 0 0 0 3 0V17h6v2.5a1.5 1.5 0 0 0 3 0V17h1a1 1 0 0 0 1-1v-.5a8 8 0 0 0-2.4-5.52ZM9.25 13.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
          </svg>
        ) : null}
        {showIos ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
            className={`lg:h-6 lg:w-6 ${bouncePlatform === 'ios' ? 'text-brand-green motion-safe:animate-app-download-bounce' : ''}`}
          >
            <path d="M16.7 12.2c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.7-1.7-3.3-1.7-1.4-.1-2.7.8-3.4.8s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.4-.9-2.5-3.7Zm-2.4-7c.6-.8 1.1-1.8.9-2.9-1 0-2.1.6-2.7 1.4-.5.7-1.1 1.8-.9 2.8 1.1.1 2.1-.5 2.7-1.3Z" />
          </svg>
        ) : null}
      </button>
      {open ? (
        <DownloadModal
          onClose={handleClose}
          mains={mains}
          bouncePlatform={bouncePlatform}
          onDownload={handleDownload}
        />
      ) : null}
    </>
  )
}
