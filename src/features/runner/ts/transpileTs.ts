import { transform } from 'sucrase'

// Transpile TypeScript to runnable JavaScript by stripping type annotations.
// Sucrase does NOT type-check — it only erases types — which is exactly what we
// want for an execution runtime: the user's TS runs as JS.
export function transpileTs(code: string): string {
  return transform(code, { transforms: ['typescript'], disableESTransforms: true }).code
}
