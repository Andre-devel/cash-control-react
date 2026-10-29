import { Component, useState, type ErrorInfo, type ReactNode } from 'react'
import { Check, Copy, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/app/router/routes'
import { StatusPage } from './status-page'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  correlationId: string | null
}

/** Usa o correlationId do erro normalizado da API, se houver; senão gera uma referência local. */
function correlationIdOf(error: unknown): string {
  if (error && typeof error === 'object' && 'correlationId' in error) {
    const id = (error as { correlationId?: unknown }).correlationId
    if (typeof id === 'string' && id) return id
  }
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(16).slice(2)
}

function CorrelationCode({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(id)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Sem permissão de área de transferência: o código continua visível para copiar à mão.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={`Copiar código de correlação ${id}`}
      className="inline-flex min-h-touch max-w-full items-center gap-2 rounded-md border border-border bg-surface-1 px-3 font-mono text-caption text-fg-muted hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <span className="truncate">código: {id}</span>
      {copied ? (
        <Check size={14} className="flex-none text-paid" aria-hidden="true" />
      ) : (
        <Copy size={14} className="flex-none" aria-hidden="true" />
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? 'Copiado' : ''}
      </span>
    </button>
  )
}

function DefaultFallback({ correlationId }: { correlationId: string | null }) {
  return (
    <StatusPage
      role="alert"
      fullscreen
      code="500"
      icon={TriangleAlert}
      tone="overdue"
      title="Algo deu errado"
      description="Já registramos o problema. Se precisar de ajuda, envie o código abaixo para o suporte."
      extra={correlationId ? <CorrelationCode id={correlationId} /> : null}
      actions={
        <>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
          {/* <a> e não <Link>: o fallback pode estar fora do roteador e recarregar limpa o estado quebrado. */}
          <Button asChild variant="ghost" size="lg" className="w-full">
            <a href={ROUTES.DASHBOARD}>Ir para o dashboard</a>
          </Button>
        </>
      }
    />
  )
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, correlationId: null }
  }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, correlationId: correlationIdOf(error) }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(
      '[ErrorBoundary]',
      `correlationId=${this.state.correlationId ?? correlationIdOf(error)}`,
      error.message,
      info.componentStack,
    )
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback correlationId={this.state.correlationId} />
    }
    return this.props.children
  }
}
