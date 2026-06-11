import { test as base, expect } from '@playwright/test'

// Diagnostics fixture: pipe the browser's console errors/warnings, uncaught page
// errors, and Web Worker lifecycle to the Node stdout so CI logs reveal *why* an
// in-browser run failed (e.g. a worker that won't load, a COEP violation, a
// Pyodide error) instead of just a Playwright timeout. Import `test`/`expect`
// from here in specs that exercise the execution pipeline.
export const test = base.extend({
  page: async ({ page }, runTest) => {
    page.on('console', (m) => {
      const t = m.type()
      if (t === 'error' || t === 'warning') console.log(`[browser:${t}] ${m.text()}`)
    })
    page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`))
    page.on('worker', (w) => console.log(`[worker created] ${w.url()}`))
    page.on('requestfailed', (r) =>
      console.log(`[requestfailed] ${r.url()} — ${r.failure()?.errorText ?? 'unknown'}`),
    )
    await runTest(page)
  },
})

export { expect }
