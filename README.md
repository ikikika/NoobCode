# NoobCode

A client-side, LeetCode-style learning platform. Everything runs in the
browser — no backend, no server — so it deploys to static hosting like GitHub
Pages. Solve problems in Python (via Pyodide) or JavaScript, get a deterministic
review of your approach, and track mastery with spaced repetition.

## Features

- **In-browser code execution** — Python runs on Pyodide (self-hosted WASM,
  loaded lazily); JavaScript runs in a worker. Both execute in Web Workers with
  a timeout watchdog and a Stop button.
- **Monaco editor** with custom `light` / `dark` themes and read-only diff views.
- **Deterministic analysis** — an AST/heuristic engine classifies your approach
  and estimates time/space complexity, then compares it to the optimal solution.
- **Optional AI coach (BYO key)** — if you add an Anthropic API key in Settings,
  the AI rewrites the deterministic review as friendly prose (streamed live, with
  token/cost shown) and can explain individual solution steps. The AI never
  changes the verdict — the heuristic is always the source of truth.
- **Spaced repetition** — a Leitner schedule surfaces problems when they are due.
- **Skills & mastery** — per-pattern mastery derived from recency-weighted attempts.
- **Attempt history** — past submissions are diffable against your current code.

## Development

Requires **Node 22.12+** (Vite 8).

```bash
npm install
npm run dev        # start the dev server (with COOP/COEP headers for Pyodide)
```

## Quality gates

```bash
npm run lint            # ESLint
npm run typecheck       # tsc --noEmit
npm run test            # Vitest unit tests
npm run validate:content # validate the problem content against the Zod schema
npm run build           # production build (tsc + vite build)
npm run preview         # serve the production build locally
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs every
quality gate above and publishes `dist/` to GitHub Pages.

Two things make the static deploy work:

- **Hash routing** (`createHashRouter`) — GitHub Pages can't do SPA rewrites, so
  deep links use the hash, e.g. `/#/problems/two-sum`.
- **Cross-origin isolation** — Pyodide needs `SharedArrayBuffer`, which requires
  the COOP/COEP headers. They're set for `dev`/`preview` in `vite.config.ts` and
  for static hosts via `public/_headers`.

## Privacy

NoobCode is fully static. Your progress lives in `localStorage`. If you enable
the AI coach, your API key is stored in `localStorage` only and sent directly
from your browser to Anthropic — use a scoped key.

## Adding a problem

1. Create `src/content/problems/<slug>/index.ts` exporting a `ProblemInput`
   (`satisfies ProblemInput`), with steps providing full code in both languages.
2. Register it in `src/content/index.ts` (`problemRegistry`, `problemsMeta`).
3. Run `npm run validate:content` to confirm it passes the schema and that
   `meta.patterns` matches the problem's `patterns`.
