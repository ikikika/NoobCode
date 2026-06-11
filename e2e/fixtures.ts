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

// On failure, dump what the results panel actually shows (banner / error / the
// loading message) so the CI log reveals the end state instead of just a
// "results-banner not found" timeout.
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return
  try {
    const dump = await page.evaluate(() => {
      const main = (document.querySelector('main')?.innerText ?? '').replace(/\s+/g, ' ').trim()
      const root = document.documentElement
      return {
        url: location.hash,
        theme: root.dataset.theme ?? null,
        accent: getComputedStyle(root).getPropertyValue('--color-accent').trim(),
        banner: document.querySelector('[data-testid="results-banner"]')?.textContent ?? null,
        error: document.querySelector('[data-testid="results-error"]')?.textContent ?? null,
        spinner: !!document.querySelector('[role="status"][aria-label="Loading"]'),
        // The results region renders after the description, so the tail of main
        // captures the spinner text / idle message / banner.
        tail: main.slice(-500),
      }
    })
    console.log(`[panel-dump:${testInfo.title}] ${JSON.stringify(dump)}`)
  } catch (e) {
    console.log(`[panel-dump:${testInfo.title}] failed: ${String(e)}`)
  }
})

export { expect }
