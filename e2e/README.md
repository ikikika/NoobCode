# End-to-end tests (Playwright)

These specs drive the **real** app in a headless browser — the only place the hard
parts actually exist: Web Workers, the Pyodide WASM runtime, and the COOP/COEP
cross-origin isolation that backs the `SharedArrayBuffer` interrupt. (Vitest runs
in jsdom, which has none of these.)

## Running

```bash
npm run test:e2e        # build + preview + run all specs (Chromium)
npm run test:e2e:ui     # interactive UI mode
npx playwright show-report
```

The Playwright config (`../playwright.config.ts`) starts its own web server:
`BASE_PATH=/ npm run build && npm run preview`. The preview server sends the
COOP/COEP headers (see `vite.config.ts`) and serves the self-hosted Pyodide
runtime, so the page is `crossOriginIsolated`. First Python run cold-loads Pyodide
(several MB), hence the generous per-test timeouts.

First time only: `npx playwright install --with-deps chromium`.

## What's covered

| Spec | Proves |
| --- | --- |
| `smoke` | App boots, routes work, and the page is `crossOriginIsolated` (SAB available). |
| `run-python` | Python solves end-to-end on Pyodide; coins are paid; the review renders. |
| `run-js-ts` | JS + TS run in their workers (incl. sucrase transpile) and a real Monaco edit → run. |
| `structured-io` | The tree I/O codec and the design (class) executor work in a real runtime. |
| `interrupt` | The `SharedArrayBuffer` Stop kills a runaway loop; the worker stays warm. |
| `gamification` | Buying a theme spends coins; the custom-theme creator applies + persists. |

Determinism: specs seed the persisted `localStorage` (progress / rewards / theme)
via `addInitScript` (see `helpers.ts`) instead of relying on flaky editor typing —
except one spec that pastes into Monaco on purpose to cover the editor path.
