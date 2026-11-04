import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  MOCK_CARD_1,
  MOCK_CARD_2,
  MOCK_INVOICE,
  MOCK_LIMIT_USAGE,
  resetCardsStore,
} from '@/test/handlers/cards.handlers'
import CardsPage from '../cards-page'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn(), action: vi.fn() },
}))

vi.mock('@/lib/logger', () => ({
  logger: { log: vi.fn() },
  LOG_EVENTS: {},
}))

vi.mock('@/styles/theme/dark-mode', () => ({
  applyTheme: vi.fn(),
  resolveTheme: vi.fn((t: string) => (t === 'dark' ? 'dark' : 'light')),
}))

beforeEach(() => {
  resetCardsStore()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('CardsPage — page header', () => {
  it('renders the Portuguese page heading', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /cartões de crédito/i })).toBeTruthy(),
    )
  })

  it('shows loading state in subtitle while fetching', () => {
    renderWithProviders(<CardsPage />)
    expect(screen.getByText('Carregando…')).toBeTruthy()
  })

  it('shows card count in subtitle after loading', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => expect(screen.getByText('2 cartões')).toBeTruthy())
  })

  it('shows "Novo cartão" primary action button', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: /novo cartão/i })).toBeTruthy())
  })
})

describe('CardsPage — loading skeleton', () => {
  it('shows the loading skeleton aria-label', () => {
    renderWithProviders(<CardsPage />)
    expect(screen.getByLabelText('Carregando cartões')).toBeTruthy()
  })
})

/** Os cartões viram botões de escolha (pílulas no tablet e celular, lista no desktop). */
function cardButton(name: string) {
  return within(screen.getByRole('group', { name: 'Escolher cartão' })).getByRole('button', {
    name: new RegExp(name),
  })
}

async function waitForCards() {
  await screen.findByRole('group', { name: 'Escolher cartão' })
}

describe('CardsPage — escolha do cartão', () => {
  it('renders one choice per active card after loading', async () => {
    renderWithProviders(<CardsPage />)
    await waitForCards()
    expect(cardButton(MOCK_CARD_1.name)).toBeTruthy()
    expect(cardButton(MOCK_CARD_2.name)).toBeTruthy()
  })

  it('renders the "Adicionar cartão" choice', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /adicionar cartão/i })).toBeTruthy(),
    )
  })

  it('first card is selected by default (aria-pressed=true)', async () => {
    renderWithProviders(<CardsPage />)
    await waitForCards()
    expect(cardButton(MOCK_CARD_1.name).getAttribute('aria-pressed')).toBe('true')
  })

  it('clicking a different card selects it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    await waitForCards()
    await user.click(cardButton(MOCK_CARD_2.name))
    await waitFor(() =>
      expect(cardButton(MOCK_CARD_2.name).getAttribute('aria-pressed')).toBe('true'),
    )
  })
})

describe('CardsPage — empty state', () => {
  beforeEach(() => {
    server.use(http.get('*/cards', () => HttpResponse.json([])))
  })

  it('shows Portuguese empty state message', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => expect(screen.getByText(/nenhum cartão encontrado/i)).toBeTruthy())
  })

  it('shows "Adicionar primeiro cartão" CTA', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /adicionar primeiro cartão/i })).toBeTruthy(),
    )
  })
})

describe('CardsPage — error state', () => {
  beforeEach(() => {
    server.use(
      http.get('*/cards', () => HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 })),
    )
  })

  it('shows Portuguese error message', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => expect(screen.getByText(/erro ao carregar cartões/i)).toBeTruthy())
  })

  it('shows "Tentar novamente" retry button', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeTruthy(),
    )
  })
})

