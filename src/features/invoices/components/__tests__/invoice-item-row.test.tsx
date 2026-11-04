import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { InvoiceItem } from '@/features/invoices/types'
import { InvoiceItemRow } from '../invoice-item-row'

afterEach(() => {
  cleanup()
})

const LONG = 'BARBEIROESTILOEMODAMASCULINA*PARCELADO'

describe('InvoiceItemRow', () => {
  it('truncates a long description in a shrinkable column, keeping the amount on the right', () => {
    const item = {
      id: 'item-1',
      description: LONG,
      imported: false,
      amount: '45.00',
      competenceDate: '2026-10-20',
      categoryId: null,
    } as InvoiceItem

    const { container } = render(<InvoiceItemRow item={item} categoryLabel="Cuidados pessoais" />)

    const description = screen.getByText(LONG)
    expect(description).toHaveClass('truncate')
    expect(description).toHaveAttribute('title', LONG)
    expect(description.parentElement).toHaveClass('min-w-0', 'flex-1')

    const row = container.firstElementChild as HTMLElement
    const amountColumn = row.lastElementChild as HTMLElement
    expect(amountColumn).toHaveClass('shrink-0', 'items-end', 'text-right')
    expect(amountColumn.textContent).toContain('45,00')
  })
})
