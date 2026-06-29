import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/libre-baskerville/latin-400.css'
import '@fontsource/libre-baskerville/latin-700.css'
import './index.css'
import App from './App.jsx'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('No se encontró el elemento #root.')
}

if (rootEl.querySelector('.seo-store-page')) {
  rootEl.replaceChildren()
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