describe('CardsPage — invoice section', () => {
  it('shows invoice loading state for selected card', async () => {
    // Hold the invoice response open: without it the default handler resolves
    // before the card renders, so the skeleton is already gone by the time we
    // can assert on it.
    let releaseInvoice: () => void = () => {}
    const invoicePending = new Promise<void>((resolve) => {
      releaseInvoice = resolve
    })
    server.use(
      http.get('*/cards/:id/invoices/:referenceMonth', async () => {
        await invoicePending
        return HttpResponse.json(MOCK_INVOICE)
      }),
    )

    renderWithProviders(<CardsPage />)
    await waitForCards()
    // The invoice query stays disabled until referenceMonth is set, so the
    // skeleton appears a tick after the card does.
    expect(await screen.findByLabelText('Carregando fatura')).toBeTruthy()

    releaseInvoice()
  })

  it('shows invoice total amount after loading', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => expect(screen.getByText(/fatura · nubank/i)).toBeTruthy())
  })

  it('does not list the invoice charges: they live on the card detail page', async () => {
    renderWithProviders(<CardsPage />)
    await screen.findByText(/fatura · nubank/i)
    await screen.findByRole('button', { name: /pagar fatura/i })
    expect(screen.queryByText(MOCK_INVOICE.items[0].description)).toBeNull()
    expect(screen.queryByRole('table', { name: 'Lançamentos' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Por categoria' })).toBeNull()
  })

  it('shows "Pagar fatura" button when remaining > 0', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: /pagar fatura/i })).toBeTruthy())
  })

  it('shows month tabs for invoice navigation', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => {
      const tablist = screen.getByRole('tablist', { name: /mês da fatura/i })
      expect(tablist).toBeTruthy()
      const tabs = screen.getAllByRole('tab')
      expect(tabs.length).toBe(4)
    })
  })

  it('the "Atual" tab is selected by default', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => {
      // O rótulo traz o mês do vencimento junto ("Set · Atual"), e ele depende da data de
      // hoje — só a marca "Atual" é estável.
      const atualTab = screen.getByRole('tab', { name: /atual/i })
      expect(atualTab.getAttribute('aria-selected')).toBe('true')
    })
  })

  it('clicking a month tab changes the selected month', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    await waitFor(() => screen.getAllByRole('tab'))
    const tabs = screen.getAllByRole('tab')
    await user.click(tabs[1])
    await waitFor(() => {
      expect(tabs[1].getAttribute('aria-selected')).toBe('true')
      expect(tabs[0].getAttribute('aria-selected')).toBe('false')
    })
  })
})

describe('CardsPage — limite e detalhe do cartão', () => {
  it('shows the limit once, inside the invoice', async () => {
    renderWithProviders(<CardsPage />)
    const invoice = await screen.findByRole('region', { name: 'Fatura' })
    await waitFor(() => expect(within(invoice).getByText('Limite disponível')).toBeTruthy())
    expect(screen.getAllByText('Limite disponível')).toHaveLength(1)
    expect(screen.queryByText(/uso do limite/i)).toBeNull()
    expect(screen.queryByText('Limite total')).toBeNull()
  })

  it('links to the card detail page, where it is edited and archived', async () => {
    renderWithProviders(<CardsPage />)
    const link = await screen.findByRole('link', { name: 'Detalhes do cartão' })
    expect(link.getAttribute('href')).toBe(`/cards/${MOCK_CARD_1.id}`)
  })
})

