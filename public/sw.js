/* NoobCode service worker — offline support + Pyodide caching.
 *
 * Strategies:
 *  - /pyodide/*  → cache-first (large, immutable WASM/stdlib; expensive to refetch)
 *  - /assets/*   → cache-first (content-hashed by Vite, so safe to cache forever)
 *  - navigations → network-first with cached-shell fallback (avoids stale HTML)
 */
const VERSION = 'v1'
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

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const hit = await cache.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res && res.ok) cache.put(request, res.clone())
  return res
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(request)
    if (res && res.ok) cache.put(request, res.clone())
    return res
  } catch (err) {
    const hit = (await cache.match(request)) || (await cache.match('./index.html'))
    if (hit) return hit
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
  }
})
