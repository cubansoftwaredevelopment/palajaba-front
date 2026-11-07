import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../../auth/components/AuthCard'
import AuthHeader from '../../auth/components/AuthHeader'
import AuthShell from '../../auth/components/AuthShell'
import PasswordField from '../../auth/components/PasswordField'
import { AcceptPlatformTerms } from '../../components/PlatformTermsLink'
import Button from '../../components/Button'
import { alertErrorClass, inputClass, labelClass } from '../../auth/components/formStyles'
import { addCustomerFavorite, confirmCustomerRegistration, resendCustomerRegistration, startCustomerRegistration } from '../api.js'
import { setCustomerSession, updateCustomerProfile } from '../../lib/customerAuth'
import { getUserFacingMessage } from '../../lib/userFacingError'

export default function CustomerRegister() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', identity_card: '', password: '' })
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [challenge, setChallenge] = useState(null)
  const [emailCode, setEmailCode] = useState('')
  const [phoneCode, setPhoneCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState('')
  const backTo = location.state?.backTo || '/cliente'

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function start(event) {
    event.preventDefault()
    if (!acceptedTerms) {
      setError('Debes aceptar los términos y condiciones.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await startCustomerRegistration({
        ...form,
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/\D/g, '').replace(/^53(?=\d{8}$)/, ''),
        accepted_terms: true,
      })
      if (result.otp_bypassed) {
        const confirmed = await confirmCustomerRegistration({
          challenge_id: result.challenge_id,
          email_code: '000000',
          phone_code: '000000',
        })
        await finishRegistration(confirmed)
      } else {
        setChallenge(result)
        setInfo(result.message)
      }
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos enviar los códigos de verificación.'))
    } finally { setLoading(false) }
  }

  async function confirm(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await confirmCustomerRegistration({ challenge_id: challenge.challenge_id, email_code: emailCode, phone_code: phoneCode })
      await finishRegistration(result)
    } catch (cause) {
      setError(getUserFacingMessage(cause, 'No pudimos verificar los códigos.'))
    } finally { setLoading(false) }
  }

  async function finishRegistration(result) {
    setCustomerSession(result.access_token, result.customer)
    try {
      const favoriteId = sessionStorage.getItem('pala_jaba_pending_favorite')
      if (favoriteId) {
        updateCustomerProfile(await addCustomerFavorite(result.access_token, favoriteId))
        sessionStorage.removeItem('pala_jaba_pending_favorite')
      }
    } catch { /* account creation succeeds even if saving a favorite temporarily fails */ }
    navigate(backTo, { replace: true })
  }

  async function resend(channel) {
    setError('')
    try {
      const result = await resendCustomerRegistration({ challenge_id: challenge.challenge_id, channel })
      setInfo(result.message)
    } catch (cause) { setError(getUserFacingMessage(cause, 'No pudimos reenviar el código.')) }
  }

  return (
    <AuthShell backTo="/crear-cuenta" backLabel="Tipo de cuenta" contentWidth="narrow">
      <section className="animate-fade-in lg:mx-auto lg:max-w-md">
        <AuthHeader eyebrow="Clientes" title={challenge ? 'Verifica tu cuenta' : 'Crea tu cuenta'} description={challenge ? `Enviamos códigos a ${form.email} y +53 ${form.phone}.` : 'Verifica tu correo y teléfono para guardar tus pedidos, favoritos y direcciones.'} />
        <AuthCard>
          {info ? <p className="mb-4 rounded-xl border border-brand-green/15 bg-brand-green/5 px-3 py-2 text-sm text-brand-green">{info}</p> : null}
          {!challenge ? (
            <form onSubmit={start} className="flex flex-col gap-3.5" noValidate>
              {[['full_name', 'Nombre y apellidos', 'text'], ['email', 'Correo', 'email'], ['phone', 'Teléfono', 'tel']].map(([field, label, type]) => (
                <div key={field}><label htmlFor={`customer-${field}`} className={labelClass}>{label} <span className="text-brand-carmelita">*</span></label><input id={`customer-${field}`} type={type} value={form[field]} onChange={(event) => change(field, event.target.value)} className={inputClass} required /></div>
              ))}
              <div><label htmlFor="customer-identity" className={labelClass}>Carnet de identidad <span className="text-brand-carmelita">*</span></label><input id="customer-identity" type="text" value={form.identity_card} onChange={(event) => change('identity_card', event.target.value)} className={inputClass} required /></div>
              <PasswordField id="customer-password" label="Contraseña" value={form.password} onChange={(event) => change('password', event.target.value)} />
              <AcceptPlatformTerms id="customer-terms" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} />
              {error ? <p className={alertErrorClass} role="alert">{error}</p> : null}
              <Button type="submit" disabled={loading || !acceptedTerms}>{loading ? 'Enviando códigos…' : 'Continuar y verificar'}</Button>
            </form>
          ) : (
            <form onSubmit={confirm} className="flex flex-col gap-3.5" noValidate>
              {['email', 'phone'].map((channel) => <div key={channel}><label htmlFor={`customer-${channel}-code`} className={labelClass}>Código del {channel === 'email' ? 'correo' : 'SMS'} <span className="text-brand-carmelita">*</span></label><div className="flex gap-2"><input id={`customer-${channel}-code`} inputMode="numeric" autoComplete="one-time-code" value={channel === 'email' ? emailCode : phoneCode} onChange={(event) => (channel === 'email' ? setEmailCode : setPhoneCode)(event.target.value.replace(/\D/g, '').slice(0, 6))} className={inputClass} required /><button type="button" onClick={() => resend(channel)} className="shrink-0 rounded-xl border border-brand-green/20 px-3 text-xs font-bold text-brand-green">Reenviar</button></div></div>)}
              {error ? <p className={alertErrorClass} role="alert">{error}</p> : null}
              <Button type="submit" disabled={loading || emailCode.length < 4 || phoneCode.length < 4}>{loading ? 'Verificando…' : 'Verificar y crear cuenta'}</Button>
            </form>
          )}
        </AuthCard>
        <p className="mt-5 text-center text-sm text-brand-carmelita/80">¿Ya tienes cuenta? <Link to="/login" state={{ accountType: 'customer', backTo }} className="font-semibold text-brand-green underline">Inicia sesión</Link></p>
      </section>
    </AuthShell>
  )
}
