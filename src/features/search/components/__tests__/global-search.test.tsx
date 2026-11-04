import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { createTestQueryClient } from '@/test/utils'
import { MOBILE_QUERY } from '@/hooks/use-media-query'
import type { SearchResponse } from '@/features/search/types'
import { GlobalSearch, seeAllHref } from '../global-search'

const RESPONSE: SearchResponse = {
  transactions: [
    {
      id: 'tx-1',
      title: 'Mercado Pão de Açúcar',
      subtitle: 'Nubank',
      date: '2026-11-02',
      amount: '615.23',
      type: 'EXPENSE',
    },
    {
      id: 'tx-2',
      title: 'Mercado Livre',
      subtitle: 'Pix para Fulano',
      date: '2026-10-28',
      amount: '89.90',
      type: 'EXPENSE',
    },
  ],
  accounts: [{ id: 'acc-1', title: 'Conta Mercado Pago', subtitle: 'Corrente' }],
  creditCards: [{ id: 'card-1', title: 'Cartão Mercado', subtitle: 'Visa · final 1234' }],
  categories: [{ id: 'cat-1', title: 'Mercado', subtitle: null }],
  recurrences: [],
  installments: [],
}

let queries: string[] = []

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

function renderSearch() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <GlobalSearch />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function mockMatchMedia(mobile: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: mobile && query === MOBILE_QUERY,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

beforeEach(() => {
  queries = []
  server.use(
    http.get('*/search', ({ request }) => {
      queries.push(new URL(request.url).searchParams.get('q') ?? '')
      return HttpResponse.json(RESPONSE)
    }),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('GlobalSearch', () => {
  it('não busca com 1 caractere', async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole('combobox', { name: 'Buscar' }), 'm')

    expect(await screen.findByText('Digite ao menos 2 caracteres.')).toBeInTheDocument()
    // Passa do debounce de 250 ms sem disparar a consulta.
    await act(() => new Promise((resolve) => setTimeout(resolve, 400)))
    expect(queries).toEqual([])
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('mostra os resultados agrupados, com debounce numa consulta só', async () => {
    const user = userEvent.setup()
    renderSearch()

    const input = screen.getByRole('combobox', { name: 'Buscar' })
    await user.type(input, 'merc')

    const listbox = await screen.findByRole('listbox', { name: 'Resultados da busca' })
    expect(await within(listbox).findByRole('group', { name: 'Transações' })).toBeInTheDocument()
    expect(within(listbox).getByRole('group', { name: 'Contas' })).toBeInTheDocument()
    expect(within(listbox).getByRole('group', { name: 'Cartões' })).toBeInTheDocument()
    expect(within(listbox).getByRole('group', { name: 'Categorias' })).toBeInTheDocument()
    // Grupos vazios não aparecem.
    expect(within(listbox).queryByRole('group', { name: 'Recorrências' })).not.toBeInTheDocument()

    const transactions = within(listbox).getByRole('group', { name: 'Transações' })
    expect(within(transactions).getAllByRole('option')).toHaveLength(2)
    expect(within(transactions).getByText('Mercado Pão de Açúcar')).toBeInTheDocument()
    expect(within(listbox).getByRole('option', { name: /Ver todas as transações/ })).toBeVisible()
    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(queries).toEqual(['merc'])
  })

  it('↑↓ movem a opção ativa e Enter abre o detalhe', async () => {
    const user = userEvent.setup()
    renderSearch()

    const input = screen.getByRole('combobox', { name: 'Buscar' })
    await user.type(input, 'merc')
    await screen.findByText('Mercado Pão de Açúcar')

    await user.keyboard('{ArrowDown}')
    const first = screen.getByRole('option', { name: /Mercado Pão de Açúcar/ })
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', first.id)

    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(screen.getByRole('option', { name: /Conta Mercado Pago/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('option', { name: /Mercado Livre/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await user.keyboard('{Enter}')
    expect(screen.getByTestId('location')).toHaveTextContent('/transactions/tx-2')
    expect(input).toHaveValue('')
  })

  it('↑ na primeira opção vai para "Ver todas as transações", que leva à lista filtrada', async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole('combobox', { name: 'Buscar' }), 'merc')
    await screen.findByText('Mercado Pão de Açúcar')

    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('option', { name: /Ver todas as transações/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await user.keyboard('{Enter}')
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/transactions?period=all&includeCreditCard=true&searchText=merc',
    )
  })

  it('"Ver todas" com um valor filtra pelo valor exato em vez do texto', () => {
    expect(seeAllHref('R$ 1.615,23')).toBe(
      '/transactions?period=all&includeCreditCard=true&amountMin=1615.23&amountMax=1615.23',
    )
    expect(seeAllHref('mercado 2')).toBe(
      '/transactions?period=all&includeCreditCard=true&searchText=mercado+2',
    )
  })

  it('clique num cartão abre o detalhe do cartão', async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole('combobox', { name: 'Buscar' }), 'merc')
    await user.click(await screen.findByRole('option', { name: /Cartão Mercado/ }))

    expect(screen.getByTestId('location')).toHaveTextContent('/cards/card-1')
  })

  it('Esc fecha a lista e, de novo, limpa o campo', async () => {
    const user = userEvent.setup()
    renderSearch()

    const input = screen.getByRole('combobox', { name: 'Buscar' })
    await user.type(input, 'merc')
    await screen.findByText('Mercado Pão de Açúcar')

    await user.keyboard('{Escape}')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveValue('merc')

    await user.keyboard('{Escape}')
    expect(input).toHaveValue('')
    expect(input).not.toHaveFocus()
  })

  it('mostra quando nada é encontrado', async () => {
    server.use(
      http.get('*/search', () =>
        HttpResponse.json({
          transactions: [],
          accounts: [],
          creditCards: [],
          categories: [],
          recurrences: [],
          installments: [],
        } satisfies SearchResponse),
      ),
    )
    const user = userEvent.setup()
    renderSearch()

    await user.type(screen.getByRole('combobox', { name: 'Buscar' }), 'xyz')

    expect(await screen.findByText('Nada encontrado para “xyz”.')).toBeInTheDocument()
  })

  it('Ctrl+K foca o campo no desktop', async () => {
    const user = userEvent.setup()
    renderSearch()

    const input = screen.getByRole('combobox', { name: 'Buscar' })
    expect(input).not.toHaveFocus()
    await user.keyboard('{Control>}k{/Control}')
    expect(input).toHaveFocus()

    act(() => input.blur())
    await user.keyboard('{Meta>}k{/Meta}')
    expect(input).toHaveFocus()
  })

  it('no celular, Ctrl+K e a lupa abrem a busca em tela cheia', async () => {
    mockMatchMedia(true)
    const user = userEvent.setup()
    renderSearch()

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()

    await user.keyboard('{Control>}k{/Control}')
    const dialog = await screen.findByRole('dialog', { name: 'Buscar' })
    const input = within(dialog).getByRole('combobox', { name: 'Buscar' })
    await waitFor(() => expect(input).toHaveFocus())

    await user.type(input, 'merc')
    await within(dialog).findByText('Mercado Pão de Açúcar')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(screen.getByTestId('location')).toHaveTextContent('/transactions/tx-1')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(await screen.findByRole('dialog', { name: 'Buscar' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
