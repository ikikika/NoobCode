/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const crossOriginIsolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [{ src: 'node_modules/pyodide/*', dest: 'pyodide', rename: { stripBase: 2 } }],
    }),
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
  },
})
