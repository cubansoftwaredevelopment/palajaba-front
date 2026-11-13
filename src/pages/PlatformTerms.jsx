import { useLocation } from 'react-router-dom'
import AuthShell from '../auth/components/AuthShell'
import LegalDocument from '../components/LegalDocument'
import { PLATFORM_TERMS_SECTIONS, PLATFORM_TERMS_VERSION } from '../lib/platformTerms'

function returnPath(state) {
  const returnTo = state?.returnTo
  if (typeof returnTo !== 'string' || !returnTo.startsWith('/') || returnTo.startsWith('//')) return ''
  return returnTo
}

export default function PlatformTerms() {
  const returnTo = returnPath(useLocation().state)

  return (
    <AuthShell backTo={returnTo || '/'} backLabel={returnTo ? 'Volver' : 'Inicio'} contentWidth="narrow">
      <LegalDocument
        title="Términos y condiciones"
        version={PLATFORM_TERMS_VERSION}
        sections={PLATFORM_TERMS_SECTIONS}
      />
    </AuthShell>
  )
}
