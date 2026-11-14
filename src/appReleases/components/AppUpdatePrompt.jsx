import { useEffect, useId, useState } from 'react'
import BuyerModalPortal from '../../buyer/components/BuyerModalPortal'
import { useDismissibleModal } from '../../buyer/components/useOrderModalPresence'
import {
  getNativeAppVersion,
  getNativePlatformKey,
  isInNativeApp,
  loadMainAppReleases,
  shouldShowUpdatePrompt,
  startAppReleaseDownload,
} from '../lib/releases.js'

const DISMISS_KEY = 'pala-jaba-app-update-dismissed'

function dismissedFor(version) {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === String(version || '')
  } catch {
    return false
  }
}

function rememberDismiss(version) {
  try {
    window.sessionStorage.setItem(DISMISS_KEY, String(version || ''))
  } catch {
    /* ignore */
  }
}

function UpdateModal({ open, onClose, nativeVersion, mainRelease, busy, onUpdate }) {
  const titleId = useId()
  const { dismiss, motionClass } = useDismissibleModal(onClose)
  if (!open || !mainRelease) return null

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
                Hay una actualización
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-brand-carmelita/90">
                Tienes la versión {nativeVersion || '—'}. Ya está disponible la {mainRelease.version}.
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
              disabled={busy}
              onClick={onUpdate}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-green px-4 text-sm font-semibold text-brand-white touch-manipulation disabled:opacity-50"
            >
              {busy ? 'Descargando…' : `Actualizar a ${mainRelease.version}`}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-brand-green/20 bg-brand-white px-4 text-sm font-semibold text-brand-carmelita/90 touch-manipulation"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </BuyerModalPortal>
  )
}

export default function AppUpdatePrompt() {
  const [mainRelease, setMainRelease] = useState(null)
  const [nativeVersion, setNativeVersion] = useState(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isInNativeApp()) return undefined
    let cancelled = false
    ;(async () => {
      const [version, mains, platform] = await Promise.all([
        getNativeAppVersion(),
        loadMainAppReleases(),
        Promise.resolve(getNativePlatformKey()),
      ])
      if (cancelled) return
      setNativeVersion(version)
      const release = platform === 'ios' ? mains?.ios : mains?.android
      setMainRelease(release || null)
      if (
        release &&
        shouldShowUpdatePrompt(version, release.version) &&
        !dismissedFor(release.version)
      ) {
        setOpen(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!isInNativeApp() || !mainRelease) return null
  if (!shouldShowUpdatePrompt(nativeVersion, mainRelease.version)) return null

  async function handleUpdate() {
    setBusy(true)
    try {
      await startAppReleaseDownload(mainRelease)
    } finally {
      setBusy(false)
    }
  }

  function handleClose() {
    rememberDismiss(mainRelease.version)
    setOpen(false)
  }

  return (
    <UpdateModal
      open={open}
      onClose={handleClose}
      nativeVersion={nativeVersion}
      mainRelease={mainRelease}
      busy={busy}
      onUpdate={handleUpdate}
    />
  )
}
