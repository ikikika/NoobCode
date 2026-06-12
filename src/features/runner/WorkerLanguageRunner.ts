import type { LanguageId } from '../../content/schema'
import type { CodeFeatures } from '../analysis/types'
import { canHardInterrupt } from '../../lib/crossOriginIsolated'
import type { LanguageRunner, RunOptions, RunResult } from './LanguageRunner'
import type { WorkerRequest, WorkerResponse } from './workerProtocol'

const DEFAULT_TIMEOUT_MS = 10_000
// Backstop for init: a worker that fails to load (bad chunk URL, COEP block,
// parse error) never posts `ready` and never throws on its own, which would hang
// the UI forever. This caps that wait. It must sit well above a cold Pyodide
// download, so it only trips on a genuinely stuck worker, not a slow runtime.
const INIT_TIMEOUT_MS = 60_000
const SIGINT = 2

export abstract class WorkerLanguageRunner implements LanguageRunner {
  abstract language: LanguageId

  private worker: Worker | null = null
  private nextId = 1
  private initPromise: Promise<void> | null = null
  private interruptBuffer: Uint8Array | null = null
  // Rejecters for every in-flight init/run/analyze. A worker `error` event
  // (failed to load/parse) fires on the Worker itself, not as a protocol
  // message, so without this the awaiting promises would hang. On failure we
  // reject them all and discard the worker so the next call recreates it.
  private readonly pending = new Set<(err: Error) => void>()

  /** Subclasses construct their concrete Worker here. */
  protected abstract createWorker(): Worker

  /**
   * Whether this runner can be interrupted cooperatively (Pyodide's
   * setInterruptBuffer). When true and the page is cross-origin isolated, a
   * Stop signals the worker instead of terminating it — keeping the runtime
   * warm. JS execution is synchronous in the worker and can't be interrupted
   * this way, so it leaves this false and falls back to terminate.
   */
  protected get supportsHardInterrupt(): boolean {
    return false
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      const worker = this.createWorker()
      // A module worker that fails to load (bad URL, COEP block, parse error)
      // surfaces here rather than as a protocol message. Reject everything
      // awaiting it with a real message instead of hanging.
      worker.onerror = (e) => {
        const detail = (e as ErrorEvent).message || 'worker error'
        this.failAll(new Error(`Worker failed to load or crashed: ${detail}`))
      }
      worker.onmessageerror = () => {
        this.failAll(new Error('Worker message could not be deserialized'))
      }
      this.worker = worker
      if (this.supportsHardInterrupt && canHardInterrupt) {
        this.interruptBuffer = new Uint8Array(new SharedArrayBuffer(1))
      }
    }
    return this.worker
  }

  /** Reject all in-flight operations and discard the worker so it's recreated. */
  private failAll(err: Error): void {
    const rejecters = [...this.pending]
    this.pending.clear()
    this.initPromise = null
    this.terminate()
    for (const reject of rejecters) reject(err)
  }

  private send(req: WorkerRequest): void {
    this.ensureWorker().postMessage(req)
  }

  async init(onProgress?: (msg: string) => void): Promise<void> {
    if (this.initPromise) return this.initPromise

    const worker = this.ensureWorker()
    const id = this.nextId++

    this.initPromise = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        cleanup()
        this.initPromise = null
        reject(new Error(`Worker init timed out after ${INIT_TIMEOUT_MS}ms`))
      }, INIT_TIMEOUT_MS)

      const cleanup = () => {
        clearTimeout(timer)
        this.pending.delete(reject)
        worker.removeEventListener('message', onMessage)
      }

      const onMessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data
        if (msg.id !== id) return
        if (msg.type === 'progress') {
          onProgress?.(msg.message)
        } else if (msg.type === 'ready') {
          cleanup()
          resolve()
        } else if (msg.type === 'error') {
          cleanup()
          this.initPromise = null
          reject(new Error(msg.message))
        }
      }
      // Registered so a worker `error`/`messageerror` event rejects this too.
      this.pending.add(reject)
      worker.addEventListener('message', onMessage)
      this.send({ type: 'init', id, interruptBuffer: this.interruptBuffer ?? undefined })
    })

    return this.initPromise
  }

  async run(opts: RunOptions): Promise<RunResult> {
    await this.init()
    const worker = this.ensureWorker()
    const id = this.nextId++
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS

    // Clear any stale interrupt signal from a previous run.
    if (this.interruptBuffer) Atomics.store(this.interruptBuffer, 0, 0)

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
        this.pending.delete(reject)
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
            resolve({
              ...msg.result,
              stdout: msg.result.stdout || stdout,
              stderr: msg.result.stderr || stderr,
            })
            break
          case 'error':
            cleanup()
            reject(new Error(msg.message))
            break
        }
      }

      this.pending.add(reject)
      worker.addEventListener('message', onMessage)
      this.send({
        type: 'run',
        id,
        userCode: opts.userCode,
        functionName: opts.functionName,
        tests: opts.tests,
        kind: opts.kind,
        io: opts.io,
      })
    })
  }

  async analyze(userCode: string, functionName: string): Promise<CodeFeatures> {
    await this.init()
    const worker = this.ensureWorker()
    const id = this.nextId++

    return new Promise<CodeFeatures>((resolve, reject) => {
      const cleanup = () => {
        this.pending.delete(reject)
        worker.removeEventListener('message', onMessage)
      }
      const onMessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data
        if (msg.id !== id) return
        if (msg.type === 'features') {
          cleanup()
          if (msg.features) resolve(msg.features)
          else reject(new Error(msg.error ?? 'Analysis failed'))
        } else if (msg.type === 'error') {
          cleanup()
          reject(new Error(msg.message))
        }
      }
      this.pending.add(reject)
      worker.addEventListener('message', onMessage)
      this.send({ type: 'analyze', id, userCode, functionName })
    })
  }

  interrupt(): void {
    // Cooperative path: raise KeyboardInterrupt in the running runtime and keep
    // the worker warm (avoids a full Pyodide re-init/re-download).
    if (this.interruptBuffer) {
      Atomics.store(this.interruptBuffer, 0, SIGINT)
      return
    }
    // Fallback: hard-kill the worker.
    this.terminate()
  }

  dispose(): void {
    this.terminate()
  }

  private terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.initPromise = null
      this.interruptBuffer = null
    }
  }
}
