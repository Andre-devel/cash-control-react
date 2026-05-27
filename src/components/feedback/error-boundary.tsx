import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

function DefaultFallback() {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-8 text-center"
    >
      <p className="text-sm font-medium text-destructive">Something went wrong.</p>
      <button
        type="button"
        className="text-sm underline text-muted-foreground hover:text-foreground"
        onClick={() => window.location.reload()}
      >
        Reload page
      </button>
    </div>
  )
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error.message, info.componentStack)
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback />
    }
    return this.props.children
  }
}
