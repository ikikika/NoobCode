import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
// Self-hosted fonts (offline + COEP-safe). Editorial serif, UI sans, code mono.
import '@fontsource/newsreader/400.css'
import '@fontsource/newsreader/500.css'
import '@fontsource/newsreader/600.css'
import '@fontsource/hanken-grotesk/400.css'
import '@fontsource/hanken-grotesk/500.css'
import '@fontsource/hanken-grotesk/600.css'
import '@fontsource/hanken-grotesk/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Register the service worker (production only) for offline support, to cache the
// large Pyodide runtime, and to inject the COOP/COEP headers that make the page
// cross-origin isolated on GitHub Pages (which can't serve headers itself).
//
// Skip registration when the page is ALREADY cross-origin isolated: that means
// the host (e.g. the Vite preview server used by the E2E suite) serves COOP/COEP
// itself, so the worker is unnecessary — and registering it would let its
// `activate` → clients.claim() take over an already-loaded page mid-session and
// race the execution Web Workers' chunk fetches. On GitHub Pages the first load
// is NOT isolated, so this still registers, reloads, and becomes isolated; later
// loads are isolated by the now-active worker, where re-registration is a no-op.
if (import.meta.env.PROD && 'serviceWorker' in navigator && !window.crossOriginIsolated) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js')
      .then(() => {
        // The first load isn't controlled by the worker yet, so the document
        // lacks the isolation headers. Reload once (guarded) so the now-active
        // worker can serve them and SharedArrayBuffer/Pyodide work.
        if (!window.crossOriginIsolated && !sessionStorage.getItem('coiReloaded')) {
          sessionStorage.setItem('coiReloaded', '1')
          if (navigator.serviceWorker.controller) {
            window.location.reload()
          } else {
            navigator.serviceWorker.addEventListener(
              'controllerchange',
              () => window.location.reload(),
              { once: true },
            )
          }
        }
      })
      .catch(() => {
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
