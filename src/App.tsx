import { lazy, Suspense, useEffect } from 'react'
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProblemListPage } from './routes/ProblemListPage'
import { CreateProblemPage } from './routes/CreateProblemPage'
import { SkillsPage } from './routes/SkillsPage'
import { Spinner } from './components/Spinner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useRewardsStore } from './store/useRewardsStore'
import { useTheme } from './store/useTheme'

// The problem detail page pulls in Monaco — load it lazily so the list and
// skills pages stay small and Monaco only downloads when a problem is opened.
const ProblemDetailPage = lazy(() =>
  import('./routes/ProblemDetailPage').then((m) => ({ default: m.ProblemDetailPage })),
)

function DetailFallback() {
  return (
    <div className="flex h-full items-center justify-center gap-2 text-sm text-fg-muted">
      <Spinner size={18} /> Loading editor…
    </div>
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <ProblemListPage /> },
      { path: 'problems', element: <ProblemListPage /> },
      {
        path: 'problems/:slug',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<DetailFallback />}>
              <ProblemDetailPage />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      { path: 'skills', element: <SkillsPage /> },
      { path: 'new', element: <CreateProblemPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  const theme = useTheme((s) => s.theme)
  // Seed owned themes (grandfather the current theme) and grant the daily-login
  // bonus once per calendar day.
  useEffect(() => {
    const rewards = useRewardsStore.getState()
    rewards.ensureSeed(theme)
    rewards.claimDaily(Date.now())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <RouterProvider router={router} />
}
