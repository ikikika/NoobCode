/* NoobCode service worker — cross-origin isolation + offline caching.
 *
 * GitHub Pages can't serve the COOP/COEP response headers that Pyodide's
 * SharedArrayBuffer (hard-interrupt) requires. This worker injects them on every
 * response (the proven coi-serviceworker technique), which makes the page
 * `crossOriginIsolated` on a static host — while also caching:
 *  - /pyodide/*  → cache-first (large, immutable WASM/stdlib; expensive to refetch)
 *  - /assets/*   → cache-first (content-hashed by Vite, so safe to cache forever)
 *  - navigations → network-first with cached-shell fallback (avoids stale HTML)
 */
const VERSION = 'v3'
const SHELL_CACHE = `noobcode-shell-${VERSION}`
const ASSET_CACHE = `noobcode-assets-${VERSION}`
const PYODIDE_CACHE = 'noobcode-pyodide' // unversioned: pinned to a Pyodide release

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, ASSET_CACHE, PYODIDE_CACHE])
      const names = await caches.keys()
      await Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

// Re-emit a response with the cross-origin isolation headers added. COOP/COEP on
// the document enable `crossOriginIsolated`; CORP keeps same-origin subresources
// loadable under COEP: require-corp.
function withCoi(response) {
  if (!response || response.status === 0) return response // opaque — leave as-is
  const headers = new Headers(response.headers)
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  if (hit) return withCoi(hit)
  const res = await fetch(request)
  if (res && res.ok) cache.put(request, res.clone())
  return withCoi(res)
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(request)
    if (res && res.ok) cache.put(request, res.clone())
    return withCoi(res)
  } catch (err) {
    const hit = (await cache.match(request)) || (await cache.match('./index.html'))
    if (hit) return withCoi(hit)
    throw err
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.includes('/pyodide/')) {
    event.respondWith(cacheFirst(request, PYODIDE_CACHE))
    return
  }
  if (url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE))
    return
  }
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE))
    return
  }
  // Other same-origin GETs (favicon, manifest, etc.): pass through but still add
  // the isolation headers so nothing breaks COEP.
  event.respondWith(fetch(request).then(withCoi))
})
