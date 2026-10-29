import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '@/test/msw/server'
import { renderWithProviders } from '@/test/utils'
import {
  MOCK_CATEGORY_FOOD,
  MOCK_CATEGORY_SALARY,
  MOCK_CATEGORY_HIDDEN,
  MOCK_CATEGORY_ARCHIVED,
  MOCK_CATEGORY_SYSTEM,
  resetCategoriesStore,
} from '@/test/handlers/categories.handlers'
import CategoriesPage from '../categories-page'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
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
  resetCategoriesStore()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('CategoriesPage', () => {
  it('renders the page heading', async () => {
    renderWithProviders(<CategoriesPage />)
    await waitFor(() => expect(screen.getByRole('heading', { name: /categorias/i })).toBeTruthy())
  })

  it('shows a loading skeleton while fetching', () => {
    renderWithProviders(<CategoriesPage />)
    expect(screen.getByLabelText('Carregando categorias')).toBeTruthy()
  })

  it('renders category list after loading', async () => {
    renderWithProviders(<CategoriesPage />)
    await waitFor(() => {
      expect(screen.getAllByText(MOCK_CATEGORY_FOOD.name).length).toBeGreaterThan(0)
      expect(screen.getByText(MOCK_CATEGORY_SALARY.name)).toBeTruthy()
    })
  })

  it('hidden categories are excluded from the default view', async () => {
    renderWithProviders(<CategoriesPage />)
    await waitFor(() =>
      expect(screen.getAllByText(MOCK_CATEGORY_FOOD.name).length).toBeGreaterThan(0),
    )
    expect(screen.queryByText(MOCK_CATEGORY_HIDDEN.name)).toBeNull()
  })

  it('archived categories are excluded from the default view', async () => {
    renderWithProviders(<CategoriesPage />)
    await waitFor(() =>
      expect(screen.getAllByText(MOCK_CATEGORY_FOOD.name).length).toBeGreaterThan(0),
    )
    expect(screen.queryByText(MOCK_CATEGORY_ARCHIVED.name)).toBeNull()
  })

  it('show hidden toggle reveals hidden categories', async () => {
    server.use(
      http.get('*/categories', ({ request }) => {
        const url = new URL(request.url)
        const includeHidden = url.searchParams.get('includeHidden') === 'true'
        const includeArchived = url.searchParams.get('includeArchived') === 'true'
        const all = [
          MOCK_CATEGORY_FOOD,
          MOCK_CATEGORY_SALARY,
          MOCK_CATEGORY_HIDDEN,
          MOCK_CATEGORY_ARCHIVED,
        ]
        let result = all
        if (!includeHidden) result = result.filter((c) => !c.isHidden)
        if (!includeArchived) result = result.filter((c) => !c.isArchived)
        return HttpResponse.json(result)
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<CategoriesPage />)

    await waitFor(() => screen.getAllByText(MOCK_CATEGORY_FOOD.name).length > 0)
    await user.click(screen.getByRole('button', { name: /mostrar ocultas/i }))
    await waitFor(() => expect(screen.getByText(MOCK_CATEGORY_HIDDEN.name)).toBeTruthy())
  })

  it('show archived toggle reveals archived categories', async () => {
    server.use(
      http.get('*/categories', ({ request }) => {
        const url = new URL(request.url)
        const includeHidden = url.searchParams.get('includeHidden') === 'true'
        const includeArchived = url.searchParams.get('includeArchived') === 'true'
        const all = [
          MOCK_CATEGORY_FOOD,
          MOCK_CATEGORY_SALARY,
          MOCK_CATEGORY_HIDDEN,
          MOCK_CATEGORY_ARCHIVED,
        ]
        let result = all
        if (!includeHidden) result = result.filter((c) => !c.isHidden)
        if (!includeArchived) result = result.filter((c) => !c.isArchived)
        return HttpResponse.json(result)
      }),
    )

    const user = userEvent.setup()
    renderWithProviders(<CategoriesPage />)

    await waitFor(() => screen.getAllByText(MOCK_CATEGORY_FOOD.name).length > 0)
    await user.click(screen.getByRole('button', { name: /mostrar arquivadas/i }))
    await waitFor(() => expect(screen.getByText(MOCK_CATEGORY_ARCHIVED.name)).toBeTruthy())
  })

  it('shows empty state when no categories exist', async () => {
    server.use(http.get('*/categories', () => HttpResponse.json([])))
    renderWithProviders(<CategoriesPage />)
    await waitFor(() => expect(screen.getByText(/nenhuma categoria/i)).toBeTruthy())
  })

  it('shows empty state with create CTA', async () => {
    server.use(http.get('*/categories', () => HttpResponse.json([])))
    renderWithProviders(<CategoriesPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /criar primeira categoria/i })).toBeTruthy(),
    )
  })

  it('shows error state when API fails', async () => {
    server.use(
      http.get('*/categories', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<CategoriesPage />)
    await waitFor(() => expect(screen.getByText(/falha ao carregar categorias/i)).toBeTruthy())
  })

  it('error state has retry button', async () => {
    server.use(
      http.get('*/categories', () =>
        HttpResponse.json({ errorCode: 'SERVER_ERROR' }, { status: 500 }),
      ),
    )
    renderWithProviders(<CategoriesPage />)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeTruthy(),
    )
  })

  it('Nova categoria button opens create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CategoriesPage />)
    await waitFor(() => screen.getByRole('button', { name: /nova categoria/i }))
    await user.click(screen.getByRole('button', { name: /nova categoria/i }))
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy())
    expect(screen.getByRole('heading', { name: /nova categoria/i })).toBeTruthy()
  })

  it('create category form → submit → category appears in list', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CategoriesPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova categoria/i }))
    await user.click(screen.getByRole('button', { name: /nova categoria/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.clear(screen.getByRole('textbox', { name: /nome/i }))
    await user.type(screen.getByRole('textbox', { name: /nome/i }), 'Transport')

    await user.click(screen.getByRole('button', { name: /criar categoria/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    await waitFor(() => expect(screen.getByText('Transport')).toBeTruthy())
  })

  it('create category form shows validation error for empty name', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CategoriesPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova categoria/i }))
    await user.click(screen.getByRole('button', { name: /nova categoria/i }))
    await waitFor(() => screen.getByRole('dialog'))

    const nameInput = screen.getByRole('textbox', { name: /nome/i })
    await user.clear(nameInput)

    await user.click(screen.getByRole('button', { name: /criar categoria/i }))

    await waitFor(() => expect(screen.getByText(/nome é obrigatório/i)).toBeTruthy())
  })

  it('cancel button closes the create dialog', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CategoriesPage />)

    await waitFor(() => screen.getByRole('button', { name: /nova categoria/i }))
    await user.click(screen.getByRole('button', { name: /nova categoria/i }))
    await waitFor(() => screen.getByRole('dialog'))

    await user.click(screen.getByRole('button', { name: /cancelar/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  describe('hide / show category', () => {
    it('hide button triggers hide action', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategoriesPage />)

      await waitFor(() => screen.getAllByText(MOCK_CATEGORY_FOOD.name).length > 0)

      await user.click(screen.getByRole('button', { name: /^ações de food$/i }))
      const hideButton = screen.getByRole('menuitem', { name: /^ocultar$/i })
      expect(hideButton).toBeTruthy()
      await user.click(hideButton)
    })
  })

  describe('Nova categoria button accessibility', () => {
    it('Nova categoria button uses primary design system style', async () => {
      renderWithProviders(<CategoriesPage />)
      await waitFor(() => screen.getByRole('button', { name: /nova categoria/i }))
      const btn = screen.getByRole('button', { name: /nova categoria/i })
      expect(btn.className).toContain('btn-primary')
    })
  })

  describe('system categories', () => {
    it('shows Sistema badge for system categories', async () => {
      renderWithProviders(<CategoriesPage />)
      await waitFor(() => expect(screen.getByText(MOCK_CATEGORY_SYSTEM.name)).toBeTruthy())
      expect(screen.getByText('Sistema')).toBeTruthy()
    })

    it('system categories can be hidden but not edited or archived', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategoriesPage />)
      await waitFor(() => expect(screen.getByText(MOCK_CATEGORY_SYSTEM.name)).toBeTruthy())
      const name = MOCK_CATEGORY_SYSTEM.name
      await user.click(screen.getByRole('button', { name: new RegExp(`^Ações de ${name}$`, 'i') }))
      expect(screen.getByRole('menuitem', { name: /^ocultar$/i })).not.toBeDisabled()
      expect(screen.queryByRole('menuitem', { name: /^editar$/i })).toBeNull()
      expect(screen.queryByRole('menuitem', { name: /^arquivar$/i })).toBeNull()
    })

    it('Edit button is enabled for non-system categories', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategoriesPage />)
      await waitFor(() => screen.getAllByText(MOCK_CATEGORY_FOOD.name).length > 0)
      await user.click(
        screen.getByRole('button', {
          name: new RegExp(`^Ações de ${MOCK_CATEGORY_FOOD.name}$`, 'i'),
        }),
      )
      const editBtn = screen.getByRole('menuitem', { name: /^editar$/i })
      expect(editBtn).not.toBeDisabled()
    })

    it('archive asks for confirmation before calling the API', async () => {
      let archived = false
      server.use(
        http.post('*/categories/:id/archive', () => {
          archived = true
          return new HttpResponse(null, { status: 204 })
        }),
      )
      const user = userEvent.setup()
      renderWithProviders(<CategoriesPage />)
      await waitFor(() => screen.getAllByText(MOCK_CATEGORY_FOOD.name).length > 0)

      await user.click(
        screen.getByRole('button', {
          name: new RegExp(`^Ações de ${MOCK_CATEGORY_FOOD.name}$`, 'i'),
        }),
      )
      await user.click(screen.getByRole('menuitem', { name: /^arquivar$/i }))
      await waitFor(() => screen.getByRole('dialog'))
      expect(archived).toBe(false)

      await user.click(screen.getByRole('button', { name: /arquivar categoria/i }))
      await waitFor(() => expect(archived).toBe(true))
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    })
  })

  describe('subcategory tree rendering', () => {
    it('renders subcategory under parent in tree', async () => {
      renderWithProviders(<CategoriesPage />)
      await waitFor(() => expect(screen.getByText('Restaurant')).toBeTruthy())
    })
  })

  describe('tabs', () => {
    it('subcategories collapse and expand from the chevron', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategoriesPage />)
      await waitFor(() => expect(screen.getByText('Restaurant')).toBeTruthy())
      await user.click(screen.getByRole('button', { name: /^recolher food$/i }))
      expect(screen.queryByText('Restaurant')).toBeNull()
      await user.click(screen.getByRole('button', { name: /^expandir food$/i }))
      expect(screen.getByText('Restaurant')).toBeTruthy()
    })

    it('"Regras automáticas" tab shows the rules section', async () => {
      const user = userEvent.setup()
      renderWithProviders(<CategoriesPage />)
      await waitFor(() => screen.getAllByText(MOCK_CATEGORY_FOOD.name).length > 0)
      await user.click(screen.getByRole('tab', { name: /regras automáticas/i }))
      expect(screen.getByRole('heading', { name: /regras de categorização/i })).toBeTruthy()
      expect(screen.getByRole('button', { name: /nova regra/i })).toBeTruthy()
    })
  })
})
