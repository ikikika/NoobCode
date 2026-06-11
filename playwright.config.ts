import { defineConfig, devices } from '@playwright/test'

// E2E runs against the PRODUCTION preview build, not jsdom: that's the only place
// the real pipeline exists — Web Workers, the Pyodide WASM runtime, and the
// COOP/COEP headers that make the page `crossOriginIsolated` (required for the
// SharedArrayBuffer hard-interrupt). We build with BASE_PATH=/ so the app is
// served at the server root instead of the GitHub Pages /NoobCode/ sub-path.
const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  // Pyodide's first run downloads + initializes a multi-MB runtime, so tests are
  // generous and run serially to keep memory/CPU sane (especially in CI).
  timeout: 45_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    video: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `BASE_PATH=/ npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
