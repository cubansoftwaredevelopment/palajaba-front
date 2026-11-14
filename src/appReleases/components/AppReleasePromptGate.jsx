import { useEffect, useState } from 'react'
import { useLocation, useMatch } from 'react-router-dom'
import { OPEN_APP_UPDATE_EVENT } from '../../live/utils'
import {
  APP_RELEASE_PROMPT_EVENT,
  clearUpdatePromptDismissed,
  consumeAppReleasePromptPending,
  peekAppReleasePromptPending,
  rememberDownloadPromptDismissed,
  rememberUpdatePromptDismissed,
  resolveAppReleasePromptAction,
  shouldShowUpdatePrompt,
  wasDownloadPromptDismissed,
  wasUpdatePromptDismissed,
} from '../lib/prompt.js'
import {
  getNativeAppVersion,
  getNativePlatformKey,
  isInNativeApp,
  loadAppReleasePromptStatus,
  loadMainAppReleases,
  mainsFromPromptStatus,
  startAppReleaseDownload,
} from '../lib/releases.js'
import { DownloadModal } from './AppDownloadPrompt.jsx'
import { UpdateModal } from './AppUpdatePrompt.jsx'

function isPreviewPath() {
  return (
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('vista') === 'preview'
  )
}

export default function AppReleasePromptGate() {
  const location = useLocation()
  const comprarHome = useMatch({ path: '/comprar', end: true })
  const sellerHome = useMatch({ path: '/tienda', end: true })
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const [mains, setMains] = useState(null)
  const [nativeVersion, setNativeVersion] = useState(null)
  const [mainRelease, setMainRelease] = useState(null)
  const [updatePlatform, setUpdatePlatform] = useState(null)
  const [busy, setBusy] = useState(false)
  const [bouncePlatform, setBouncePlatform] = useState('')
  const [promptTick, setPromptTick] = useState(0)
  const [forceUpdateCheck, setForceUpdateCheck] = useState(false)

  useEffect(() => {
    function onPromptRequest() {
      setPromptTick((value) => value + 1)
    }
    function onAppUpdatePush(event) {
      const detail = event?.detail || {}
      const currentPlatform = getNativePlatformKey()
      if (
        detail.platform &&
        currentPlatform &&
        detail.platform !== currentPlatform
      ) {
        return
      }
      clearUpdatePromptDismissed()
      setForceUpdateCheck(true)
      setPromptTick((value) => value + 1)
    }
    window.addEventListener(APP_RELEASE_PROMPT_EVENT, onPromptRequest)
    window.addEventListener(OPEN_APP_UPDATE_EVENT, onAppUpdatePush)
    return () => {
      window.removeEventListener(APP_RELEASE_PROMPT_EVENT, onPromptRequest)
      window.removeEventListener(OPEN_APP_UPDATE_EVENT, onAppUpdatePush)
    }
  }, [])

  useEffect(() => {
    if (isPreviewPath()) return undefined
    let cancelled = false

    ;(async () => {
      const pending = peekAppReleasePromptPending()
      const consider = Boolean(pending || comprarHome || sellerHome || forceUpdateCheck)
      if (!consider) return

      const inNative = isInNativeApp()
      const platform = inNative ? getNativePlatformKey() : null
      const [status, publicMains, version] = await Promise.all([
        loadAppReleasePromptStatus(),
        loadMainAppReleases(),
        inNative ? getNativeAppVersion() : Promise.resolve(null),
      ])
      if (cancelled) return

      const resolvedMains = status ? mainsFromPromptStatus(status) : publicMains
      const statusForResolve =
        status ||
        (resolvedMains
          ? {
              android: {
                main: resolvedMains.android,
                downloaded_version: null,
                needs_download: Boolean(resolvedMains.android),
              },
              ios: {
                main: resolvedMains.ios,
                downloaded_version: null,
                needs_download: Boolean(resolvedMains.ios),
              },
            }
          : null)
      const guestHasBuild = Boolean(resolvedMains?.android || resolvedMains?.ios)
      const action = resolveAppReleasePromptAction({
        inNativeApp: inNative,
        nativeVersion: version,
        nativePlatform: platform,
        status: statusForResolve,
        guestHasBuild,
      })

      if (action === 'update' || (forceUpdateCheck && inNative)) {
        const release =
          platform === 'ios'
            ? resolvedMains?.ios || publicMains?.ios
            : platform === 'android'
              ? resolvedMains?.android || publicMains?.android
              : null
        const shouldOpen =
          Boolean(release && version && shouldShowUpdatePrompt(version, release.version)) &&
          (forceUpdateCheck || !wasUpdatePromptDismissed(release.version))
        if (!shouldOpen) {
          if (pending) consumeAppReleasePromptPending()
          if (forceUpdateCheck) setForceUpdateCheck(false)
          setUpdateOpen(false)
          return
        }
        if (pending) consumeAppReleasePromptPending()
        if (forceUpdateCheck) setForceUpdateCheck(false)
        setNativeVersion(version)
        setMainRelease(release)
        setUpdatePlatform(platform)
        setDownloadOpen(false)
        setUpdateOpen(true)
        return
      }

      if (action === 'download') {
        if (wasDownloadPromptDismissed()) {
          if (pending) consumeAppReleasePromptPending()
          setDownloadOpen(false)
          return
        }
        if (pending) consumeAppReleasePromptPending()
        setMains(resolvedMains)
        setUpdateOpen(false)
        setDownloadOpen(true)
        return
      }

      if (pending) consumeAppReleasePromptPending()
      setUpdateOpen(false)
      setDownloadOpen(false)
    })()

    return () => {
      cancelled = true
    }
  }, [location.pathname, location.search, comprarHome, sellerHome, promptTick, forceUpdateCheck])

  useEffect(() => {
    if (!bouncePlatform) return undefined
    const timer = window.setTimeout(() => setBouncePlatform(''), 700)
    return () => window.clearTimeout(timer)
  }, [bouncePlatform])

  function handleDownloadClose() {
    rememberDownloadPromptDismissed()
    setDownloadOpen(false)
  }

  function handleUpdateClose() {
    if (mainRelease?.version) rememberUpdatePromptDismissed(mainRelease.version)
    setUpdateOpen(false)
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

  async function handleUpdate() {
    if (!mainRelease) return
    setBusy(true)
    try {
      await startAppReleaseDownload(mainRelease)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {downloadOpen ? (
        <DownloadModal
          onClose={handleDownloadClose}
          mains={mains}
          bouncePlatform={bouncePlatform}
          onDownload={handleDownload}
        />
      ) : null}
      {updateOpen && mainRelease ? (
        <UpdateModal
          onClose={handleUpdateClose}
          nativeVersion={nativeVersion}
          mainRelease={mainRelease}
          platform={updatePlatform || mainRelease.platform}
          busy={busy}
          onUpdate={handleUpdate}
        />
      ) : null}
    </>
  )
}
