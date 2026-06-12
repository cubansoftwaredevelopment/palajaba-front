import { useState } from 'react'
import WelcomeOnboarding from '../components/onboarding/WelcomeOnboarding'
import Welcome from './Welcome'
import {
  hasCompletedWelcomeOnboarding,
  markWelcomeOnboardingComplete,
} from '../lib/welcomeOnboarding'

export default function WelcomeGate() {
  const [completed, setCompleted] = useState(() => hasCompletedWelcomeOnboarding())

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
