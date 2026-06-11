import { useEffect, useMemo } from 'react'
import { useProgressStore } from '../../store/useProgressStore'
import { useRewardsStore } from '../../store/useRewardsStore'
import { useTheme } from '../../store/useTheme'
import { builtinMeta } from '../../content'
import { achievementCoins, deriveAchievements, type DerivedAchievement } from './achievements'

/** Derived achievement list for the Achievements page. */
export function useAchievements(): DerivedAchievement[] {
  const solved = useProgressStore((s) => s.solved)
  const attempts = useProgressStore((s) => s.attempts)
  const reviews = useProgressStore((s) => s.review)
  const earnedAt = useRewardsStore((s) => s.achievementsEarnedAt)
  return useMemo(
    () =>
      deriveAchievements({
        solved,
        attempts,
        reviews,
        problems: builtinMeta,
        earnedAt,
        now: Date.now(),
      }),
    [solved, attempts, reviews, earnedAt],
  )
}

/**
 * App-level gamification side effects: seed owned themes (grandfather the current
 * theme), grant the daily-login bonus once per day, and pay out coins for any
 * newly earned achievements. Mount once near the router root.
 */
export function useGamificationEffects(): void {
  const theme = useTheme((s) => s.theme)
  const solved = useProgressStore((s) => s.solved)
  const attempts = useProgressStore((s) => s.attempts)
  const reviews = useProgressStore((s) => s.review)

  // Seed + daily login, deliberately once on mount (empty deps). `theme` is read
  // for its value at mount only — re-running on theme change would re-seed owned
  // themes and re-attempt the daily claim on every theme switch. State is read
  // fresh via getState(), so a stale closure isn't a concern.
  useEffect(() => {
    const rewards = useRewardsStore.getState()
    rewards.ensureSeed(theme)
    rewards.claimDaily(Date.now())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Pay out coins for freshly earned achievements whenever progress changes.
  useEffect(() => {
    const earned = deriveAchievements({
      solved,
      attempts,
      reviews,
      problems: builtinMeta,
      earnedAt: useRewardsStore.getState().achievementsEarnedAt,
      now: Date.now(),
    })
      .filter((a) => a.state === 'earned')
      .map((a) => a.id)
    if (earned.length > 0) {
      useRewardsStore.getState().syncAchievements(achievementCoins(earned), Date.now())
    }
  }, [solved, attempts, reviews])
}
