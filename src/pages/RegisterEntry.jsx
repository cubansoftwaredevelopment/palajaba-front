import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell'
import { authCenteredBlock } from '../components/auth/authStyles'
import Button from '../components/Button'
import { fetchLaunchPromoStatus } from '../lib/api'
import RegisterPlan from './RegisterPlan'
import RegisterPromoWelcome from './RegisterPromoWelcome'

export default function RegisterEntry() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [promoAvailable, setPromoAvailable] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    fetchLaunchPromoStatus()
      .then((data) => {
        if (!mounted) return
        setPromoAvailable(Boolean(data?.available))
      })
      .catch(() => {
        if (!mounted) return
        setError('No pudimos comprobar la promoción. Puedes continuar con el registro normal.')
        setPromoAvailable(false)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <AuthShell backTo="/" backLabel="Inicio">
        <div className={`${authCenteredBlock} animate-fade-in py-16 text-center`}>
          <p className="text-sm font-medium text-brand-carmelita/85">Comprobando disponibilidad…</p>
        </div>
      </AuthShell>
    )
  }

  if (promoAvailable) {
    return (
      <RegisterPromoWelcome onContinue={() => navigate('/registro/promo/datos')} />
    )
  }

  return <RegisterPlan promoUnavailableMessage={error} />
}
