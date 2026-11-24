import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/great-vibes/latin-400.css'
import './index.css'
import App from './App.jsx'
import { ensureBackgroundUploads } from './products/utils/backgroundUpload.js'
import { startSyncManager } from './syncManager'
import { LiveLocationProvider } from './live/context/LiveLocationContext.jsx'

ensureBackgroundUploads()
startSyncManager()

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('No se encontró el elemento #root.')
}

if (rootEl.querySelector('.seo-prerender, .seo-store-page')) {
  rootEl.replaceChildren()
}

createRoot(rootEl).render(
  <StrictMode>
    <LiveLocationProvider>
      <App />
    </LiveLocationProvider>
  </StrictMode>,
)
