import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })
}

interface RenderOptions {
  initialRoute?: string
}

export function renderWithProviders(
  ui: ReactElement,
  { initialRoute = '/test' }: RenderOptions = {},
) {
  const testQueryClient = createTestQueryClient()

  const router = createMemoryRouter(
    [
      { path: '/test', element: ui },
      {
        path: '/dashboard',
        element: (
          <div>
            <h1>Dashboard</h1>
          </div>
        ),
      },
      {
        path: '/login',
        element: (
          <div>
            <h1>Login</h1>
          </div>
        ),
      },
      {
        path: '/register',
        element: (
          <div>
            <h1>Register</h1>
          </div>
        ),
      },
      {
        path: '/forbidden',
        element: (
          <div>
            <h1>Forbidden</h1>
          </div>
        ),
      },
      {
        path: '/verify-email',
        element: (
          <div>
            <h1>Verify Email</h1>
          </div>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <div>
            <h1>Forgot Password</h1>
          </div>
        ),
      },
      {
        path: '/reset-password',
        element: (
          <div>
            <h1>Reset Password</h1>
          </div>
        ),
      },
    ],
    { initialEntries: [initialRoute] },
  )

  const result = render(
    <QueryClientProvider client={testQueryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return { ...result, queryClient: testQueryClient, router }
}
