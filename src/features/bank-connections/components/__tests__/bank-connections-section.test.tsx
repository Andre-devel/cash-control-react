import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import { BankConnectionsSection } from '../bank-connections-section'
import type { BankConnection } from '@/features/bank-connections/types'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

// O widget real abre um iframe da Pluggy; aqui ele só devolve o item ao clicar.
vi.mock('react-pluggy-connect', () => ({
  PluggyConnect: ({
    connectToken,
    updateItem,
    onSuccess,
    onClose,
  }: {
    connectToken: string
    updateItem?: string
    onSuccess: (data: { item: { id: string } }) => void
    onClose: () => void
  }) => (
    <div role="dialog" aria-label="Pluggy Connect">
      <span>token {connectToken}</span>
      {updateItem && <span>atualiza {updateItem}</span>}
      <button onClick={() => onSuccess({ item: { id: 'item-new' } })}>Concluir</button>
      <button onClick={onClose}>Fechar widget</button>
    </div>
  ),
}))

const CONNECTION: BankConnection = {
  id: 'conn-1',
  itemId: 'item-1',
  connectorName: 'Inter',
  status: 'UPDATED',
  statusDetail: null,
  lastSyncedAt: '2026-10-30T10:00:00Z',
  accounts: [
    {
      id: 'ba-1',
      kind: 'BANK',
      name: 'Conta Corrente',
      number: '1234567-8',
      accountId: null,
      creditCardId: null,
    },
    {
      id: 'ba-2',
      kind: 'CREDIT',
      name: 'Inter Black',
      number: '1234',
      accountId: null,
      creditCardId: 'card-1',
    },
  ],
}

function mockConnections(connections: BankConnection[], enabled = true) {
  server.use(
    http.get('*/bank-connections', () => HttpResponse.json({ enabled, connections })),
    http.get('*/accounts', () =>
      HttpResponse.json([
        { id: 'acc-1', name: 'Inter PF', archivedAt: null },
        { id: 'acc-old', name: 'Conta antiga', archivedAt: '2026-01-01T00:00:00Z' },
      ]),
    ),
    http.get('*/cards', () => HttpResponse.json([{ id: 'card-1', name: 'Cartão Inter' }])),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('BankConnectionsSection', () => {
  it('renders nothing when the server has no Pluggy credentials', async () => {
    mockConnections([], false)
    const { container } = renderWithProviders(<BankConnectionsSection />)

    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(screen.queryByText('Conexões bancárias')).not.toBeInTheDocument()
  })

  it('lists the connection with its accounts and current links', async () => {
    mockConnections([CONNECTION])
    renderWithProviders(<BankConnectionsSection />)

    expect(await screen.findByText('Inter')).toBeInTheDocument()
    expect(screen.getByText('Atualizada')).toBeInTheDocument()
    expect(screen.getByLabelText(/Conta Corrente · 1234567-8/)).toHaveValue('')
    await waitFor(() => expect(screen.getByLabelText(/Inter Black · 1234/)).toHaveValue('card-1'))
    // Conta arquivada e sem vínculo não é oferecida.
    expect(screen.queryByRole('option', { name: 'Conta antiga' })).not.toBeInTheDocument()
  })

  it('links a bank account to an app account', async () => {
    mockConnections([CONNECTION])
    let body: unknown
    server.use(
      http.put('*/bank-connections/conn-1/accounts/ba-1/link', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(CONNECTION)
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<BankConnectionsSection />)

    const select = await screen.findByLabelText(/Conta Corrente/)
    await screen.findByRole('option', { name: 'Inter PF' })
    await user.selectOptions(select, 'acc-1')

    await waitFor(() => expect(body).toEqual({ accountId: 'acc-1', creditCardId: null }))
  })

  it('connects a bank: token, widget, then registers the returned item', async () => {
    mockConnections([])
    let registered: unknown
    server.use(
      http.post('*/bank-connections/connect-token', () =>
        HttpResponse.json({ accessToken: 'tok-1' }),
      ),
      http.post('*/bank-connections', async ({ request }) => {
        registered = await request.json()
        return HttpResponse.json(CONNECTION, { status: 201 })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<BankConnectionsSection />)

    await user.click(await screen.findByRole('button', { name: /Conectar banco/ }))
    expect(await screen.findByText('token tok-1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Concluir' }))

    await waitFor(() => expect(registered).toEqual({ itemId: 'item-new' }))
    const { toast } = await import('@/lib/toast')
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Banco conectado. Vincule as contas abaixo.'),
    )
    await user.click(screen.getByRole('button', { name: 'Fechar widget' }))
    expect(screen.queryByText('token tok-1')).not.toBeInTheDocument()
  })

  it('offers to reconnect an expired consent, opening the widget on the same item', async () => {
    mockConnections([
      { ...CONNECTION, status: 'LOGIN_ERROR', statusDetail: 'Consentimento expirado' },
    ])
    server.use(
      http.post('*/bank-connections/conn-1/connect-token', () =>
        HttpResponse.json({ accessToken: 'tok-re' }),
      ),
    )
    const user = userEvent.setup()
    renderWithProviders(<BankConnectionsSection />)

    expect(await screen.findByText('Precisa reconectar')).toBeInTheDocument()
    expect(screen.getByText('Consentimento expirado')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reconectar' }))

    expect(await screen.findByText('atualiza item-1')).toBeInTheDocument()
  })

  it('removes a connection after confirmation', async () => {
    mockConnections([CONNECTION])
    let deleted = false
    server.use(
      http.delete('*/bank-connections/conn-1', () => {
        deleted = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const user = userEvent.setup()
    renderWithProviders(<BankConnectionsSection />)

    await user.click(await screen.findByRole('button', { name: 'Remover Inter' }))
    await user.click(screen.getByRole('button', { name: 'Remover' }))

    await waitFor(() => expect(deleted).toBe(true))
  })
})
