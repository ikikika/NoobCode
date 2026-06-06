import type { LanguageId } from '../../../content/schema'
import { WorkerLanguageRunner } from '../WorkerLanguageRunner'

export class TsRunner extends WorkerLanguageRunner {
  language: LanguageId = 'typescript'

  protected createWorker(): Worker {
    return new Worker(new URL('./ts.worker.ts', import.meta.url), { type: 'module' })
  }
}
