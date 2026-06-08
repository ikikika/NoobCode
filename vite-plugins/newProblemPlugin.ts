/* Dev-server plugin: write a new problem skeleton to disk.
 *
 * Adds a POST /__new-problem endpoint that only exists while `vite dev` is
 * running (configureServer never runs for `build`/`preview`). It lets the in-app
 * "New problem" form actually create src/content/problems/<slug>.json on the
 * developer's machine, mirroring `npm run new:problem`. On the deployed static
 * site this endpoint is absent, so the form falls back to downloading the file.
 *
 * node:fs/node:path are used here only — this module is server-side and never
 * bundled into the client.
 */
import { existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import {
  buildProblemSkeleton,
  isValidSlug,
  problemFilePath,
  serializeProblem,
} from '../src/content/newProblem'
import type { Difficulty } from '../src/content/schema'

const ENDPOINT = '/__new-problem'
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > 1_000_000) reject(new Error('payload too large'))
    })
    req.on('end', () => resolveBody(data))
    req.on('error', reject)
  })
}

export function newProblemPlugin(): Plugin {
  return {
    name: 'noobcode-new-problem',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(ENDPOINT, (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }
        void (async () => {
          try {
            const raw = await readBody(req)
            const parsed = JSON.parse(raw || '{}') as {
              slug?: unknown
              title?: unknown
              difficulty?: unknown
            }

            const slug = typeof parsed.slug === 'string' ? parsed.slug : ''
            if (!isValidSlug(slug)) {
              send(res, 400, {
                error: 'Slug must be lowercase letters, digits, and hyphens only.',
              })
              return
            }

            const title = typeof parsed.title === 'string' ? parsed.title : undefined
            const difficulty =
              typeof parsed.difficulty === 'string' &&
              DIFFICULTIES.includes(parsed.difficulty as Difficulty)
                ? (parsed.difficulty as Difficulty)
                : undefined

            const relPath = problemFilePath(slug)
            const file = resolve(relPath)
            if (existsSync(file)) {
              send(res, 409, { error: `A problem already exists at ${relPath}.` })
              return
            }

            writeFileSync(file, serializeProblem(buildProblemSkeleton({ slug, title, difficulty })))
            send(res, 200, { path: relPath })
          } catch (err) {
            send(res, 500, { error: err instanceof Error ? err.message : 'Unknown error' })
          }
        })()
      })
    },
  }
}
