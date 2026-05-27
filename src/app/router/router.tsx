import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/auth-provider'
import { PublicLayout } from '@/app/layouts/public-layout'
import { ProtectedLayout } from '@/app/layouts/protected-layout'
import { AuthGuard } from '@/app/router/guards/auth-guard'
import { RoleGuard } from '@/app/router/guards/role-guard'
import { PermissionGuard } from '@/app/router/guards/permission-guard'
import { ErrorBoundary } from '@/components/feedback/error-boundary'
import { ROUTES } from './routes'

const LoginPage = lazy(() => import('@/features/auth/pages/login-page'))
const RegisterPage = lazy(() => import('@/features/auth/pages/register-page'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page'))
const NotFoundPage = lazy(() => import('@/components/feedback/not-found-page'))
const ForbiddenPage = lazy(() => import('@/components/feedback/forbidden-page'))
const RolesPage = lazy(() => import('@/features/roles/pages/roles-page'))
const RoleDetailPage = lazy(() => import('@/features/roles/pages/role-detail-page'))

function PageLoader() {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export const routeConfig: RouteObject[] = [
  {
    element: (
      <ErrorBoundary>
        <AuthProvider />
      </ErrorBoundary>
    ),
    children: [
      {
        path: '/',
        element: <Navigate to={ROUTES.LOGIN} replace />,
      },
      {
        element: <PublicLayout />,
        children: [
          {
            path: ROUTES.LOGIN,
            element: (
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: ROUTES.REGISTER,
            element: (
              <Suspense fallback={<PageLoader />}>
                <RegisterPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: <AuthGuard />,
        children: [
          {
            element: <ProtectedLayout />,
            children: [
              {
                path: ROUTES.DASHBOARD,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <DashboardPage />
                  </Suspense>
                ),
              },
              {
                element: (
                  <PermissionGuard
                    requiredPermissions={['role:create', 'role:update', 'role:delete']}
                  />
                ),
                children: [
                  {
                    path: ROUTES.ROLES,
                    element: (
                      <Suspense fallback={<PageLoader />}>
                        <RolesPage />
                      </Suspense>
                    ),
                  },
                  {
                    path: ROUTES.ROLE_DETAIL,
                    element: (
                      <Suspense fallback={<PageLoader />}>
                        <RoleDetailPage />
                      </Suspense>
                    ),
                  },
                ],
              },
            ],
          },
          {
            path: ROUTES.FORBIDDEN,
            element: (
              <Suspense fallback={<PageLoader />}>
                <ForbiddenPage />
              </Suspense>
            ),
          },
          {
            element: <RoleGuard requiredRoles={['ADMIN']} />,
            children: [
              // Admin feature routes are added here when implemented
            ],
          },
        ],
      },
      {
        path: '*',
        element: (
          <Suspense fallback={<PageLoader />}>
            <NotFoundPage />
          </Suspense>
        ),
      },
    ],
  },
]

export const router = createBrowserRouter(routeConfig)
