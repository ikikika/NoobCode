// Render an arbitrary test value for display. `pretty` switches between compact
// (results table cells) and indented (scratch output) JSON.
export function formatValue(value: unknown, pretty = false): string {
  if (value === undefined) return 'undefined'
  try {
    return JSON.stringify(value, null, pretty ? 2 : undefined)
  } catch {
    return String(value)
  }
}
