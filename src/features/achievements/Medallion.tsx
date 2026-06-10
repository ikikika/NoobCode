import { TIER, type DerivedAchievement } from './achievements'

// Concentric-circle medal. Tier colors are intentional fixed metallics (a gold
// medal reads as gold on any theme); locked/progress chrome uses --color tokens.

function Lock({ size, color }: { size: number; color: string }) {
  return (
    <span aria-hidden style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 0 }}>
      <span
        style={{
          width: size * 0.6,
          height: size * 0.42,
          borderTopLeftRadius: 999,
          borderTopRightRadius: 999,
          border: `${Math.max(1.4, size * 0.13)}px solid ${color}`,
          borderBottom: 'none',
          boxSizing: 'border-box',
        }}
      />
      <span style={{ width: size * 0.92, height: size * 0.6, borderRadius: 2, background: color }} />
    </span>
  )
}

export function Medallion({ a, size = 64 }: { a: DerivedAchievement; size?: number }) {
  const t = TIER[a.tier]
  const earned = a.state === 'earned'
  const progress = a.state === 'progress'
  const locked = a.state === 'locked'
  const ring = earned ? t.deep : 'var(--color-line)'
  const fill = earned ? t.fill : 'var(--color-surface-sunken)'
  const glyphColor = earned ? '#fffdf5' : 'var(--color-fg-subtle)'
  const pct = a.max > 0 ? Math.round((a.cur / a.max) * 100) : 0

  return (
    <div
      role="img"
      aria-label={`${a.name} — ${a.state}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        flex: '0 0 auto',
        background: fill,
        border: `${Math.max(2, size * 0.045)}px ${locked ? 'dashed' : 'solid'} ${ring}`,
        boxShadow: earned
          ? `inset 0 ${size * 0.03}px ${size * 0.06}px rgba(255,255,255,.35), 0 ${size * 0.04}px ${size * 0.12}px rgba(120,70,30,.22)`
          : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: locked ? 0.85 : 1,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: size * 0.13,
          borderRadius: '50%',
          border: `1px solid ${earned ? 'rgba(255,255,255,.4)' : 'var(--color-line-soft)'}`,
        }}
      />
      {locked ? (
        <Lock size={size * 0.34} color="var(--color-fg-subtle)" />
      ) : (
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontWeight: 600,
            color: glyphColor,
            fontSize: a.glyph.length >= 3 ? size * 0.26 : size * 0.34,
            letterSpacing: '-0.02em',
          }}
        >
          {a.glyph}
        </span>
      )}
      {progress && (
        <span
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: size * 0.34,
            height: size * 0.34,
            borderRadius: '50%',
            background: 'var(--color-surface-raised)',
            border: '1.5px solid var(--color-line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--mono)',
            fontSize: size * 0.13,
            fontWeight: 600,
            color: t.ink,
          }}
        >
          {pct}
        </span>
      )}
    </div>
  )
}
