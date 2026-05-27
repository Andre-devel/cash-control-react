import { useConsentHistory } from '@/features/profile/hooks/use-consent-history'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function ConsentHistorySection() {
  const { data: consents, isLoading, isError, refetch } = useConsentHistory()

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading consent history">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive" role="alert">
        Failed to load consent history.{' '}
        <button
          type="button"
          className="underline underline-offset-2 hover:text-destructive/80"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!consents || consents.length === 0) {
    return <p className="text-sm text-muted-foreground">No consent records found.</p>
  }

  return (
    <ul className="space-y-2" role="list" aria-label="Consent history">
      {consents.map((record) => (
        <li
          key={record.id}
          className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
        >
          <span className="font-medium">{record.type}</span>
          <span className="text-muted-foreground">{formatDate(record.date)}</span>
          <span
            className={
              record.status === 'ACCEPTED'
                ? 'text-green-600 dark:text-green-400'
                : 'text-destructive'
            }
          >
            {record.status}
          </span>
        </li>
      ))}
    </ul>
  )
}
