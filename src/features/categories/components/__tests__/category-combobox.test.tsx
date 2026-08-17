import { describe, it, expect, vi, afterEach } from 'vitest'
import { screen, cleanup, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils'
import type { Category } from '@/features/categories/types'
import { CategoryCombobox } from '../category-combobox'

function category(id: string, name: string, parentId: string | null = null): Category {
  return {
    id,
    name,
    color: '#4CAF50',
    icon: 'tag',
    parentId,
    sortOrder: 1,
    isDefault: false,
    isHidden: false,
    isArchived: false,
  }
}

/** Árvore como a API devolve: raízes com `subcategories`. */
const CATEGORIES: Category[] = [
  {
    ...category('cat-1', 'Alimentação'),
    subcategories: [
      category('cat-11', 'Restaurante', 'cat-1'),
      category('cat-12', 'Mercado', 'cat-1'),
    ],
  },
  {
    ...category('cat-2', 'Transporte'),
    subcategories: [category('cat-21', 'Combustível', 'cat-2')],
  },
]

afterEach(() => cleanup())

function renderCombobox(props: Partial<Parameters<typeof CategoryCombobox>[0]> = {}) {
  const onChange = vi.fn()
  renderWithProviders(
    <CategoryCombobox
      value={null}
      onChange={onChange}
      categories={CATEGORIES}
      aria-label="Categoria"
      {...props}
    />,
  )
  return { onChange }
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox', { name: 'Categoria' }))
}

describe('CategoryCombobox', () => {
  it('mostra as subcategorias agrupadas sob a raiz a que pertencem', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await open(user)

    const group = screen.getByRole('group', { name: 'Alimentação' })
    expect(within(group).getByRole('option', { name: 'Alimentação' })).toBeInTheDocument()
    expect(within(group).getByRole('option', { name: 'Restaurante' })).toBeInTheDocument()
    // "Combustível" é de outro grupo e não pode aparecer dentro de Alimentação.
    expect(within(group).queryByRole('option', { name: 'Combustível' })).toBeNull()
  })

  it('aceita a lista já achatada e reconstrói os grupos pelo parentId', async () => {
    const user = userEvent.setup()
    renderCombobox({
      categories: [
        category('cat-1', 'Alimentação'),
        category('cat-11', 'Restaurante', 'cat-1'),
        category('cat-2', 'Transporte'),
      ],
    })
    await open(user)

    expect(
      within(screen.getByRole('group', { name: 'Alimentação' })).getByRole('option', {
        name: 'Restaurante',
      }),
    ).toBeInTheDocument()
  })

  it('busca sem acento e mantém a raiz da subcategoria encontrada', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await open(user)

    await user.type(screen.getByRole('textbox', { name: /buscar categoria/i }), 'combustivel')

    expect(screen.getByRole('option', { name: 'Combustível' })).toBeInTheDocument()
    // A raiz continua visível para dar contexto; o grupo que não casa some.
    expect(screen.getByRole('option', { name: 'Transporte' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Alimentação' })).toBeNull()
  })

  it('seleciona a subcategoria clicada e fecha a lista', async () => {
    const user = userEvent.setup()
    const { onChange } = renderCombobox()
    await open(user)

    await user.click(screen.getByRole('option', { name: 'Mercado' }))

    expect(onChange).toHaveBeenCalledWith('cat-12')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('limpa a seleção pela opção vazia', async () => {
    const user = userEvent.setup()
    const { onChange } = renderCombobox({ value: 'cat-12' })
    await open(user)

    await user.click(screen.getByRole('option', { name: 'Sem categoria' }))

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('navega e escolhe pelo teclado na ordem raiz → subcategorias', async () => {
    const user = userEvent.setup()
    const { onChange } = renderCombobox()
    await open(user)

    // Da opção vazia: Alimentação, Restaurante, Mercado.
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{Enter}')

    expect(onChange).toHaveBeenCalledWith('cat-12')
  })

  it('mostra o nome da raiz junto ao da subcategoria escolhida', () => {
    renderCombobox({ value: 'cat-11' })

    expect(screen.getByRole('combobox', { name: 'Categoria' })).toHaveTextContent(
      'Alimentação › Restaurante',
    )
  })

  it('usa o nome de apoio enquanto a categoria selecionada não está na lista', () => {
    renderCombobox({ value: 'cat-99', categories: [], fallbackName: 'Lazer' })

    expect(screen.getByRole('combobox', { name: 'Categoria' })).toHaveTextContent('Lazer')
  })

  it('avisa quando a busca não encontra nada', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await open(user)

    await user.type(screen.getByRole('textbox', { name: /buscar categoria/i }), 'zzz')

    expect(screen.getByText(/nenhuma categoria encontrada/i)).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Alimentação' })).toBeNull()
  })

  it('leva o texto buscado para o cadastro rápido', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await open(user)

    await user.type(screen.getByRole('textbox', { name: /buscar categoria/i }), 'Barbearia')
    await user.click(screen.getByRole('button', { name: /criar categoria/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText(/nome/i)).toHaveValue('Barbearia')
  })

  it('cria subcategoria já dentro do grupo escolhido', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await open(user)

    await user.click(screen.getByRole('button', { name: 'Nova subcategoria em Transporte' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('esconde o cadastro rápido quando não é permitido criar', async () => {
    const user = userEvent.setup()
    renderCombobox({ allowCreate: false })
    await open(user)

    expect(screen.queryByRole('button', { name: /nova categoria/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /nova subcategoria/i })).toBeNull()
  })

  /**
   * O Modal fecha no Escape por um listener no `document`. Se o Escape do seletor
   * chegasse lá, fechar a lista fecharia junto o diálogo de importação inteiro.
   */
  it('fecha a lista com Escape sem deixar o evento chegar ao modal', async () => {
    const user = userEvent.setup()
    const onDocumentEscape = vi.fn()
    document.addEventListener('keydown', onDocumentEscape)

    try {
      renderCombobox()
      await open(user)
      await user.keyboard('{Escape}')

      expect(screen.queryByRole('listbox')).toBeNull()
      expect(onDocumentEscape).not.toHaveBeenCalled()
    } finally {
      document.removeEventListener('keydown', onDocumentEscape)
    }
  })
})
