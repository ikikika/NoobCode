import { test, expect } from '@playwright/test'
import { seed } from './helpers'

test('custom theme creator edits a token, applies, and persists across reload', async ({ page }) => {
  await seed(page, { theme: 'cream' })
  await page.goto('/#/customize')

  // The editor is open directly (no paywall); change the accent token via its hex field.
  const accentHex = page.getByLabel('Accent hex')
  await expect(accentHex).toBeVisible()
  await accentHex.fill('#ff0000')

  await page.getByRole('button', { name: 'Apply theme' }).click()

  // Applied as the 'custom' theme with the new accent.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'custom')
  const accent = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
  )
  expect(accent.toLowerCase()).toBe('#ff0000')

  // Persists across reload (FOUC script re-applies the saved palette).
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'custom')
  const persisted = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(),
  )
  expect(persisted.toLowerCase()).toBe('#ff0000')
})
