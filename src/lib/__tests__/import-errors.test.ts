import { describe, it, expect } from 'vitest'
import { describeErrors } from '../import-errors'

describe('describeErrors', () => {
  it('returns undefined when there are no errors', () => {
    expect(describeErrors([])).toBeUndefined()
  })

  it('describes a single error with its line number', () => {
    expect(describeErrors([{ lineNumber: 60, message: 'Fatura já paga.' }])).toBe(
      'linha 60 (Fatura já paga.)',
    )
  })

  it('joins up to three errors without a trailing ellipsis', () => {
    const errors = [
      { lineNumber: 1, message: 'A' },
      { lineNumber: 2, message: 'B' },
      { lineNumber: 3, message: 'C' },
    ]
    expect(describeErrors(errors)).toBe('linha 1 (A); linha 2 (B); linha 3 (C)')
  })

  it('truncates beyond three errors with an ellipsis', () => {
    const errors = [
      { lineNumber: 1, message: 'A' },
      { lineNumber: 2, message: 'B' },
      { lineNumber: 3, message: 'C' },
      { lineNumber: 4, message: 'D' },
    ]
    expect(describeErrors(errors)).toBe('linha 1 (A); linha 2 (B); linha 3 (C)…')
  })
})
