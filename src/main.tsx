import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register the service worker (production only) for offline support and to
// cache the large Pyodide runtime across visits.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {
      // Registration failure is non-fatal — the app still works online.
    })
  })
} else if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  // A service worker left over from a previous production build/preview on this
  // origin would keep serving stale, cache-first /assets/* — which mismatches
  // the dev server's modules and blanks the screen. Remove any such SW and its
  // caches so `npm run dev` always loads fresh.
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {})
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {})
  }
}
