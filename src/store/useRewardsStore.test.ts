import { describe, it, expect, beforeEach } from 'vitest'
import {
  useRewardsStore,
  dailyAward,
  dateKey,
  isThemeUnlocked,
  CUSTOM_THEME_PRICE,
} from './useRewardsStore'

const NOW = new Date('2026-06-10T12:00:00').getTime()
const DAY = 86_400_000

function reset() {
  useRewardsStore.setState({
    coins: 0,
    ledger: [],
    lastDailyClaim: null,
    loginStreak: 0,
    unlockedThemes: ['cream'],
    rewardedSolves: {},
    achievementsEarnedAt: {},
    customThemeUnlocked: false,
    seeded: false,
  })
}

beforeEach(reset)

describe('dailyAward (pure)', () => {
  it('grants the base on a fresh first claim', () => {
    expect(dailyAward(null, 0, NOW)).toEqual({ granted: 5, newStreak: 1, key: dateKey(NOW) })
  })

  it('increases with a consecutive day and caps at 15', () => {
    expect(dailyAward(dateKey(NOW - DAY), 1, NOW)?.granted).toBe(7) // streak 2
    expect(dailyAward(dateKey(NOW - DAY), 10, NOW)?.granted).toBe(15) // capped
  })

  it('resets the streak after a missed day', () => {
    expect(dailyAward(dateKey(NOW - 3 * DAY), 5, NOW)).toMatchObject({ newStreak: 1, granted: 5 })
  })

  it('returns null when already claimed today', () => {
    expect(dailyAward(dateKey(NOW), 1, NOW)).toBeNull()
  })
})

describe('isThemeUnlocked', () => {
  it('treats cream as always free and respects ownership', () => {
    expect(isThemeUnlocked('cream', [], false)).toBe(true)
    expect(isThemeUnlocked('ocean', [], false)).toBe(false)
    expect(isThemeUnlocked('ocean', ['ocean'], false)).toBe(true)
    expect(isThemeUnlocked('custom', [], false)).toBe(false)
    expect(isThemeUnlocked('custom', [], true)).toBe(true)
  })
})

describe('rewards store actions', () => {
  it('claims the daily bonus once per day', () => {
    const granted = useRewardsStore.getState().claimDaily(NOW)
    expect(granted).toBe(5)
    expect(useRewardsStore.getState().coins).toBe(5)
    expect(useRewardsStore.getState().claimDaily(NOW)).toBe(0) // same day → nothing
    expect(useRewardsStore.getState().coins).toBe(5)
  })

  it('rewards a solve once, with the optimal bonus', () => {
    const first = useRewardsStore.getState().rewardSolve('two-sum', 'medium', true)
    expect(first).toBe(35) // 25 + 10 optimal
    expect(useRewardsStore.getState().rewardSolve('two-sum', 'medium', true)).toBe(0) // guard
    expect(useRewardsStore.getState().coins).toBe(35)
  })

  it('spend fails when short and succeeds when funded', () => {
    expect(useRewardsStore.getState().spend(50, 'x')).toBe(false)
    useRewardsStore.getState().award(100, 'grant')
    expect(useRewardsStore.getState().spend(50, 'x')).toBe(true)
    expect(useRewardsStore.getState().coins).toBe(50)
  })

  it('unlocks a theme by spending coins', () => {
    useRewardsStore.getState().award(100, 'grant')
    expect(useRewardsStore.getState().unlockTheme('ocean', 60)).toBe(true)
    expect(useRewardsStore.getState().unlockedThemes).toContain('ocean')
    expect(useRewardsStore.getState().coins).toBe(40)
    expect(useRewardsStore.getState().unlockTheme('grape', 120)).toBe(false) // too poor
  })

  it('unlocks the custom creator', () => {
    useRewardsStore.getState().award(CUSTOM_THEME_PRICE, 'grant')
    expect(useRewardsStore.getState().unlockCustomTheme()).toBe(true)
    expect(useRewardsStore.getState().customThemeUnlocked).toBe(true)
    expect(useRewardsStore.getState().coins).toBe(0)
  })

  it('pays achievement coins only once per id', () => {
    useRewardsStore.getState().syncAchievements([{ id: 'first', coins: 10 }], NOW)
    useRewardsStore.getState().syncAchievements([{ id: 'first', coins: 10 }], NOW) // dup
    expect(useRewardsStore.getState().coins).toBe(10)
    expect(useRewardsStore.getState().achievementsEarnedAt.first).toBe(NOW)
  })

  it('seeds the current theme as owned, once', () => {
    useRewardsStore.getState().ensureSeed('midnight')
    expect(useRewardsStore.getState().unlockedThemes).toEqual(
      expect.arrayContaining(['cream', 'midnight']),
    )
    useRewardsStore.getState().ensureSeed('grape') // already seeded → no-op
    expect(useRewardsStore.getState().unlockedThemes).not.toContain('grape')
  })
})
