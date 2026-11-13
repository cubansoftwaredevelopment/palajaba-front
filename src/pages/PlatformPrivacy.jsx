import { useLocation } from 'react-router-dom'
import AuthShell from '../auth/components/AuthShell'
import LegalDocument from '../components/LegalDocument'
import { PLATFORM_PRIVACY_SECTIONS, PLATFORM_PRIVACY_VERSION } from '../lib/platformPrivacy'

function returnPath(state) {
  const returnTo = state?.returnTo
  if (typeof returnTo !== 'string' || !returnTo.startsWith('/') || returnTo.startsWith('//')) return ''
  return returnTo
}

export default function PlatformPrivacy() {
  const returnTo = returnPath(useLocation().state)

  return (
    <AuthShell backTo={returnTo || '/'} backLabel={returnTo ? 'Volver' : 'Inicio'} contentWidth="narrow">
      <LegalDocument
        title="Política de privacidad"
        version={PLATFORM_PRIVACY_VERSION}
        sections={PLATFORM_PRIVACY_SECTIONS}
      />
    </AuthShell>
  )
}
