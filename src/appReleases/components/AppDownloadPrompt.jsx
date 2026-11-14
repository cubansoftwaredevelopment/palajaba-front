import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import BuyerModalPortal from '../../buyer/components/BuyerModalPortal'
import { useDismissibleModal } from '../../buyer/components/useOrderModalPresence'
import {
  androidDownloadFallbackHref,
  isInNativeApp,
  loadMainAppReleases,
  releaseFileHref,
  shouldShowDownloadPrompt,
  startAppReleaseDownload,
} from '../lib/releases.js'

function DownloadModal({ open, onClose, mains, busy, onDownload }) {
  const titleId = useId()
  const { dismiss, motionClass } = useDismissibleModal(onClose)
  if (!open) return null

  const android = mains?.android || null
  const ios = mains?.ios || null
  const androidHref = androidDownloadFallbackHref(mains)
  const iosHref = releaseFileHref(ios)

  return (
    <BuyerModalPortal>
      <div
        className={`fixed inset-0 z-[110] flex items-end justify-center bg-brand-green/25 p-3 sm:items-center ${motionClass}`}
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) dismiss()
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="w-full max-w-md rounded-3xl border border-brand-green/10 bg-brand-white p-5 shadow-[0_16px_48px_rgba(89,128,44,0.2)]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={titleId} className="font-display text-lg font-bold text-brand-green">
                Lleva Pa&apos; La Jaba en el bolsillo
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-brand-carmelita/90">
                Descarga la app para Android o iOS y compra o vende con más comodidad.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-carmelita touch-manipulation active:bg-brand-green/8"
              aria-label="Cerrar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              disabled={busy === 'android' || !androidHref}
              onClick={() => onDownload('android', android, androidHref)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-green px-4 text-sm font-semibold text-brand-white touch-manipulation disabled:opacity-50"
            >
              {busy === 'android' ? 'Descargando…' : android ? `Android · ${android.version}` : 'Android'}
            </button>
            <button
              type="button"
              disabled={busy === 'ios' || !iosHref}
              onClick={() => onDownload('ios', ios, iosHref)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-brand-green/25 bg-brand-white px-4 text-sm font-semibold text-brand-green touch-manipulation disabled:opacity-50"
            >
              {busy === 'ios' ? 'Descargando…' : ios ? `iOS · ${ios.version}` : 'iOS pronto'}
            </button>
          </div>

          <Link
            to="/aplicacion"
            onClick={dismiss}
            className="mt-4 inline-flex text-xs font-semibold text-brand-green underline-offset-2 hover:underline"
          >
            Ver más sobre la app
          </Link>
        </div>
      </div>
    </BuyerModalPortal>
  )
}

export default function AppDownloadPrompt() {
  const [open, setOpen] = useState(false)
  const [mains, setMains] = useState(null)
  const [busy, setBusy] = useState('')
  const visible = shouldShowDownloadPrompt() && !isInNativeApp()

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

  if (!visible) return null

  async function handleDownload(platform, release, fallbackHref) {
    setBusy(platform)
    try {
      if (release) {
        await startAppReleaseDownload(release)
        return
      }
      if (fallbackHref) window.location.assign(fallbackHref)
    } finally {
      setBusy('')
    }
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="lg:h-7 lg:w-7">
          <path d="M17.6 9.48 19.1 6.9a.5.5 0 0 0-.86-.5l-1.55 2.68A8.2 8.2 0 0 0 12 8c-1.7 0-3.27.5-4.69 1.35L5.76 6.4a.5.5 0 1 0-.86.5l1.5 2.58A8 8 0 0 0 4 15.5V16a1 1 0 0 0 1 1h1v2.5a1.5 1.5 0 0 0 3 0V17h6v2.5a1.5 1.5 0 0 0 3 0V17h1a1 1 0 0 0 1-1v-.5a8 8 0 0 0-2.4-5.52ZM9.25 13.25a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm5.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
        </svg>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="lg:h-6 lg:w-6">
          <path d="M16.7 12.2c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.7-1.7-3.3-1.7-1.4-.1-2.7.8-3.4.8s-1.8-.8-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6-.1 0-2.4-.9-2.5-3.7Zm-2.4-7c.6-.8 1.1-1.8.9-2.9-1 0-2.1.6-2.7 1.4-.5.7-1.1 1.8-.9 2.8 1.1.1 2.1-.5 2.7-1.3Z" />
        </svg>
      </button>
      <DownloadModal
        open={open}
        onClose={() => setOpen(false)}
        mains={mains}
        busy={busy}
        onDownload={handleDownload}
      />
    </>
  )
}
