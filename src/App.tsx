import { lazy, Suspense } from 'react'
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProblemListPage } from './routes/ProblemListPage'
import { CreateProblemPage } from './routes/CreateProblemPage'
import { SkillsPage } from './routes/SkillsPage'
import { AchievementsPage } from './routes/AchievementsPage'
import { Spinner } from './components/Spinner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useGamificationEffects } from './features/achievements/useAchievements'

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
      { path: 'achievements', element: <AchievementsPage /> },
      { path: 'new', element: <CreateProblemPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  useGamificationEffects()
  return <RouterProvider router={router} />
}
