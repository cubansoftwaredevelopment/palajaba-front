import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard'
import AuthHeader from '../components/AuthHeader'
import AuthShell from '../components/AuthShell'
import PasswordField from '../components/PasswordField'
import Button from '../../components/Button'
import { alertErrorClass } from '../components/formStyles'
import { completePasswordReset } from '../api.js'
import { getUserFacingMessage } from '../../lib/userFacingError'

export default function ForgotPasswordNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const challengeId = location.state?.challengeId
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!challengeId) {
      navigate('/recuperar', { replace: true })
    }
  }, [challengeId, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      const result = await completePasswordReset({
        challenge_id: challengeId,
        password,
      })
      navigate('/login', {
        replace: true,
        state: { notice: result.message || 'Contraseña actualizada. Ya puedes iniciar sesión.' },
      })
    } catch (err) {
      setError(
        getUserFacingMessage(
          err,
          'No pudimos guardar la contraseña. Solicita los códigos de nuevo.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }

  if (!challengeId) return null

  return (
    <AuthShell backTo="/login" backLabel="Iniciar sesión" contentWidth="narrow">
      <section className="animate-fade-in lg:mx-auto lg:max-w-md" aria-labelledby="reset-password-title">
        <AuthHeader
          eyebrow="Recuperar acceso"
          title="Nueva contraseña"
          description={
            location.state?.message ||
            'Elige una contraseña nueva para entrar a tu tienda.'
          }
        />

        <AuthCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <PasswordField
              id="reset-password"
              label="Nueva contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
            <PasswordField
              id="reset-password-confirm"
              label="Confirmar contraseña"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
            />

            {error ? (
              <p className={alertErrorClass} role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={loading} className="mt-1">
              {loading ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
          </form>
        </AuthCard>
      </section>
    </AuthShell>
  )
}
