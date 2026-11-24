import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../../auth/componentes/AuthCard.jsx'
import AuthHeader from '../../auth/componentes/AuthHeader.jsx'
import AuthShell from '../../auth/componentes/AuthShell.jsx'
import Button from '../../shared/componentes/Button.jsx'
import PasswordField from '../../auth/componentes/PasswordField.jsx'
import PhoneField from '../../auth/componentes/PhoneField.jsx'
import { hintClass, inputClass } from '../../auth/componentes/formStyles.js'
import { useFormErrorToast } from '../../shared/componentes/useFormErrorToast.jsx'
import {
  completeCustomerPasswordReset,
  confirmCustomerPasswordReset,
  resendCustomerPasswordReset,
  startCustomerPasswordReset,
} from '../api.js'
import { getUserFacingMessage } from '../../shared/utils/userFacingError.js'

const TITLES = {
  phone: ['Recuperar acceso de cliente', 'Indica el teléfono de tu cuenta. Te enviaremos un código por SMS.'],
  code: ['Confirma que eres tú', 'Ingresa el código que enviamos por SMS para verificar tu identidad.'],
  password: ['Nueva contraseña', 'Elige una contraseña nueva para entrar a tu cuenta de cliente.'],
}

export default function CustomerPasswordReset() {
  const navigate = useNavigate()
  const location = useLocation()
  const canGoBack = location.key !== 'default'
  const [step, setStep] = useState('phone')
  const [phone, setPhone] = useState('')
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [message, setMessage] = useState('')
  const { showError, toastNode } = useFormErrorToast()
  const [loading, setLoading] = useState(false)

  async function start(event) {
    event.preventDefault()
    showError('')
    setMessage('')
    if (phone.length !== 8) {
      showError('Indica un teléfono cubano de 8 dígitos.')
      return
    }
    setLoading(true)
    try {
      const result = await startCustomerPasswordReset(phone)
      setChallenge(result)
      if (result.otp_bypassed) {
        await confirmCustomerPasswordReset(result.challenge_id, '000000')
        setStep('password')
        setMessage('Identidad confirmada. Elige una nueva contraseña.')
      } else {
        setStep('code')
        setMessage(result.message)
      }
    } catch (cause) {
      showError(getUserFacingMessage(cause, 'No pudimos enviar el código. Revisa el teléfono e inténtalo de nuevo.'))
    } finally { setLoading(false) }
  }

  async function verify(event) {
    event.preventDefault()
    showError('')
    if (code.length < 4) {
      showError('Ingresa el código que recibiste por SMS.')
      return
    }
    setLoading(true)
    try {
      const result = await confirmCustomerPasswordReset(challenge.challenge_id, code)
      setStep('password')
      setMessage(result.message)
    } catch (cause) {
      showError(getUserFacingMessage(cause, 'No pudimos verificar el código. Revísalo e inténtalo de nuevo.'))
    } finally { setLoading(false) }
  }

  async function resend() {
    if (!challenge?.challenge_id || loading) return
    showError('')
    setLoading(true)
    try {
      const result = await resendCustomerPasswordReset(challenge.challenge_id)
      setChallenge(result)
      setMessage(result.message)
      setCode('')
      if (result.otp_bypassed) {
        await confirmCustomerPasswordReset(result.challenge_id, '000000')
        setStep('password')
        setMessage('Identidad confirmada. Elige una nueva contraseña.')
      }
    } catch (cause) {
      showError(getUserFacingMessage(cause, 'No pudimos reenviar el código. Inténtalo de nuevo.'))
    } finally { setLoading(false) }
  }

  async function savePassword(event) {
    event.preventDefault()
    showError('')
    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== passwordConfirm) {
      showError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      const result = await completeCustomerPasswordReset(challenge.challenge_id, password)
      navigate('/login', { replace: true, state: { accountType: 'customer', notice: result.message } })
    } catch (cause) {
      showError(getUserFacingMessage(cause, 'No pudimos guardar la contraseña. Vuelve a solicitar el código.'))
    } finally { setLoading(false) }
  }

  return (
    <>
    <AuthShell
      onBack={() => {
        if (canGoBack) navigate(-1)
        else navigate('/')
      }}
      backLabel={canGoBack ? 'Volver' : 'Inicio'}
      contentWidth="narrow"
    >
      <section className="animate-fade-in lg:mx-auto lg:max-w-md" aria-labelledby="customer-reset-title">
        <AuthHeader eyebrow="Clientes" title={TITLES[step][0]} description={TITLES[step][1]} />
        <AuthCard>
          {message ? <p role="status" className="mb-4 rounded-xl border border-brand-yellow/30 bg-brand-yellow/10 px-3.5 py-2.5 text-sm text-brand-green">{message}{step === 'code' && challenge?.phone_hint ? ` Teléfono: +53 ${challenge.phone_hint}.` : ''}</p> : null}

          {step === 'phone' ? <form onSubmit={start} className="flex flex-col gap-4" noValidate>
            <PhoneField id="customer-reset-phone" value={phone} onChange={setPhone} />
            <Button type="submit" disabled={loading}>{loading ? 'Enviando código…' : 'Enviar código'}</Button>
          </form> : null}

          {step === 'code' ? <form onSubmit={verify} className="flex flex-col gap-4" noValidate>
            <div>
              <label htmlFor="customer-reset-code" className="mb-1 block text-xs font-semibold text-brand-green sm:text-sm">Código SMS <span className="text-brand-carmelita">*</span></label>
              <input id="customer-reset-code" type="text" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className={`${inputClass} tracking-[0.35em]`} placeholder="000000" required />
              <p className={hintClass}>Enviado al teléfono terminado en {challenge?.phone_hint?.slice(-2) || '••'}.</p>
            </div>
            <button type="button" onClick={() => void resend()} disabled={loading} className="self-start text-sm font-semibold text-brand-green underline-offset-2 hover:underline disabled:opacity-60">{loading ? 'Enviando…' : 'Reenviar código'}</button>
            <Button type="submit" disabled={loading}>{loading ? 'Verificando…' : 'Verificar código'}</Button>
            <button type="button" onClick={() => { setStep('phone'); setChallenge(null); setCode(''); showError('') }} className="text-sm font-semibold text-brand-carmelita underline-offset-2 hover:underline">Cambiar teléfono</button>
          </form> : null}

          {step === 'password' ? <form onSubmit={savePassword} className="flex flex-col gap-4" noValidate>
            <PasswordField id="customer-reset-password" label="Nueva contraseña" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
            <PasswordField id="customer-reset-password-confirm" label="Confirmar contraseña" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} autoComplete="new-password" />
            <Button type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar contraseña'}</Button>
          </form> : null}
        </AuthCard>
        <p className="mt-6 text-center text-sm text-brand-carmelita/90">¿La recuerdas? <Link to="/login" state={{ accountType: 'customer' }} className="font-semibold text-brand-green underline-offset-2 hover:underline">Inicia sesión</Link></p>
      </section>
    </AuthShell>
    {toastNode}
    </>
  )
}
