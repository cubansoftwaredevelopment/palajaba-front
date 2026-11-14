import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminButton from '../../components/admin/AdminButton'
import AdminModal from '../../components/admin/AdminModal'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import {
  adminAlertError,
  adminAlertSuccess,
  adminCard,
  adminFocusRing,
  adminInput,
  adminLabel,
  adminMuted,
  adminSection,
  adminSubtle,
} from '../../components/admin/adminStyles'
import {
  createAdminAppRelease,
  deleteAdminAppRelease,
  fetchAdminAppReleases,
  setAdminAppReleaseMain,
} from '../api.js'
import { formatDateTime } from '../../lib/dates'
import { getUserFacingMessage, isSessionError } from '../../lib/userFacingError'
import { clearAdminToken, getAdminToken } from '../../lib/adminAuth'
import LoadingState from '../../components/ui/LoadingState'

const PLATFORMS = [
  { id: 'android', label: 'Android', accept: '.apk,application/vnd.android.package-archive', ext: '.apk' },
  { id: 'ios', label: 'iOS', accept: '.ipa,application/octet-stream', ext: '.ipa' },
]

function PlatformTable({
  platform,
  items,
  busyId,
  onUpload,
  onSetMain,
  onDelete,
}) {
  const meta = PLATFORMS.find((item) => item.id === platform)
  return (
    <section className={`${adminCard} flex min-w-0 flex-1 flex-col`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-50">{meta.label}</h2>
          <p className={`mt-1 text-sm ${adminSubtle}`}>Hasta 5 builds. Uno marcado como main.</p>
        </div>
        <AdminButton type="button" size="sm" className="!w-auto" onClick={() => onUpload(platform)}>
          Subir build
        </AdminButton>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-950/60 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2.5 font-medium">Versión</th>
              <th className="px-3 py-2.5 font-medium">Descargas</th>
              <th className="px-3 py-2.5 font-medium">Subida</th>
              <th className="px-3 py-2.5 font-medium">Estado</th>
              <th className="px-3 py-2.5 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!items.length ? (
              <tr>
                <td colSpan={5} className={`px-3 py-8 text-center ${adminMuted}`}>
                  Aún no hay builds {meta.label}.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const busy = busyId === item.id
                return (
                  <tr key={item.id} className="border-t border-zinc-800/70">
                    <td className="px-3 py-3 font-medium tabular-nums text-zinc-100">{item.version}</td>
                    <td className="px-3 py-3 tabular-nums text-zinc-100">{item.download_count ?? 0}</td>
                    <td className={`px-3 py-3 ${adminSubtle}`}>{formatDateTime(item.uploaded_at)}</td>
                    <td className="px-3 py-3">
                      {item.is_main ? (
                        <span className="rounded-md border border-brand-green/35 bg-brand-green/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-200">
                          Main
                        </span>
                      ) : (
                        <span className={`text-xs ${adminMuted}`}>—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busy || item.is_main}
                          onClick={() => onSetMain(item)}
                          className={`rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-brand-green/40 hover:text-brand-green disabled:cursor-not-allowed disabled:opacity-40 ${adminFocusRing}`}
                        >
                          Set main
                        </button>
                        <button
                          type="button"
                          disabled={busy || item.is_main}
                          onClick={() => onDelete(item)}
                          className={`rounded-lg border border-brand-carmelita/30 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-brand-carmelita/50 hover:text-brand-carmelita disabled:cursor-not-allowed disabled:opacity-40 ${adminFocusRing}`}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function AdminApps() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [uploadPlatform, setUploadPlatform] = useState(null)
  const [version, setVersion] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const loadReleases = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const token = getAdminToken()
      const data = await fetchAdminAppReleases(token)
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos cargar los builds.'))
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    loadReleases()
  }, [loadReleases])

  const byPlatform = useMemo(() => {
    const android = items.filter((item) => item.platform === 'android')
    const ios = items.filter((item) => item.platform === 'ios')
    return { android, ios }
  }, [items])

  function closeUpload() {
    if (uploading) return
    setUploadPlatform(null)
    setVersion('')
    setFile(null)
    setUploadProgress(0)
  }

  async function handleUpload(event) {
    event.preventDefault()
    if (!uploadPlatform || !file) {
      setError('Selecciona el archivo del build.')
      return
    }
    setUploading(true)
    setUploadProgress(0)
    setError('')
    setSuccess('')
    try {
      const token = getAdminToken()
      await createAdminAppRelease(token, file, {
        platform: uploadPlatform,
        version: version.trim(),
        onProgress: setUploadProgress,
      })
      setSuccess(`Build ${uploadPlatform} ${version.trim()} subido.`)
      setUploading(false)
      setUploadProgress(0)
      setUploadPlatform(null)
      setVersion('')
      setFile(null)
      await loadReleases()
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos subir el build.'))
    } finally {
      setUploading(false)
    }
  }

  async function handleSetMain(item) {
    setBusyId(item.id)
    setError('')
    setSuccess('')
    try {
      const token = getAdminToken()
      await setAdminAppReleaseMain(token, item.id)
      setSuccess(`${item.platform} ${item.version} marcado como main.`)
      await loadReleases()
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos marcar el build como main.'))
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    setError('')
    setSuccess('')
    try {
      const token = getAdminToken()
      await deleteAdminAppRelease(token, deleteTarget.id)
      setSuccess(`Build ${deleteTarget.version} eliminado.`)
      setDeleteTarget(null)
      await loadReleases()
    } catch (err) {
      if (isSessionError(err)) {
        clearAdminToken()
        navigate('/admin', { replace: true })
        return
      }
      setError(getUserFacingMessage(err, 'No pudimos eliminar el build.'))
    } finally {
      setBusyId(null)
    }
  }

  const uploadMeta = PLATFORMS.find((item) => item.id === uploadPlatform)

  return (
    <div className={adminSection}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        {error ? <p className={adminAlertError}>{error}</p> : null}
        {success ? <p className={adminAlertSuccess}>{success}</p> : null}

        {loading ? (
          <LoadingState message="Cargando builds…" />
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row">
            <PlatformTable
              platform="android"
              items={byPlatform.android}
              busyId={busyId}
              onUpload={setUploadPlatform}
              onSetMain={handleSetMain}
              onDelete={setDeleteTarget}
            />
            <PlatformTable
              platform="ios"
              items={byPlatform.ios}
              busyId={busyId}
              onUpload={setUploadPlatform}
              onSetMain={handleSetMain}
              onDelete={setDeleteTarget}
            />
          </div>
        )}
      </div>

      {uploadPlatform && uploadMeta ? (
        <AdminModal
          title={`Subir build ${uploadMeta.label}`}
          subtitle={`Archivo ${uploadMeta.ext}. La versión debe ser la del binario (versionName / CFBundleShortVersionString).`}
          onClose={closeUpload}
        >
          <form className="flex flex-col gap-4" onSubmit={handleUpload}>
            <div>
              <label className={adminLabel} htmlFor="app-release-version">
                Versión
              </label>
              <input
                id="app-release-version"
                className={adminInput}
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="1.0.6"
                required
                autoFocus
              />
              <p className={`mt-1.5 text-xs ${adminMuted}`}>
                Debe coincidir con la del APK/IPA. Genera el APK con{' '}
                <span className="font-mono text-zinc-300">npm run apk -- -AppVersion 1.0.6</span>.
              </p>
            </div>
            <div>
              <label className={adminLabel} htmlFor="app-release-file">
                Archivo {uploadMeta.ext}
              </label>
              <input
                id="app-release-file"
                type="file"
                accept={uploadMeta.accept}
                className={`${adminInput} file:mr-3 file:rounded-lg file:border-0 file:bg-brand-green/20 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-green`}
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                disabled={uploading}
                required
              />
            </div>
            {uploading ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-3" aria-live="polite">
                <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-zinc-300">
                  <span>Subiendo build…</span>
                  <span className="tabular-nums text-brand-green">{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-brand-green transition-[width] duration-150 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <AdminButton type="button" variant="secondary" onClick={closeUpload} disabled={uploading}>
                Cancelar
              </AdminButton>
              <AdminButton type="submit" disabled={uploading || !file || !version.trim()}>
                {uploading ? `Subiendo ${uploadProgress}%` : 'Subir'}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          title="Eliminar build"
          subtitle={`${deleteTarget.platform} ${deleteTarget.version}`}
          confirmLabel="Eliminar"
          confirmVariant="danger"
          loading={busyId === deleteTarget.id}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        >
          <p className={`text-sm ${adminSubtle}`}>
            ¿Eliminar este build? Esta acción no se puede deshacer.
          </p>
        </ConfirmDialog>
      ) : null}
    </div>
  )
}
