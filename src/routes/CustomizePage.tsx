import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../store/useTheme'
import {
  TOKEN_GROUPS,
  applyCustomColors,
  clearCustomColors,
  normalizeHex,
  readActiveColors,
  readCustomTheme,
  saveCustomTheme,
  type CustomColors,
} from '../features/theme/customTheme'

export function CustomizePage() {
  return <Editor />
}

function Editor() {
  const setTheme = useTheme((s) => s.setTheme)
  const [colors, setColors] = useState<CustomColors>(() => readCustomTheme() ?? readActiveColors())
  // Snapshot the theme as it was on entry, to restore on cancel/unmount.
  const baseSnapshot = useRef<CustomColors>(readActiveColors())
  const navigate = useNavigate()

  // Live-preview the working palette while editing.
  useEffect(() => {
    applyCustomColors(colors)
  }, [colors])

  // On leave, restore the actually-active theme (saved custom, or the preset).
  useEffect(() => {
    return () => {
      if (useTheme.getState().theme === 'custom') {
        const saved = readCustomTheme()
        if (saved) applyCustomColors(saved)
      } else {
        clearCustomColors()
      }
    }
  }, [])

  const update = (key: string, value: string) =>
    setColors((c) => ({ ...c, [key]: normalizeHex(value) }))

  const apply = () => {
    saveCustomTheme(colors)
    setTheme('custom')
    navigate('/')
  }

  const reset = () => setColors({ ...baseSnapshot.current })

  return (
    <div className="mx-auto h-full max-w-3xl overflow-auto px-6 py-10 sm:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="nc-kicker">Theme</span>
          <h1 className="nc-serif mt-2 text-3xl font-medium text-fg">Theme Creator</h1>
          <p className="mt-2 text-sm text-fg-muted">
            Changes preview live across the app. Apply to save it as your theme.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-fg-muted hover:border-accent hover:text-fg"
          >
            Reset
          </button>
          <button
            onClick={apply}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast"
          >
            Apply theme
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-7">
        {TOKEN_GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="nc-kicker mb-3 block">{group.title}</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {group.tokens.map((tok) => (
                <label key={tok.key} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-fg">{tok.label}</span>
                  <span className="flex items-center gap-2">
                    <input
                      type="text"
                      value={colors[tok.key] ?? ''}
                      onChange={(e) => update(tok.key, e.target.value)}
                      spellCheck={false}
                      aria-label={`${tok.label} hex`}
                      className="nc-mono w-20 rounded border border-line bg-surface px-2 py-1 text-xs text-fg"
                    />
                    <input
                      type="color"
                      value={colors[tok.key] ?? '#000000'}
                      onChange={(e) => update(tok.key, e.target.value)}
                      aria-label={tok.label}
                      className="h-8 w-10 cursor-pointer rounded border border-line bg-surface"
                    />
                  </span>
                </label>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
