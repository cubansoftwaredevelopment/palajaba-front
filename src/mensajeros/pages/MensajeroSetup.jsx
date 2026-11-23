import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import AuthHeader from '../../components/auth/AuthHeader'
import PasswordField from '../../components/auth/PasswordField'
import Button from '../../components/Button'
import { useFormErrorToast } from '../../components/ui/useFormErrorToast'
import MensajeroEntrySheet from '../components/MensajeroEntrySheet'
import { mensajeroSetup } from '../api'
import { getMensajeroSetup, mensajeroLoginPath, mensajeroPanelPath, setMensajeroSession } from '../lib/session'

export default function MensajeroSetup() {
  const { alias } = useParams()
  const navigate = useNavigate()
  const setup = getMensajeroSetup()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const { showError, toastNode } = useFormErrorToast({ aboveNav: true, layerClassName: '!z-[260]' })

  if (!setup?.setup_token) return <Navigate to={mensajeroLoginPath(alias)} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      showError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      const data = await mensajeroSetup({ setup_token: setup.setup_token, password })
      setMensajeroSession(data.access_token, data.mensajero)
      navigate(mensajeroPanelPath(alias), { replace: true })
    } catch (error) {
      showError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MensajeroEntrySheet titleId="mensajero-setup-title" onClose={() => navigate(mensajeroLoginPath(alias), { replace: true })}>
      {toastNode}
      <AuthHeader titleId="mensajero-setup-title" title="Crea tu contraseña" description="Con ella entras a tus mensajerías." />
      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <PasswordField id="mensajero-new-password" label="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required={false} />
        <PasswordField id="mensajero-confirm-password" label="Confirmar" value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" required={false} />
        <Button type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar contraseña'}</Button>
      </form>
    </MensajeroEntrySheet>
  )
}
