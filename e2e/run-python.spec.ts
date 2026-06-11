import { test, expect } from './fixtures'
import { seed, openProblem, readCoins, runAllExpectPass, SOLUTIONS } from './helpers'

// The headline path: real Python runs on Pyodide (WASM) inside a Web Worker.
test('solves a Python problem end-to-end on Pyodide, awards coins, shows review', async ({
  page,
}) => {
  await seed(page, { savedCode: { 'two-sum:python': SOLUTIONS.twoSumPython }, lastLanguage: 'python' })
  await openProblem(page, 'two-sum')

  const before = await readCoins(page)

  // Pyodide cold-loads on first run; the helper allows generous time.
  await runAllExpectPass(page)

  // First solve pays coins…
  await expect.poll(() => readCoins(page)).toBeGreaterThan(before)

  // …and the deterministic review is produced.
  await page.getByRole('tab', { name: 'Review' }).click()
  await expect(page.getByText('Hash Map')).toBeVisible()
})
