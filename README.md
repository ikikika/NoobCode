# NoobCode

A client-side, LeetCode-style learning platform. Everything runs in the
browser — no backend, no server — so it deploys to static hosting like GitHub
Pages. Solve problems in Python (via Pyodide), JavaScript, or TypeScript, get a
deterministic review of your approach, and track mastery with spaced repetition.

## Features

- **In-browser code execution** — Python runs on Pyodide (self-hosted WASM,
  loaded lazily); JavaScript runs in a worker; TypeScript is transpiled to JS
  (via sucrase) and runs through the same worker. All execute in Web Workers with
  a timeout watchdog and a Stop button.
- **JSON-defined problems** — every problem is a plain JSON file in
  `src/content/problems/`, auto-discovered at build time. Add your own by
  dropping a file in that directory (see below).
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

Requires **Node 22.12+** (Vite 8). The repo pins this via `.nvmrc` and
`package.json` `engines`, so `nvm use` picks the right version. On an older Node
(e.g. 22.6), `npm run dev` fails with a rolldown "Cannot find native binding"
error — fix it with:

```bash
nvm install 22.12 && nvm use
rm -rf node_modules package-lock.json && npm install
```

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

Problems are JSON files in `src/content/problems/<slug>.json`, auto-discovered via
`import.meta.glob` — no registration step. Each problem must provide code for
every language (Python, JavaScript, TypeScript) in `functionName`, `starterCode`,
and every solution step.

1. Create the file. Any of:
   - Copy [`templates/problem.template.json`](templates/problem.template.json) to
     `src/content/problems/<slug>.json`, or
   - run `npm run new:problem -- <slug> "Title"`, or
   - open **New** in the app — during `npm run dev` it writes the skeleton file
     for you; on the hosted site it downloads it to drop in.
2. Fill it in. Set `slug` to match the filename.
3. `npm run validate:content` checks it against the schema; restart `npm run dev`.

See **[docs/PROBLEM_JSON.md](docs/PROBLEM_JSON.md)** for the full field reference
and **[docs/SOLUTION_INSTRUCTIONS.md](docs/SOLUTION_INSTRUCTIONS.md)** for how to
break a solution into incremental steps.
