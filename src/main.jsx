import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/libre-baskerville/latin-400.css'
import '@fontsource/libre-baskerville/latin-700.css'
import './index.css'
import App from './App.jsx'

document.querySelectorAll('.seo-store-page').forEach((node) => {
  node.remove()
})

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('No se encontró el elemento #root.')
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
