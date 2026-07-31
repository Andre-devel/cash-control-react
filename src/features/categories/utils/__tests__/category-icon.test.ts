import { describe, it, expect } from 'vitest'
import { resolveCategoryIcon } from '../category-icon'

const FALLBACK = resolveCategoryIcon('').icon

describe('resolveCategoryIcon', () => {
  it('maps Material Symbols names from the seed to distinct components', () => {
    const home = resolveCategoryIcon('home')
    const groceries = resolveCategoryIcon('local_grocery_store')

    expect(home.icon).toBeTruthy()
    expect(home.glyph).toBeUndefined()
    expect(groceries.icon).toBeTruthy()
    expect(groceries.icon).not.toBe(home.icon)
    expect(home.icon).not.toBe(FALLBACK)
  })

  it('keeps emoji written by the icon picker as a glyph', () => {
    expect(resolveCategoryIcon('🛒')).toEqual({ glyph: '🛒' })
  })

  it('falls back to a component for unknown symbol names, never raw text', () => {
    const resolved = resolveCategoryIcon('some_unmapped_symbol')
    expect(resolved.icon).toBe(FALLBACK)
    expect(resolved.glyph).toBeUndefined()
  })

  it('falls back to a component for empty or missing values', () => {
    expect(FALLBACK).toBeTruthy()
    expect(resolveCategoryIcon(null).icon).toBe(FALLBACK)
    expect(resolveCategoryIcon(undefined).icon).toBe(FALLBACK)
  })
})
