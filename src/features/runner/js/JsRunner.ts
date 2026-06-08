import type { LanguageId } from '../../../content/schema'
import { WorkerLanguageRunner } from '../WorkerLanguageRunner'

export class JsRunner extends WorkerLanguageRunner {
  language: LanguageId = 'javascript'

  protected createWorker(): Worker {
    return new Worker(new URL('./js.worker.ts', import.meta.url), { type: 'module' })
  }
}
