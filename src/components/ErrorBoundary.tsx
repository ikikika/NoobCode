import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Optional custom fallback; defaults to the standard error screen. */
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render-time errors anywhere below it (including lazy chunk-load
 * failures) and shows a recoverable fallback instead of a blank screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface in the console for debugging; no external telemetry by design.
    console.error('Unhandled error:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <div>
          <h1 className="text-lg font-semibold text-fg">Something went wrong</h1>
          <p className="mt-1 text-sm text-fg-muted">
            An unexpected error occurred. Reloading usually fixes it.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-contrast hover:bg-accent-hover"
        >
          Reload
        </button>
        {import.meta.env.DEV && (
          <pre className="max-w-full overflow-auto rounded-md border border-line bg-surface-sunken p-3 text-left font-mono text-xs text-fail">
            {this.state.error.message}
          </pre>
        )}
      </div>
    )
  }
}
