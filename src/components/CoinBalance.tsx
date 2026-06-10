import { Link } from 'react-router-dom'
import { useRewardsStore } from '../store/useRewardsStore'

// Header coin balance; links to the Achievements page. The coin dot is a fixed
// gold so it reads as currency on every theme.
export function CoinBalance() {
  const coins = useRewardsStore((s) => s.coins)
  return (
    <Link
      to="/achievements"
      title="Coins — view achievements"
      aria-label={`${coins} coins`}
      className="flex h-[34px] items-center gap-1.5 rounded-[9px] border border-line bg-surface-raised px-2.5 text-sm font-medium text-fg transition-colors hover:border-accent"
    >
      <span
        aria-hidden
        className="inline-block h-3.5 w-3.5 rounded-full"
        style={{ background: '#c79a3d', boxShadow: 'inset 0 1px 1px rgba(255,255,255,.45)' }}
      />
      <span className="nc-mono tabular-nums">{coins}</span>
    </Link>
  )
}
