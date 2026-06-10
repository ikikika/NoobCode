import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Difficulty } from '../content/schema'

// ── Reward tuning ────────────────────────────────────────────────────────────
export const SOLVE_COINS: Record<Difficulty, number> = { easy: 10, medium: 25, hard: 50 }
export const OPTIMAL_BONUS = 10
export const DAILY_BASE = 5
export const DAILY_PER_STREAK = 2
export const DAILY_CAP = 15
export const CUSTOM_THEME_PRICE = 300
const LEDGER_LIMIT = 50

export interface LedgerEntry {
  ts: number
  delta: number
  reason: string
}

/** Local calendar day key (YYYY-MM-DD) used for once-per-day login rewards. */
export function dateKey(ts: number): string {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/**
 * Pure daily-login computation. Returns null when today is already claimed,
 * otherwise the coins to grant and the new consecutive-day streak.
 */
export function dailyAward(
  lastClaim: string | null,
  streak: number,
  now: number,
): { granted: number; newStreak: number; key: string } | null {
  const key = dateKey(now)
  if (lastClaim === key) return null
  const yesterday = dateKey(now - 86_400_000)
  const newStreak = lastClaim === yesterday ? streak + 1 : 1
  const granted = Math.min(DAILY_BASE + DAILY_PER_STREAK * (newStreak - 1), DAILY_CAP)
  return { granted, newStreak, key }
}

/** Whether a theme is owned. Cream is always free; custom has its own gate. */
export function isThemeUnlocked(
  id: string,
  unlockedThemes: string[],
  customThemeUnlocked: boolean,
): boolean {
  if (id === 'cream') return true
  if (id === 'custom') return customThemeUnlocked
  return unlockedThemes.includes(id)
}

interface RewardsState {
  coins: number
  ledger: LedgerEntry[]
  lastDailyClaim: string | null
  loginStreak: number
  unlockedThemes: string[]
  rewardedSolves: Record<string, true>
  achievementsEarnedAt: Record<string, number>
  customThemeUnlocked: boolean
  seeded: boolean

  award: (delta: number, reason: string) => void
  spend: (amount: number, reason: string) => boolean
  claimDaily: (now: number) => number
  rewardSolve: (slug: string, difficulty: Difficulty, isOptimal: boolean) => number
  unlockTheme: (id: string, price: number) => boolean
  unlockCustomTheme: () => boolean
  syncAchievements: (earned: { id: string; coins: number }[], now: number) => void
  ensureSeed: (currentThemeId: string) => void
}

function pushLedger(ledger: LedgerEntry[], entry: LedgerEntry): LedgerEntry[] {
  return [entry, ...ledger].slice(0, LEDGER_LIMIT)
}

export const useRewardsStore = create<RewardsState>()(
  persist(
    (set, get) => ({
      coins: 0,
      ledger: [],
      lastDailyClaim: null,
      loginStreak: 0,
      unlockedThemes: ['cream'],
      rewardedSolves: {},
      achievementsEarnedAt: {},
      customThemeUnlocked: false,
      seeded: false,

      award: (delta, reason) =>
        set((s) => ({
          coins: s.coins + delta,
          ledger: pushLedger(s.ledger, { ts: Date.now(), delta, reason }),
        })),

      spend: (amount, reason) => {
        if (amount <= 0) return true
        if (get().coins < amount) return false
        set((s) => ({
          coins: s.coins - amount,
          ledger: pushLedger(s.ledger, { ts: Date.now(), delta: -amount, reason }),
        }))
        return true
      },

      claimDaily: (now) => {
        const { lastDailyClaim, loginStreak } = get()
        const result = dailyAward(lastDailyClaim, loginStreak, now)
        if (!result) return 0
        set((s) => ({
          lastDailyClaim: result.key,
          loginStreak: result.newStreak,
          coins: s.coins + result.granted,
          ledger: pushLedger(s.ledger, {
            ts: now,
            delta: result.granted,
            reason: `daily login (day ${result.newStreak})`,
          }),
        }))
        return result.granted
      },

      rewardSolve: (slug, difficulty, isOptimal) => {
        if (get().rewardedSolves[slug]) return 0
        const coins = SOLVE_COINS[difficulty] + (isOptimal ? OPTIMAL_BONUS : 0)
        set((s) => ({
          rewardedSolves: { ...s.rewardedSolves, [slug]: true },
          coins: s.coins + coins,
          ledger: pushLedger(s.ledger, {
            ts: Date.now(),
            delta: coins,
            reason: `solved ${slug}${isOptimal ? ' (optimal)' : ''}`,
          }),
        }))
        return coins
      },

      unlockTheme: (id, price) => {
        const { unlockedThemes } = get()
        if (id === 'cream' || unlockedThemes.includes(id)) return true
        if (!get().spend(price, `theme: ${id}`)) return false
        set((s) => ({ unlockedThemes: [...s.unlockedThemes, id] }))
        return true
      },

      unlockCustomTheme: () => {
        if (get().customThemeUnlocked) return true
        if (!get().spend(CUSTOM_THEME_PRICE, 'theme creator')) return false
        set({ customThemeUnlocked: true })
        return true
      },

      syncAchievements: (earned, now) => {
        const earnedAt = get().achievementsEarnedAt
        const fresh = earned.filter((e) => !(e.id in earnedAt))
        if (fresh.length === 0) return
        set((s) => {
          const nextEarnedAt = { ...s.achievementsEarnedAt }
          let nextCoins = s.coins
          let ledger = s.ledger
          for (const e of fresh) {
            nextEarnedAt[e.id] = now
            nextCoins += e.coins
            ledger = pushLedger(ledger, { ts: now, delta: e.coins, reason: `achievement: ${e.id}` })
          }
          return { achievementsEarnedAt: nextEarnedAt, coins: nextCoins, ledger }
        })
      },

      ensureSeed: (currentThemeId) => {
        if (get().seeded) return
        const owned = new Set(['cream', ...get().unlockedThemes])
        if (currentThemeId && currentThemeId !== 'custom') owned.add(currentThemeId)
        set({ seeded: true, unlockedThemes: [...owned] })
      },
    }),
    { name: 'noobcode-rewards', version: 1 },
  ),
)
