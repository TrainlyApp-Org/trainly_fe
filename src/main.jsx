import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const standaloneMedia = window.matchMedia('(display-mode: standalone)')
const isStandalone = standaloneMedia.matches || window.navigator.standalone === true
document.documentElement.classList.toggle('is-standalone', isStandalone)

const syncStandaloneViewportHeight = () => {
  if (!isStandalone) return

  const isPortrait = window.matchMedia('(orientation: portrait)').matches
  const physicalScreenHeight = isPortrait
    ? Math.max(window.screen.width, window.screen.height)
    : Math.min(window.screen.width, window.screen.height)

  const standaloneHeight = Math.max(physicalScreenHeight, window.innerHeight)
  document.documentElement.style.setProperty('--standalone-viewport-height', `${standaloneHeight}px`)
}

syncStandaloneViewportHeight()
window.addEventListener('orientationchange', syncStandaloneViewportHeight)
window.visualViewport?.addEventListener('resize', syncStandaloneViewportHeight)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.error('Service worker registration failed:', error)
    })
  })
}
