import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { OrphanItemsSection } from '../orphan-items-section'
import type { BankOrphanItem } from '@/features/bank-sync/types'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

const ORPHANS: BankOrphanItem[] = [
  { itemId: 'orphan-item-1', connectorName: 'MeuPluggy', firstSeenAt: '2026-11-03T14:00:00Z' },
  { itemId: 'orphan-item-2', connectorName: null, firstSeenAt: '2026-11-02T10:00:00Z' },
]

describe('OrphanItemsSection', () => {
  it('renders nothing when there are no orphan items', async () => {
    let requested = false
    server.use(
      http.get('*/admin/bank-sync/orphans', () => {
        requested = true
        return HttpResponse.json([])
      }),
    )
    const { container } = renderWithProviders(<OrphanItemsSection />)

    await waitFor(() => expect(requested).toBe(true))
    expect(container).toBeEmptyDOMElement()
  })

  it('lists the orphan items', async () => {
    server.use(http.get('*/admin/bank-sync/orphans', () => HttpResponse.json(ORPHANS)))
    renderWithProviders(<OrphanItemsSection />)

    expect(
      await screen.findByRole('heading', { name: 'Itens na Pluggy sem conexão no app' }),
    ).toBeInTheDocument()
    expect(screen.getByText('MeuPluggy')).toBeInTheDocument()
    expect(screen.getByText('Banco')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Apagar na Pluggy' })).toHaveLength(2)
  })

  it('sends the DELETE only after confirmation', async () => {
    let remaining = [...ORPHANS]
    let deleted: string | null = null
    server.use(
      http.get('*/admin/bank-sync/orphans', () => HttpResponse.json(remaining)),
      http.delete('*/admin/bank-sync/orphans/:itemId', ({ params }) => {
        deleted = params.itemId as string
        remaining = remaining.filter((item) => item.itemId !== deleted)
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<OrphanItemsSection />)

    const [first] = await screen.findAllByRole('button', { name: 'Apagar na Pluggy' })
    await user.click(first)
    expect(screen.getByRole('alertdialog', { name: 'Apagar item na Pluggy' })).toBeInTheDocument()
    expect(deleted).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Apagar' }))

    await waitFor(() => expect(deleted).toBe('orphan-item-1'))
    await waitFor(() => expect(screen.queryByText('MeuPluggy')).not.toBeInTheDocument())
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('keeps the dialog open when Pluggy fails', async () => {
    server.use(
      http.get('*/admin/bank-sync/orphans', () => HttpResponse.json(ORPHANS)),
      http.delete('*/admin/bank-sync/orphans/:itemId', () =>
        HttpResponse.json({ message: 'Pluggy indisponível' }, { status: 502 }),
      ),
    )
    const user = userEvent.setup()
    renderWithProviders(<OrphanItemsSection />)

    const [first] = await screen.findAllByRole('button', { name: 'Apagar na Pluggy' })
    await user.click(first)
    await user.click(screen.getByRole('button', { name: 'Apagar' }))

    const { toast } = await import('@/lib/toast')
    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })
})
