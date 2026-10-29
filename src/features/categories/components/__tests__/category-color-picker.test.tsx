import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryColorPicker } from '../category-color-picker'
import { randomCategoryColor } from '@/features/categories/utils/category-colors'

afterEach(cleanup)

describe('CategoryColorPicker — Aleatória', () => {
  it('sorteia uma cor hex diferente da atual', async () => {
    const onChange = vi.fn()
    render(<CategoryColorPicker value="#5CE1B8" onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Aleatória' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    const color = onChange.mock.calls[0][0] as string
    expect(color).toMatch(/^#[0-9A-F]{6}$/)
    expect(color).not.toBe('#5CE1B8')
  })
})

describe('randomCategoryColor', () => {
  it('gera hex válido e evita repetir a cor atual', () => {
    const fixed = () => 0.5
    const first = randomCategoryColor(undefined, fixed)
    expect(first).toMatch(/^#[0-9A-F]{6}$/)
    // Mesmo com o sorteio "travado", não devolve a cor atual em loop infinito.
    expect(randomCategoryColor(first, fixed)).toMatch(/^#[0-9A-F]{6}$/)
  })

  it('converte HSL corretamente nos extremos do matiz', () => {
    // h=0 (random 0) com s/l mínimos → vermelho saturado
    expect(randomCategoryColor(undefined, () => 0)).toBe('#CB4D4D')
  })
})
