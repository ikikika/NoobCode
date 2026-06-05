import type { LanguageId } from '../../content/schema'
import type { LanguageRunner } from './LanguageRunner'
import { PythonRunner } from './python/PythonRunner'
import { JsRunner } from './js/JsRunner'

const runners = new Map<LanguageId, LanguageRunner>()

const factories: Record<LanguageId, () => LanguageRunner> = {
  python: () => new PythonRunner(),
  javascript: () => new JsRunner(),
}

export function getRunner(language: LanguageId): LanguageRunner {
  let runner = runners.get(language)
  if (!runner) {
    runner = factories[language]()
    runners.set(language, runner)
  }
  return runner
}
