import { useMemo } from 'react'
import { useAchievements } from '../features/achievements/useAchievements'
import { TIER, type DerivedAchievement } from '../features/achievements/achievements'
import { Medallion } from '../features/achievements/Medallion'

function formatDate(ts?: number): string {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function AchievementsPage() {
  const achievements = useAchievements()

  const { earned, ordered, points, featured } = useMemo(() => {
    const earned = achievements.filter((a) => a.state === 'earned')
    const progress = achievements.filter((a) => a.state === 'progress')
    const locked = achievements.filter((a) => a.state === 'locked')
    const points = earned.reduce((sum, a) => sum + TIER[a.tier].pts, 0)
    // Featured = most recently earned (by earnedAt; fall back to list order).
    const featured = [...earned].sort((a, b) => (a.earnedAt ?? 0) - (b.earnedAt ?? 0)).at(-1)
    return { earned, ordered: [...earned, ...progress, ...locked], points, featured }
  }, [achievements])

  return (
    <div className="mx-auto h-full max-w-3xl overflow-auto px-6 py-10 sm:px-10">
      <span className="nc-kicker">Milestones</span>
      <h1 className="nc-serif mt-3 text-4xl font-medium tracking-tight text-fg">Achievements</h1>
      <div className="nc-mono mt-3 text-xs uppercase tracking-wider text-fg-subtle">
        {earned.length} of {achievements.length} unlocked · {points} pts
      </div>

      {featured && (
        <div className="nc-card mt-8 mb-10 flex items-center gap-6 p-6">
          <Medallion a={featured} size={84} />
          <div className="min-w-0 flex-1">
            <span className="nc-kicker" style={{ color: 'var(--color-accent)' }}>
              Latest unlock
            </span>
            <div className="nc-serif mt-1 text-2xl font-medium text-fg">{featured.name}</div>
            <p className="mt-1 text-sm text-fg-muted">{featured.desc}</p>
          </div>
          <div className="hidden text-right sm:block">
            {featured.earnedAt && (
              <div className="nc-serif whitespace-nowrap text-lg font-medium text-fg">
                {formatDate(featured.earnedAt)}
              </div>
            )}
            <span className="nc-chip mt-1.5 inline-block">{TIER[featured.tier].label}</span>
          </div>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4">
        {ordered.map((a) => (
          <AchievementCell key={a.id} a={a} />
        ))}
      </div>
    </div>
  )
}

function AchievementCell({ a }: { a: DerivedAchievement }) {
  const locked = a.state === 'locked'
  return (
    <div
      className="flex flex-col items-center gap-2.5 text-center"
      style={{ opacity: locked ? 0.62 : 1 }}
    >
      <Medallion a={a} size={64} />
      <div>
        <div className={`text-sm font-semibold ${locked ? 'text-fg-muted' : 'text-fg'}`}>{a.name}</div>
        <div className="mt-1 text-xs leading-snug text-fg-subtle">
          {a.state === 'progress' ? `${a.cur} / ${a.max}` : a.desc}
        </div>
      </div>
    </div>
  )
}
