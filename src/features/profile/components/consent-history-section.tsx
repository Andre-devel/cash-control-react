import { CheckCircle2, CircleSlash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConsentHistory } from '@/features/profile/hooks/use-consent-history'

function formatDate(instant: string): string {
  return new Date(instant).toLocaleDateString('pt-BR', {
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
        className="flex flex-col gap-2 py-3"
        aria-busy="true"
        aria-label="Carregando histórico de consentimento"
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-11 animate-pulse rounded-md bg-surface-3 motion-reduce:animate-none"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-2 py-3" role="alert">
        <p className="text-body-sm text-overdue">Falha ao carregar histórico de consentimento.</p>
        <Button variant="ghost" size="sm" onClick={() => void refetch()}>
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (!consents || consents.length === 0) {
    return (
      <p className="py-4 text-body-sm text-fg-muted">
        Nenhum registro de consentimento encontrado.
      </p>
    )
  }

  return (
    <ul className="m-0 list-none p-0" role="list" aria-label="Histórico de consentimento">
      {consents.map((record) => (
        <li
          key={record.id}
          className="flex min-h-[60px] items-center gap-3 border-b border-border py-2 last:border-b-0"
        >
          <span aria-hidden="true" className={record.active ? 'text-paid' : 'text-canceled'}>
            {record.active ? <CheckCircle2 size={18} /> : <CircleSlash size={18} />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body-sm font-medium text-fg">
              Termos e privacidade · versão {record.consentVersion}
            </span>
            <span className="text-caption text-fg-muted">
              aceito em {formatDate(record.acceptedAt)}
              {record.revokedAt && <> · revogado em {formatDate(record.revokedAt)}</>}
            </span>
          </span>
          <span
            className={`text-caption font-semibold ${record.active ? 'text-paid' : 'text-canceled'}`}
          >
            {record.active ? 'Aceito' : 'Revogado'}
          </span>
        </li>
      ))}
    </ul>
  )
}
