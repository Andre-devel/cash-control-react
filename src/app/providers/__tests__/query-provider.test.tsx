import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryProvider, queryClient } from '../query-provider'

describe('QueryProvider', () => {
  it('renders children without errors', () => {
    render(
      <QueryProvider>
        <span data-testid="child">hello</span>
      </QueryProvider>,
    )
    expect(screen.getByTestId('child')).toBeTruthy()
  })

  it('exports a queryClient instance', () => {
    expect(queryClient).toBeDefined()
    expect(typeof queryClient.clear).toBe('function')
    expect(typeof queryClient.invalidateQueries).toBe('function')
  })

  it('queryClient has staleTime configured', () => {
    const defaults = queryClient.getDefaultOptions()
    expect(defaults.queries?.staleTime).toBeGreaterThan(0)
  })
})
