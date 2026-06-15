import type { LanguageId } from '../../content/schema'
import { LANGUAGE_LABELS } from '../../content/schema'

const LANGUAGES: LanguageId[] = ['python', 'javascript', 'typescript']

interface LanguageSelectProps {
  value: LanguageId
  onChange: (language: LanguageId) => void
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as LanguageId)}
      aria-label="Language"
      className="rounded-md border border-line bg-surface px-2.5 py-1 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-accent"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {LANGUAGE_LABELS[lang]}
        </option>
      ))}
    </select>
  )
}
