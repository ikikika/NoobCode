import type { LanguageId } from '../../content/schema'
import { LANGUAGE_LABELS } from '../../content/schema'

const LANGUAGES: LanguageId[] = ['python', 'javascript']

interface LanguageSelectProps {
  value: LanguageId
  onChange: (language: LanguageId) => void
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  return (
    <div className="inline-flex rounded-md border border-line p-0.5">
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          onClick={() => onChange(lang)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            value === lang ? 'bg-accent text-accent-contrast' : 'text-fg-muted hover:text-fg'
          }`}
        >
          {LANGUAGE_LABELS[lang]}
        </button>
      ))}
    </div>
  )
}
