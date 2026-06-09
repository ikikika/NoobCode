/// <reference lib="webworker" />
import { runJsTests } from './harness'
import type { WorkerRequest } from '../workerProtocol'

function post(message: unknown) {
  ;(self as unknown as Worker).postMessage(message)
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data
  if (msg.type === 'init') {
    post({ type: 'ready', id: msg.id })
    return
  }
  // Guard: the analyze branch of the union has no `tests` field. JS analysis
  // runs on the main thread, so the worker only ever handles 'run' here.
  if (msg.type !== 'run') return

  try {
    const result = runJsTests(msg.userCode, msg.functionName, msg.tests, {
      kind: msg.kind,
      io: msg.io,
    })
    post({ type: 'result', id: msg.id, result })
  } catch (err) {
    post({ type: 'error', id: msg.id, message: err instanceof Error ? err.message : String(err) })
  }
}
