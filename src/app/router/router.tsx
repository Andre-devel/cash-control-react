import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import type { RouteObject } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/auth-provider'
import { PublicLayout } from '@/app/layouts/public-layout'
import { AuthenticatedLayout } from '@/app/layouts/authenticated-layout'
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
const AccountsPage = lazy(() => import('@/features/accounts/pages/accounts-page'))
const AccountDetailPage = lazy(() => import('@/features/accounts/pages/account-detail-page'))
const TransactionsPage = lazy(() => import('@/features/transactions/pages/transactions-page'))
const TransactionDetailPage = lazy(
  () => import('@/features/transactions/pages/transaction-detail-page'),
)
const InstallmentsPage = lazy(() => import('@/features/installments/pages/installments-page'))
const RecurrencesPage = lazy(() => import('@/features/recurrences/pages/recurrences-page'))
const CategoriesPage = lazy(() => import('@/features/categories/pages/categories-page'))
const CardsPage = lazy(() => import('@/features/cards/pages/cards-page'))
const CardDetailPage = lazy(() => import('@/features/cards/pages/card-detail-page'))
const ProfilePage = lazy(() => import('@/features/profile/pages/profile-page'))

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
            element: <AuthenticatedLayout />,
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
                path: ROUTES.ACCOUNTS,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <AccountsPage />
                  </Suspense>
                ),
              },
              {
                path: ROUTES.ACCOUNT_DETAIL,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <AccountDetailPage />
                  </Suspense>
                ),
              },
              {
                path: ROUTES.TRANSACTIONS,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <TransactionsPage />
                  </Suspense>
                ),
              },
              {
                path: ROUTES.TRANSACTION_DETAIL,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <TransactionDetailPage />
                  </Suspense>
                ),
              },
              {
                path: ROUTES.INSTALLMENTS,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <InstallmentsPage />
                  </Suspense>
                ),
              },
              {
                path: ROUTES.RECURRENCES,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <RecurrencesPage />
                  </Suspense>
                ),
              },
              {
                path: ROUTES.CATEGORIES,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <CategoriesPage />
                  </Suspense>
                ),
              },
              {
                path: ROUTES.CARDS,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <CardsPage />
                  </Suspense>
                ),
              },
              {
                path: ROUTES.CARD_DETAIL,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <CardDetailPage />
                  </Suspense>
                ),
              },
              {
                path: ROUTES.PROFILE,
                element: (
                  <Suspense fallback={<PageLoader />}>
                    <ProfilePage />
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
