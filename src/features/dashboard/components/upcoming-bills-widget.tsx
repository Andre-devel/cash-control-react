import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useUpcomingBills } from '@/features/dashboard/hooks/use-upcoming-bills'

function fmt(amount: string): string {
  const n = parseFloat(amount)
  if (isNaN(n)) return amount
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date(new Date().toDateString())
}

function WidgetSkeleton() {
  return (
    <div className="space-y-2 animate-pulse" aria-busy="true" aria-label="Loading upcoming bills">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 rounded bg-muted" />
      ))}
    </div>
  )
}

export function UpcomingBillsWidget() {
  const [daysAhead, setDaysAhead] = useState(7)
  const { data, isLoading, isError, refetch } = useUpcomingBills(daysAhead)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Upcoming Bills</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="days-ahead" className="text-xs text-muted-foreground">
              Days ahead:
            </label>
            <select
              id="days-ahead"
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
              className="rounded border border-input bg-background px-2 py-1 text-xs"
              aria-label="Days ahead"
            >
              {[7, 14, 30].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <WidgetSkeleton />
        ) : isError ? (
          <div role="alert" className="space-y-2">
            <p className="text-sm text-destructive">Failed to load upcoming bills.</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        ) : !data || data.bills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming bills in the next {daysAhead} days.
          </p>
        ) : (
          <ul className="divide-y" role="list">
            {data.bills.map((bill) => {
              const overdue = isOverdue(bill.dueDate)
              return (
                <li
                  key={bill.id}
                  className={`flex items-center justify-between py-2 text-sm ${
                    overdue ? 'text-destructive' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{bill.description}</p>
                    <p
                      className={`text-xs ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}
                    >
                      Due: {new Date(bill.dueDate).toLocaleDateString()}
                      {overdue && ' — Overdue'}
                    </p>
                  </div>
                  <span className="font-mono font-semibold ml-4">{fmt(bill.amount)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
