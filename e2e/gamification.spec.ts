import { test, expect } from './fixtures'
import { seed, readCoins } from './helpers'

test('buying a locked theme spends coins and applies it', async ({ page }) => {
  await seed(page, { coins: 500, unlockedThemes: ['cream'], theme: 'cream' })
  await page.goto('/')

  const before = await readCoins(page)

  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: /Ocean.*locked/i }).click()

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean')
  await expect.poll(() => readCoins(page)).toBe(before - 60)
})

test('custom theme creator edits a token, applies, and persists across reload', async ({ page }) => {
  await seed(page, { coins: 500, customThemeUnlocked: true, theme: 'cream' })
  await page.goto('/#/customize')

  // Editor is unlocked; change the accent token via its hex field.
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
