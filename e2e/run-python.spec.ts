import { test, expect } from '@playwright/test'
import { seed, openProblem, readCoins, SOLUTIONS } from './helpers'

// The headline path: real Python runs on Pyodide (WASM) inside a Web Worker.
test('solves a Python problem end-to-end on Pyodide, awards coins, shows review', async ({
  page,
}) => {
  await seed(page, { savedCode: { 'two-sum:python': SOLUTIONS.twoSumPython }, lastLanguage: 'python' })
  await openProblem(page, 'two-sum')

  const before = await readCoins(page)

  await page.getByRole('button', { name: 'Run All' }).click()

  // Pyodide cold-loads on first run, so allow generous time for the verdict.
  await expect(page.getByTestId('results-banner')).toContainText('All tests passed', { timeout: 90_000 })

  // First solve pays coins…
  await expect.poll(() => readCoins(page)).toBeGreaterThan(before)

  // …and the deterministic review is produced.
  await page.getByRole('tab', { name: 'Review' }).click()
  await expect(page.getByText('Hash Map')).toBeVisible()
})