describe('CardsPage — pay invoice dialog', () => {
  it('"Pagar fatura" opens pay invoice modal', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    await waitFor(() => screen.getByRole('button', { name: /pagar fatura/i }))
    await user.click(screen.getByRole('button', { name: /pagar fatura/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByText(/pagar fatura · nubank/i)).toBeTruthy()
    })
  })

  it('pay invoice dialog shows three mini stats', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    await waitFor(() => screen.getByRole('button', { name: /pagar fatura/i }))
    await user.click(screen.getByRole('button', { name: /pagar fatura/i }))
    await waitFor(() => {
      expect(screen.getByText('Total da fatura')).toBeTruthy()
      expect(screen.getByText('Já pago')).toBeTruthy()
      expect(screen.getByText('Restante')).toBeTruthy()
    })
  })

  it('pay invoice dialog has "Pagar tudo", "50%", "Mínimo (15%)" preset buttons', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    await waitFor(() => screen.getByRole('button', { name: /pagar fatura/i }))
    await user.click(screen.getByRole('button', { name: /pagar fatura/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pagar tudo/i })).toBeTruthy()
      expect(screen.getByRole('button', { name: /50%/i })).toBeTruthy()
      expect(screen.getByRole('button', { name: /mínimo \(15%\)/i })).toBeTruthy()
    })
  })

  it('pay invoice dialog has account selector', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    await waitFor(() => screen.getByRole('button', { name: /pagar fatura/i }))
    await user.click(screen.getByRole('button', { name: /pagar fatura/i }))
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /conta de origem/i })).toBeTruthy()
    })
  })

  it('Cancelar closes the pay invoice dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    await waitFor(() => screen.getByRole('button', { name: /pagar fatura/i }))
    await user.click(screen.getByRole('button', { name: /pagar fatura/i }))
    await waitFor(() => screen.getByRole('dialog'))
    await user.click(screen.getByRole('button', { name: /cancelar/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})

describe('CardsPage — create card dialog', () => {
  it('"Novo cartão" button opens create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    await waitForCards()
    await user.click(screen.getByRole('button', { name: /novo cartão/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy()
      expect(screen.getByRole('heading', { name: /novo cartão de crédito/i })).toBeTruthy()
    })
  })

  it('create card form → submit → new card appears in list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    await waitForCards()
    await user.click(screen.getByRole('button', { name: /novo cartão/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.clear(screen.getByRole('textbox', { name: /^nome$/i }))
    await user.type(screen.getByRole('textbox', { name: /^nome$/i }), 'My Test Card')
    await user.type(screen.getByRole('textbox', { name: /limite/i }), '5000,00')
    await user.click(screen.getByRole('button', { name: /criar cartão/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(cardButton('My Test Card')).toBeTruthy())
  })

  it('create card form shows validation error for empty name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    await waitForCards()
    await user.click(screen.getByRole('button', { name: /novo cartão/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.clear(screen.getByRole('textbox', { name: /^nome$/i }))
    await user.click(screen.getByRole('button', { name: /criar cartão/i }))

    await waitFor(() => expect(screen.getByText(/nome é obrigatório/i)).toBeTruthy())
  })

  it('Cancel button closes the create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    await waitForCards()
    await user.click(screen.getByRole('button', { name: /novo cartão/i }))
    await waitFor(() => screen.getByRole('dialog'))
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})

describe('CardsPage — Phase 7 acceptance criteria', () => {
  it('shows usagePercentage from backend in the limit bar', async () => {
    renderWithProviders(<CardsPage />)
    const bar = await screen.findByRole('progressbar', { name: 'Limite usado' })
    expect(bar.getAttribute('aria-valuenow')).toBe(
      String(Math.round(parseFloat(MOCK_LIMIT_USAGE.usagePercentage!))),
    )
  })

  /**
   * Fechamento e vencimento lado a lado. O vencimento entrou no subtítulo justamente porque
   * a aba nomeia a fatura pelo mês em que ela vence: sem ele, "Jun" ao lado de um
   * fechamento em 01/05 não tinha como ser lido.
   */
  it('shows both the closing and the due date of the invoice', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => expect(screen.getByText(/fatura · nubank/i)).toBeTruthy())
    await waitFor(() => {
      const subtitle = screen.getByText(/fecha em/i)
      expect(subtitle.textContent).toMatch(/01\/05\/2026/)
      expect(subtitle.textContent).toMatch(/10\/06\/2026/)
    })
  })

  /** A fatura que fecha em 01/05 vence em 10/06, e é a de junho para o emissor. */
  it('labels the month tabs by the month the invoice is due', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => screen.getAllByRole('tab'))
    const labels = screen.getAllByRole('tab').map((tab) => tab.textContent)

    // Toda aba diz o mês do vencimento; a corrente acrescenta a marca "atual".
    expect(labels.filter((label) => /· atual$/.test(label ?? ''))).toHaveLength(1)
    expect(
      labels.every((label) =>
        /^(Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)/.test(label ?? ''),
      ),
    ).toBe(true)
  })

  it('shows closing day from card.closingDay next to the limit', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => {
      expect(
        screen.getByText(
          new RegExp(`Fecha dia ${String(MOCK_CARD_1.closingDay).padStart(2, '0')}`),
        ),
      ).toBeTruthy()
    })
  })

  it('invoice close date renders correctly when closingDate present', async () => {
    renderWithProviders(<CardsPage />)
    await waitFor(() => expect(screen.getByText(/fatura · nubank/i)).toBeTruthy())
    await waitFor(() => {
      // closingDate is '2026-05-01' which fmtDate converts to '01/05/2026'
      const sub = screen.getByText(/fecha em 01\/05\/2026/i)
      expect(sub).toBeTruthy()
    })
  })
})

describe('CardsPage — cartões arquivados', () => {
  it('lists archived cards with a link to their detail page, out of the active row', async () => {
    server.use(
      http.get('*/cards', () =>
        HttpResponse.json([MOCK_CARD_1, { ...MOCK_CARD_2, archivedAt: '2026-01-01T00:00:00Z' }]),
      ),
    )
    renderWithProviders(<CardsPage />)

    await waitFor(() => expect(screen.getByText('1 cartão')).toBeTruthy())
    expect(screen.getByText('Arquivados:')).toBeTruthy()
    const link = screen.getByRole('link', { name: MOCK_CARD_2.name })
    expect(link.getAttribute('href')).toBe(`/cards/${MOCK_CARD_2.id}`)
  })
})

describe('CardsPage no celular', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    window.matchMedia = ((query: string) => ({
      matches: query === '(max-width: 767px)',
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('mostra a fatura antes de qualquer outra seção, com os cartões em pílulas', async () => {
    renderWithProviders(<CardsPage />)
    const invoice = await screen.findByRole('region', { name: 'Fatura' })
    await waitFor(() =>
      expect(within(invoice).getByRole('button', { name: 'Pagar fatura' })).toBeTruthy(),
    )

    const pills = within(screen.getByRole('group', { name: 'Escolher cartão' })).getAllByRole(
      'button',
    )
    expect(pills[0].getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByRole('button', { name: /cartão de crédito$/ })).toBeNull()

    const regions = screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))
    expect(regions[0]).toBe('Fatura')
  })

  it('mostra o limite uma vez só', async () => {
    renderWithProviders(<CardsPage />)
    await screen.findByText('Limite disponível')
    expect(screen.queryByText('Limite total')).toBeNull()
    expect(screen.queryByText('Uso do limite')).toBeNull()
    // Sem o painel "Detalhes do cartão": só o link para a tela de detalhe.
    const link = screen.getByRole('link', { name: 'Detalhes do cartão' })
    expect(link.getAttribute('href')).toBe(`/cards/${MOCK_CARD_1.id}`)
  })

  it('trocar de pílula troca o cartão', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CardsPage />)
    const group = await screen.findByRole('group', { name: 'Escolher cartão' })
    const second = within(group).getByRole('button', { name: new RegExp(MOCK_CARD_2.name) })
    await user.click(second)
    expect(second.getAttribute('aria-pressed')).toBe('true')
  })
})

describe('CardsPage no desktop', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    window.matchMedia = ((query: string) => ({
      matches: query === '(min-width: 1280px)',
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('lista os cartões numa coluna e o resumo da fatura ao lado, sem os lançamentos', async () => {
    renderWithProviders(<CardsPage />)
    const list = await screen.findByRole('region', { name: 'Seus cartões' })
    expect(within(list).getAllByRole('button', { pressed: true })).toHaveLength(1)
    const invoice = screen.getByRole('region', { name: 'Fatura' })
    await waitFor(() =>
      expect(within(invoice).getByRole('button', { name: 'Pagar fatura' })).toBeTruthy(),
    )
    expect(screen.queryByRole('table', { name: 'Lançamentos' })).toBeNull()
  })
})
