import { test, expect } from '@playwright/test'

test.describe('smoke', () => {
  test('app loads and navigates between top-level routes', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Problems' })).toBeVisible()

    await page.getByRole('link', { name: 'Skills' }).click()
    await expect(page).toHaveURL(/#\/skills$/)

    await page.getByRole('link', { name: 'Achievements' }).click()
    await expect(page).toHaveURL(/#\/achievements$/)
    await expect(page.getByRole('heading', { name: /achievements/i })).toBeVisible()
  })

  test('page is cross-origin isolated (COOP/COEP) for SharedArrayBuffer', async ({ page }) => {
    await page.goto('/')
    // This is what makes the Pyodide SharedArrayBuffer hard-interrupt possible.
    const isolated = await page.evaluate(() => self.crossOriginIsolated)
    expect(isolated).toBe(true)
    const hasSAB = await page.evaluate(() => typeof SharedArrayBuffer !== 'undefined')
    expect(hasSAB).toBe(true)
  })
})
