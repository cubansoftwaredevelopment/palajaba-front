import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/libre-baskerville/latin-400.css'
import '@fontsource/libre-baskerville/latin-700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
