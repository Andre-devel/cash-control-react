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
    expect(screen.getByText('Something went wrong.')).toBeTruthy()
    expect(screen.getByRole('button', { name: /reload page/i })).toBeTruthy()
  })

  it('renders a custom fallback when provided and a child throws', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowingComponent />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Custom error UI')).toBeTruthy()
    expect(screen.queryByText('Something went wrong.')).toBeNull()
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
