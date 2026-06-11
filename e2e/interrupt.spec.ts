import { test, expect } from '@playwright/test'
import { seed, openProblem, SOLUTIONS } from './helpers'

// The standout test: an infinite Python loop is killed mid-execution by the
// SharedArrayBuffer cooperative interrupt (the Stop button), not the 10s
// watchdog — proving the hard-interrupt actually works in a real browser.
test('Stop interrupts a runaway Python loop via SharedArrayBuffer', async ({ page }) => {
  await seed(page, { savedCode: { 'two-sum:python': SOLUTIONS.infiniteLoopPython } })
  await openProblem(page, 'two-sum')

  await page.getByRole('button', { name: 'Run All' }).click()

  // Wait until Pyodide has loaded and the loop is actually executing.
  await expect(page.getByText('Running tests…')).toBeVisible({ timeout: 90_000 })

  // Stop it immediately — well within the 10s watchdog window.
  await page.getByRole('button', { name: 'Stop' }).click()

  // Control returns (cooperative interrupt), and it was NOT the timeout fallback.
  await expect(page.getByRole('button', { name: 'Run All' })).toBeVisible({ timeout: 9_000 })
  await expect(page.getByText('Execution timed out')).toHaveCount(0)

  // The worker stayed warm: a normal solve still runs afterward.
  await page.evaluate((code) => {
    const raw = localStorage.getItem('noobcode-progress')
    const blob = raw ? JSON.parse(raw) : { state: {}, version: 4 }
    blob.state.savedCode = { ...(blob.state.savedCode ?? {}), 'two-sum:python': code }
    localStorage.setItem('noobcode-progress', JSON.stringify(blob))
  }, SOLUTIONS.twoSumPython)
  await page.reload()
  await page.getByRole('button', { name: 'Run All' }).click()
  await expect(page.getByTestId('results-banner')).toContainText('All tests passed', { timeout: 90_000 })
})
