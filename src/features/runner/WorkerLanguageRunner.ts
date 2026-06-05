import type { LanguageId } from '../../content/schema'
import type { CodeFeatures } from '../analysis/types'
import type { LanguageRunner, RunOptions, RunResult } from './LanguageRunner'
import type { WorkerRequest, WorkerResponse } from './workerProtocol'

const DEFAULT_TIMEOUT_MS = 10_000

export abstract class WorkerLanguageRunner implements LanguageRunner {
  abstract language: LanguageId

  private worker: Worker | null = null
  private nextId = 1
  private initPromise: Promise<void> | null = null

  /** Subclasses construct their concrete Worker here. */
  protected abstract createWorker(): Worker

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = this.createWorker()
    }
    return this.worker
  }

  private send(req: WorkerRequest): void {
    this.ensureWorker().postMessage(req)
  }

  async init(onProgress?: (msg: string) => void): Promise<void> {
    if (this.initPromise) return this.initPromise

    const worker = this.ensureWorker()
    const id = this.nextId++

    this.initPromise = new Promise<void>((resolve, reject) => {
      const onMessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data
        if (msg.id !== id) return
        if (msg.type === 'progress') {
          onProgress?.(msg.message)
        } else if (msg.type === 'ready') {
          worker.removeEventListener('message', onMessage)
          resolve()
        } else if (msg.type === 'error') {
          worker.removeEventListener('message', onMessage)
          this.initPromise = null
          reject(new Error(msg.message))
        }
      }
      worker.addEventListener('message', onMessage)
      this.send({ type: 'init', id })
    })

    return this.initPromise
  }

  async run(opts: RunOptions): Promise<RunResult> {
    await this.init()
    const worker = this.ensureWorker()
    const id = this.nextId++
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS

    let stdout = ''
    let stderr = ''

    return new Promise<RunResult>((resolve, reject) => {
      const watchdog = setTimeout(() => {
        cleanup()
        // Hard-stop the runaway worker and surface a timeout result.
        this.interrupt()
        resolve({
          passed: false,
          cases: [],
          stdout,
          stderr,
          durationMs: timeoutMs,
          timedOut: true,
          error: `Execution timed out after ${timeoutMs}ms`,
        })
      }, timeoutMs)

      const cleanup = () => {
        clearTimeout(watchdog)
        worker.removeEventListener('message', onMessage)
      }

      const onMessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data
        if (msg.id !== id) return
        switch (msg.type) {
          case 'stdout':
            stdout += msg.text
            break
          case 'stderr':
            stderr += msg.text
            break
          case 'result':
            cleanup()
            resolve({ ...msg.result, stdout: msg.result.stdout || stdout, stderr: msg.result.stderr || stderr })
            break
          case 'error':
            cleanup()
            reject(new Error(msg.message))
            break
        }
      }

      worker.addEventListener('message', onMessage)
      this.send({ type: 'run', id, userCode: opts.userCode, functionName: opts.functionName, tests: opts.tests })
    })
  }

  async analyze(userCode: string, functionName: string): Promise<CodeFeatures> {
    await this.init()
    const worker = this.ensureWorker()
    const id = this.nextId++

    return new Promise<CodeFeatures>((resolve, reject) => {
      const onMessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data
        if (msg.id !== id) return
        if (msg.type === 'features') {
          worker.removeEventListener('message', onMessage)
          if (msg.features) resolve(msg.features)
          else reject(new Error(msg.error ?? 'Analysis failed'))
        } else if (msg.type === 'error') {
          worker.removeEventListener('message', onMessage)
          reject(new Error(msg.message))
        }
      }
      worker.addEventListener('message', onMessage)
      this.send({ type: 'analyze', id, userCode, functionName })
    })
  }

  interrupt(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.initPromise = null
    }
  }

  dispose(): void {
    this.interrupt()
  }
}
