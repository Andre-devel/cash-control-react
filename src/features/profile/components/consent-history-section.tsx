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
      <div
        className="space-y-2"
        aria-busy="true"
        aria-label="Carregando histórico de consentimento"
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-10 rounded animate-pulse"
            style={{ background: 'var(--surface-3)' }}
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-sm" role="alert" style={{ color: 'var(--expense)' }}>
        Falha ao carregar histórico de consentimento.{' '}
        <button
          type="button"
          className="underline underline-offset-2"
          onClick={() => void refetch()}
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (!consents || consents.length === 0) {
    return <p className="text-sm text-dim">Nenhum registro de consentimento encontrado.</p>
  }

  return (
    <ul className="space-y-2" role="list" aria-label="Histórico de consentimento">
      {consents.map((record) => (
        <li
          key={record.id}
          className="flex items-center justify-between rounded px-3 py-2 text-sm"
          style={{ border: '1px solid var(--border)' }}
        >
          <span className="fw-500">{record.type}</span>
          <span className="text-dim">{formatDate(record.date)}</span>
          <span
            style={{ color: record.status === 'ACCEPTED' ? 'var(--income)' : 'var(--expense)' }}
          >
            {record.status}
          </span>
        </li>
      ))}
    </ul>
  )
}
