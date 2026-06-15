/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import { newProblemPlugin } from './vite-plugins/newProblemPlugin'

const crossOriginIsolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

// GitHub Pages serves this project site under /<repo>/, so production assets
// must be built with that base. Dev/preview stay at root. Override with
// BASE_PATH (e.g. '/' for a custom domain or user-site deploy).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.BASE_PATH ?? '/NoobCode/') : '/',
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [{ src: 'node_modules/pyodide/*', dest: 'pyodide', rename: { stripBase: 2 } }],
    }),
    newProblemPlugin(),
  ],
  worker: { format: 'es' },
  // Monaco's editor.api core is a legitimately large, lazily-loaded chunk
  // (~3.6 MB). Set the limit just above it so the warning flags a genuine
  // regression rather than firing on this known dependency every build.
  build: { chunkSizeWarningLimit: 4000 },
  optimizeDeps: { exclude: ['pyodide'] },
  server: { headers: crossOriginIsolationHeaders },
  preview: { headers: crossOriginIsolationHeaders },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // E2E specs run under Playwright, not Vitest.
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov'],
      // Coverage targets the pure logic that the unit suite owns. UI shells,
      // editor/Monaco glue, workers, and entrypoints are exercised by the
      // Playwright E2E suite instead, so they're left out of the % to keep the
      // gate meaningful rather than diluted by untested view code.
      include: [
        'src/features/analysis/**/*.ts',
        'src/features/skills/mastery.ts',
        'src/features/review/schedule.ts',
        'src/features/review/aiReview.ts',
        'src/features/runner/io.ts',
        'src/lib/deepEqual.ts',
        'src/lib/themes.ts',
        'src/content/newProblem.ts',
        'src/content/schema.ts',
        'src/content/patterns.ts',
      ],
      exclude: ['**/*.test.{ts,tsx}', '**/*.worker.ts', 'e2e/**'],
      thresholds: { lines: 70, functions: 70, statements: 70, branches: 70 },
    },
  },
}))
