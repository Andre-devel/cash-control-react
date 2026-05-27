import { ErrorBoundary } from '@/components/feedback/error-boundary'
import { OverviewSection } from '@/features/dashboard/components/overview-section'
import { CategoriesChartSection } from '@/features/dashboard/components/categories-chart-section'
import { MonthlyChartSection } from '@/features/dashboard/components/monthly-chart-section'
import { NetWorthChartSection } from '@/features/dashboard/components/net-worth-chart-section'
import { MonthComparisonSection } from '@/features/dashboard/components/month-comparison-section'
import { UpcomingBillsWidget } from '@/features/dashboard/components/upcoming-bills-widget'
import { UpcomingInvoicesWidget } from '@/features/dashboard/components/upcoming-invoices-widget'
import { LargestExpensesWidget } from '@/features/dashboard/components/largest-expenses-widget'
import { RecentTransactionsWidget } from '@/features/dashboard/components/recent-transactions-widget'

function SectionErrorFallback({ label }: { label: string }) {
  return (
    <div
      role="alert"
      className="flex items-center justify-center rounded border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive"
    >
      {label} failed to load.
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <ErrorBoundary fallback={<SectionErrorFallback label="Overview" />}>
        <OverviewSection />
      </ErrorBoundary>

      <div className="grid gap-6 lg:grid-cols-2">
        <ErrorBoundary fallback={<SectionErrorFallback label="Monthly chart" />}>
          <MonthlyChartSection />
        </ErrorBoundary>

        <ErrorBoundary fallback={<SectionErrorFallback label="Categories chart" />}>
          <CategoriesChartSection />
        </ErrorBoundary>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ErrorBoundary fallback={<SectionErrorFallback label="Net worth chart" />}>
          <NetWorthChartSection />
        </ErrorBoundary>

        <ErrorBoundary fallback={<SectionErrorFallback label="Month comparison" />}>
          <MonthComparisonSection />
        </ErrorBoundary>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <ErrorBoundary fallback={<SectionErrorFallback label="Upcoming bills" />}>
          <UpcomingBillsWidget />
        </ErrorBoundary>

        <ErrorBoundary fallback={<SectionErrorFallback label="Upcoming invoices" />}>
          <UpcomingInvoicesWidget />
        </ErrorBoundary>

        <ErrorBoundary fallback={<SectionErrorFallback label="Largest expenses" />}>
          <LargestExpensesWidget />
        </ErrorBoundary>

        <ErrorBoundary fallback={<SectionErrorFallback label="Recent transactions" />}>
          <RecentTransactionsWidget />
        </ErrorBoundary>
      </div>
    </div>
  )
}
