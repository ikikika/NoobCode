import { test, expect } from '@playwright/test'
import { seed, openProblem, SOLUTIONS } from './helpers'

test('solves a JavaScript problem in the JS worker', async ({ page }) => {
  await seed(page, { savedCode: { 'two-sum:javascript': SOLUTIONS.twoSumJs } })
  await openProblem(page, 'two-sum')

  await page.getByRole('button', { name: 'JavaScript' }).click()
  await page.getByRole('button', { name: 'Run All' }).click()
  await expect(page.getByTestId('results-banner')).toContainText('All tests passed')
})

test('solves a TypeScript problem (sucrase transpile path)', async ({ page }) => {
  await seed(page, { savedCode: { 'two-sum:typescript': SOLUTIONS.twoSumTs } })
  await openProblem(page, 'two-sum')

  await page.getByRole('button', { name: 'TypeScript' }).click()
  await page.getByRole('button', { name: 'Run All' }).click()
  await expect(page.getByTestId('results-banner')).toContainText('All tests passed')
})

test('typing a solution into the Monaco editor runs and passes', async ({ page }) => {
  // Paste (not type) so Monaco's bracket auto-closing doesn't mangle the source.
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await openProblem(page, 'two-sum')
  await page.getByRole('button', { name: 'JavaScript' }).click()

  const editor = page.locator('.monaco-editor').first()
  await editor.click()
  await page.keyboard.press('ControlOrMeta+A')
  await page.evaluate((code) => navigator.clipboard.writeText(code), SOLUTIONS.twoSumJs)
  await page.keyboard.press('ControlOrMeta+V')

  await page.getByRole('button', { name: 'Run All' }).click()
  await expect(page.getByTestId('results-banner')).toContainText('All tests passed')
})
