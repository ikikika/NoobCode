import type { LanguageId } from '../../content/schema'
import { getRunner } from '../runner/runnerRegistry'
import { WorkerLanguageRunner } from '../runner/WorkerLanguageRunner'
import { analyzeJs } from './js/analyzeJs'
import { transpileTs } from '../runner/ts/transpileTs'
import type { CodeFeatures } from './types'

export async function analyzeCode(
  language: LanguageId,
  userCode: string,
  functionName: string,
): Promise<CodeFeatures> {
  if (language === 'javascript') {
    return analyzeJs(userCode, functionName)
  }

  // TypeScript: strip types, then reuse the JavaScript AST analyzer.
  if (language === 'typescript') {
    return analyzeJs(transpileTs(userCode), functionName)
  }

  // Python analysis runs inside the existing Pyodide worker, which should
  // already be initialized from the preceding run.
  const runner = getRunner('python')
  if (!(runner instanceof WorkerLanguageRunner)) {
    throw new Error('Python runner does not support analysis')
  }
  return runner.analyze(userCode, functionName)
}
