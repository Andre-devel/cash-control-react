import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ErrorBoundary } from '../error-boundary'

// Suppress expected console.error output from error boundary
const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})
afterEach(() => {
  console.error = originalConsoleError
  cleanup()
})

function ThrowingComponent(): never {
  throw new Error('Test render error')
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <p>No error here</p>
      </ErrorBoundary>,
    )
    expect(screen.getByText('No error here')).toBeTruthy()
  })

  it('renders the default fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Algo deu errado' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeTruthy()
    expect(screen.getByRole('link', { name: /ir para o dashboard/i }).getAttribute('href')).toBe(
      '/dashboard',
    )
  })

  it('shows the correlation id carried by the thrown error', () => {
    function ThrowingApiError(): never {
      throw Object.assign(new Error('boom'), { correlationId: 'corr-9b2f-41ce' })
    }
    render(
      <ErrorBoundary>
        <ThrowingApiError />
      </ErrorBoundary>,
    )

    expect(screen.getByText(/corr-9b2f-41ce/)).toBeTruthy()
  })

  it('generates a reference code when the error has none', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('button', { name: /copiar código de correlação/i })).toBeTruthy()
  })

  it('renders a custom fallback when provided and a child throws', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowingComponent />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Custom error UI')).toBeTruthy()
    expect(screen.queryByText('Algo deu errado')).toBeNull()
  })

  it('calls console.error via componentDidCatch when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    )

    expect(console.error).toHaveBeenCalled()
  })

  it('does not render the fallback when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    )

    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText('All good')).toBeTruthy()
  })
})
