import { useEffect, useRef, useState } from 'react'
import { AI_MODELS, useSettingsStore, type AiModelId } from '../store/useSettingsStore'
import { useTheme } from '../store/useTheme'
import { THEMES } from '../lib/themes'

export function SettingsMenu() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const aiEnabled = useSettingsStore((s) => s.aiEnabled)
  const apiKey = useSettingsStore((s) => s.apiKey)
  const model = useSettingsStore((s) => s.model)
  const setAiEnabled = useSettingsStore((s) => s.setAiEnabled)
  const setApiKey = useSettingsStore((s) => s.setApiKey)
  const setModel = useSettingsStore((s) => s.setModel)

  const theme = useTheme((s) => s.theme)
  const setTheme = useTheme((s) => s.setTheme)

  useEffect(() => {
    if (!open) return
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Settings"
        aria-expanded={open}
        className="nc-iconbtn"
        title="Settings"
      >
        ⚙
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-line bg-surface-raised p-4 shadow-xl">
          <h2 className="text-sm font-semibold text-fg">Theme</h2>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                aria-label={t.label}
                aria-pressed={theme === t.id}
                title={t.label}
                className={`flex flex-col items-center gap-1 rounded-md border p-1.5 transition-colors ${
                  theme === t.id
                    ? 'border-accent ring-1 ring-accent'
                    : 'border-line hover:border-accent'
                }`}
              >
                <span
                  className="relative h-7 w-full overflow-hidden rounded"
                  style={{ background: t.preview.surface }}
                >
                  <span
                    className="absolute bottom-1 left-1 h-3 w-3 rounded-full"
                    style={{ background: t.preview.accent }}
                  />
                  <span
                    className="absolute right-1 top-1 h-1.5 w-3 rounded-full"
                    style={{ background: t.preview.fg }}
                  />
                </span>
                <span className="text-[10px] leading-none text-fg-muted">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="my-4 h-px bg-line-soft" />

          <h2 className="text-sm font-semibold text-fg">AI coach (optional)</h2>
          <p className="mt-1 text-xs text-fg-muted">
            The deterministic review always runs. AI only rewrites the prose explanation — it never
            changes the verdict.
          </p>

          <label className="mt-3 flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
            />
            Enable AI prose
          </label>

          <label className="mt-3 block text-xs font-medium text-fg-muted">
            Anthropic API key
            <input
              type="password"
              value={apiKey}
              autoComplete="off"
              placeholder="sk-ant-…"
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1 text-sm text-fg"
            />
          </label>

          <label className="mt-3 block text-xs font-medium text-fg-muted">
            Model
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as AiModelId)}
              className="mt-1 w-full rounded-md border border-line bg-surface px-2 py-1 text-sm text-fg"
            >
              {AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <p className="mt-3 text-[11px] leading-snug text-fg-subtle">
            NoobCode is fully static — your key is stored in localStorage only and sent directly to
            Anthropic from your browser. Use a scoped key.
          </p>
        </div>
      )}
    </div>
  )
}
