import type { LanguageId } from '../../../content/schema'
import { WorkerLanguageRunner } from '../WorkerLanguageRunner'

export class PythonRunner extends WorkerLanguageRunner {
  language: LanguageId = 'python'

  // Pyodide supports cooperative interruption via setInterruptBuffer.
  protected get supportsHardInterrupt(): boolean {
    return true
  }

  protected createWorker(): Worker {
    return new Worker(new URL('./python.worker.ts', import.meta.url), { type: 'module' })
  }
}
