const STORAGE_KEY = 'pala-jaba-welcome-onboarding-done'

export function hasCompletedWelcomeOnboarding() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function markWelcomeOnboardingComplete() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // localStorage no disponible
  }
}
