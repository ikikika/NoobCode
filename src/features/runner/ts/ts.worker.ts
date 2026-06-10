/// <reference lib="webworker" />
import { runJsTests } from '../js/harness'
import { transpileTs } from './transpileTs'
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
  // Guard: the analyze branch of the union has no `tests` field. TS analysis
  // runs on the main thread, so the worker only ever handles 'run' here.
  if (msg.type !== 'run') return

  try {
    // Strip types, then reuse the JavaScript harness verbatim.
    const js = transpileTs(msg.userCode)
    const result = runJsTests(js, msg.functionName, msg.tests, { kind: msg.kind, io: msg.io })
    post({ type: 'result', id: msg.id, result })
  } catch (err) {
    post({ type: 'error', id: msg.id, message: err instanceof Error ? err.message : String(err) })
  }
}
