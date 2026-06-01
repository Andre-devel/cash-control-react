import { describe, it, expect } from 'vitest'
import { screens } from '../breakpoints'

describe('breakpoints', () => {
  it('defines sm at 640px', () => {
    expect(screens.sm).toBe('640px')
  })

  it('defines md at 768px — the single mobile/desktop boundary', () => {
    expect(screens.md).toBe('768px')
  })

  it('defines lg at 1024px', () => {
    expect(screens.lg).toBe('1024px')
  })

  it('defines xl at 1280px', () => {
    expect(screens.xl).toBe('1280px')
  })

  it('defines 2xl at 1536px', () => {
    expect(screens['2xl']).toBe('1536px')
  })

  it('has exactly five breakpoints', () => {
    expect(Object.keys(screens)).toHaveLength(5)
  })

  it('breakpoints are ordered ascending by pixel value', () => {
    const values = Object.values(screens).map((v) => parseInt(v, 10))
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })
})
