import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProblemListPage } from './routes/ProblemListPage'
import { ProblemDetailPage } from './routes/ProblemDetailPage'
import { SkillsPage } from './routes/SkillsPage'
import { monacoSetup } from './lib/monacoSetup'

// Define Monaco themes before any editor mounts.
monacoSetup()

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <ProblemListPage /> },
      { path: 'problems', element: <ProblemListPage /> },
      { path: 'problems/:slug', element: <ProblemDetailPage /> },
      { path: 'skills', element: <SkillsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
