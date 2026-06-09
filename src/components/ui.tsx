import type { CSSProperties, ReactNode } from 'react'
import { MASTERY_LABELS, type MasteryLevel } from '../features/skills/mastery'

export function Kicker({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <span className={`nc-kicker ${className}`.trim()} style={style}>
      {children}
    </span>
  )
}

export function Bar({ value, max, thin }: { value: number; max: number; thin?: boolean }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className={thin ? 'nc-bar thin' : 'nc-bar'}>
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Check({ on }: { on: boolean }) {
  if (on) return <span className="nc-check">✓</span>
  return <span aria-hidden style={{ display: 'inline-block', width: 13 }} />
}

export function MasteryDot({ level }: { level: MasteryLevel }) {
  return <span className={`nc-dot ${level}`} />
}

export function MasteryChip({ level }: { level: MasteryLevel }) {
  return <span className={`nc-chip ${level}`}>{MASTERY_LABELS[level]}</span>
}

export function Ring({ pct, size = 120 }: { pct: number; size?: number }) {
  const r = (size - 12) / 2
  const c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-surface-sunken)"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="nc-serif" style={{ fontSize: 28, fontWeight: 500, lineHeight: 1 }}>
          {pct}%
        </span>
        <span style={{ fontSize: 10.5, color: 'var(--color-fg-subtle)', marginTop: 3 }}>solved</span>
      </div>
    </div>
  )
}
