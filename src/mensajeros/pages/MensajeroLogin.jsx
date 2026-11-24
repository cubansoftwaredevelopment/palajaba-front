import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AuthHeader from '../../auth/componentes/AuthHeader.jsx'
import PasswordField from '../../auth/componentes/PasswordField.jsx'
import Button from '../../shared/componentes/Button.jsx'
import { hintClass } from '../../auth/componentes/formStyles.js'
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
  const { showError, toastNode } = useFormErrorToast({ aboveNav: true, layerClassName: '!z-[260]' })

  useEffect(() => {
    if (isMensajeroAuthenticated()) navigate(mensajeroPanelPath(username), { replace: true })
  }, [navigate, username])

  function leave() {
    if (window.history.length > 1) navigate(-1)
    else navigate('/', { replace: true })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const data = await mensajeroLogin({ username, password: password.trim() || undefined })
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
      <AuthHeader titleId="mensajero-login-title" title="Mensajero" description={`Entra con el alias ${username}`} />
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <PasswordField id="mensajero-password" label="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required={false} />
        <p className={hintClass}>Si es tu primera vez, deja la contraseña vacía para crearla.</p>
        <Button type="submit" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</Button>
      </form>
    </MensajeroEntrySheet>
  )
}
