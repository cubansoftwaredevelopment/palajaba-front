import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import WelcomeOnboarding from '../components/onboarding/WelcomeOnboarding'
import Welcome from './Welcome'
import { getCustomerToken } from '../lib/customerAuth'
import { getSellerToken } from '../lib/sellerAuth'
import {
  hasCompletedWelcomeOnboarding,
  markWelcomeOnboardingComplete,
} from '../lib/welcomeOnboarding'

export default function WelcomeGate() {
  const [completed, setCompleted] = useState(() => hasCompletedWelcomeOnboarding())

  if (getSellerToken() || getCustomerToken()) {
    return <Navigate to="/comprar/provincia" replace />
  }

  if (!completed) {
    return (
      <WelcomeOnboarding
        onComplete={() => {
          markWelcomeOnboardingComplete()
          setCompleted(true)
        }}
      />
    )
  }

  return <Welcome />
}
