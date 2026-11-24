import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AuthHeader from '../../auth/componentes/AuthHeader.jsx'
import PasswordField from '../../auth/componentes/PasswordField.jsx'
import Button from '../../shared/componentes/Button.jsx'
import { useFormErrorToast } from '../../shared/componentes/useFormErrorToast.jsx'
import MensajeroEntrySheet from '../componentes/MensajeroEntrySheet.jsx'
import { mensajeroLogin } from '../api'
import {
  isMensajeroAuthenticated,
  mensajeroPanelPath,
  mensajeroSetupPath,
  setMensajeroSession,
  setMensajeroSetup,
} from '../utils/session.js'

export default function MensajeroLogin() {
  const { alias } = useParams()
  const navigate = useNavigate()
  const username = String(alias || '').trim().toLowerCase()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const { showError, toastNode } = useFormErrorToast({ aboveNav: true, layerClassName: '!z-[260]' })

  useEffect(() => {
    if (isMensajeroAuthenticated()) {
      navigate(mensajeroPanelPath(username), { replace: true })
      return undefined
    }
    if (!username) return undefined
    let cancelled = false
    mensajeroLogin({ username })
      .then((data) => {
        if (cancelled) return
        if (data.requires_setup) {
          setMensajeroSetup({ ...data.requires_setup, alias: username })
          navigate(mensajeroSetupPath(username), { replace: true })
          return
        }
        setReady(true)
      })
      .catch((error) => {
        if (cancelled) return
        if (error.status !== 401) showError(error.message)
        setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [navigate, showError, username])

  function leave() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/', { replace: true })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const entered = password.trim()
      if (!entered) {
        showError('Escribe tu contraseña.')
        return
      }
      const data = await mensajeroLogin({ username, password: entered })
      if (data.requires_setup) {
        setMensajeroSetup({ ...data.requires_setup, alias: username })
        navigate(mensajeroSetupPath(username), { replace: true })
        return
      }
      setMensajeroSession(data.access_token, data.mensajero)
      navigate(mensajeroPanelPath(username), { replace: true })
    } catch (error) {
      showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MensajeroEntrySheet titleId="mensajero-login-title" onClose={leave}>
      {toastNode}
      <AuthHeader titleId="mensajero-login-title" title="Mensajero" description={ready ? `Entra con el alias ${username}` : 'Revisando tu acceso…'} />
      {ready ? (
        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          <PasswordField id="mensajero-password" label="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required={false} />
          <Button type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</Button>
        </form>
      ) : null}
    </MensajeroEntrySheet>
  )
}
