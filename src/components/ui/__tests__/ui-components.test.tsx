import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach } from 'vitest'
import { Button } from '../button'
import { Input } from '../input'
import { Textarea } from '../textarea'
import { Field } from '../field'
import { PasswordInput } from '../password-input'
import { MoneyInput } from '../money-input'
import { Select } from '../select'
import { Toggle } from '../toggle'
import { Badge } from '../badge'
import { StatusBadge } from '../status-badge'
import { TypeBadge } from '../type-badge'
import { IconBubble } from '../icon-bubble'
import { Avatar } from '../avatar'
import { Modal } from '../modal'
import { EmptyState } from '../empty-state'
import { Money } from '../money'

afterEach(cleanup)

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

describe('Button', () => {
  it('renders with default class', () => {
    render(<Button>Click me</Button>)
    const btn = screen.getByRole('button', { name: 'Click me' })
    expect(btn.className).toContain('btn')
  })

  it('applies primary variant class', () => {
    render(<Button variant="primary">Primary</Button>)
    const btn = screen.getByRole('button', { name: 'Primary' })
    expect(btn.className).toContain('btn-primary')
  })

  it('applies ghost variant class', () => {
    render(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByRole('button').className).toContain('btn-ghost')
  })

  it('applies danger variant class', () => {
    render(<Button variant="danger">Danger</Button>)
    expect(screen.getByRole('button').className).toContain('btn-danger')
  })

  it('applies backward-compat destructive as danger', () => {
    render(<Button variant="destructive">Del</Button>)
    expect(screen.getByRole('button').className).toContain('btn-danger')
  })

  it('applies sm size class', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button').className).toContain('btn-sm')
  })

  it('applies lg size class', () => {
    render(<Button size="lg">Large</Button>)
    expect(screen.getByRole('button').className).toContain('btn-lg')
  })

  it('applies icon size class', () => {
    render(<Button size="icon">Icon</Button>)
    expect(screen.getByRole('button').className).toContain('btn-icon')
  })

  it('renders leading and trailing nodes', () => {
    render(
      <Button
        leading={<span data-testid="lead">L</span>}
        trailing={<span data-testid="trail">T</span>}
      >
        Text
      </Button>,
    )
    expect(screen.getByTestId('lead')).toBeTruthy()
    expect(screen.getByTestId('trail')).toBeTruthy()
  })

  it('fires onClick when clicked', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders as anchor via asChild', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    )
    expect(screen.getByRole('link', { name: 'Link Button' })).toBeTruthy()
  })

  it('merges custom className', () => {
    render(<Button className="custom-class">Btn</Button>)
    expect(screen.getByRole('button').className).toContain('custom-class')
  })
})

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it('applies input class', () => {
    render(<Input />)
    expect(screen.getByRole('textbox').className).toContain('input')
  })

  it('adds error class when error prop is set', () => {
    render(<Input error />)
    expect(screen.getByRole('textbox').className).toContain('error')
  })

  it('wraps in input-group when leading is provided', () => {
    const { container } = render(<Input leading={<span>$</span>} />)
    expect(container.querySelector('.input-group')).toBeTruthy()
  })

  it('wraps in input-group when trailing is provided', () => {
    const { container } = render(<Input trailing={<span>kg</span>} />)
    expect(container.querySelector('.input-group')).toBeTruthy()
  })

  it('does not wrap in input-group without leading/trailing', () => {
    const { container } = render(<Input />)
    expect(container.querySelector('.input-group')).toBeNull()
  })

  it('accepts typed input', async () => {
    const user = userEvent.setup()
    render(<Input />)
    await user.type(screen.getByRole('textbox'), 'hello')
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('hello')
  })
})

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------

describe('Textarea', () => {
  it('renders a textarea element', () => {
    render(<Textarea />)
    expect(screen.getByRole('textbox')).toBeTruthy()
  })

  it('applies textarea class', () => {
    render(<Textarea />)
    expect(screen.getByRole('textbox').className).toContain('textarea')
  })

  it('adds error class when error prop is set', () => {
    render(<Textarea error />)
    expect(screen.getByRole('textbox').className).toContain('error')
  })
})

// ---------------------------------------------------------------------------
// Field
// ---------------------------------------------------------------------------

describe('Field', () => {
  it('renders label and associates it with input via htmlFor', () => {
    render(
      <Field label="Email">
        <Input />
      </Field>,
    )
    const label = screen.getByText('Email')
    const input = screen.getByRole('textbox')
    expect(label.tagName).toBe('LABEL')
    expect(input.id).toBeTruthy()
    expect((label as HTMLLabelElement).htmlFor).toBe(input.id)
  })

  it('label is linked so getByLabelText works', () => {
    render(
      <Field label="Username">
        <Input />
      </Field>,
    )
    expect(screen.getByLabelText('Username')).toBeTruthy()
  })

  it('respects explicit htmlFor', () => {
    render(
      <Field label="Name" htmlFor="my-input">
        <Input id="my-input" />
      </Field>,
    )
    const label = screen.getByText('Name') as HTMLLabelElement
    expect(label.htmlFor).toBe('my-input')
  })

  it('shows error message', () => {
    render(
      <Field label="Field" error="This field is required">
        <Input />
      </Field>,
    )
    expect(screen.getByText('This field is required')).toBeTruthy()
  })

  it('shows hint when no error', () => {
    render(
      <Field label="Field" hint="Optional hint">
        <Input />
      </Field>,
    )
    expect(screen.getByText('Optional hint')).toBeTruthy()
  })

  it('hides hint when error is present', () => {
    render(
      <Field label="Field" error="Error msg" hint="Hint msg">
        <Input />
      </Field>,
    )
    expect(screen.queryByText('Hint msg')).toBeNull()
    expect(screen.getByText('Error msg')).toBeTruthy()
  })

  it('shows required marker when required prop is set', () => {
    const { container } = render(
      <Field label="Name" required>
        <Input />
      </Field>,
    )
    expect(container.querySelector('.req')).toBeTruthy()
  })

  it('applies span style when span prop is set', () => {
    const { container } = render(
      <Field label="Full width" span={2}>
        <Input />
      </Field>,
    )
    const fieldDiv = container.querySelector('.field') as HTMLElement
    expect(fieldDiv.style.gridColumn).toBe('span 2')
  })

  it('renders without label', () => {
    render(
      <Field>
        <Input placeholder="No label" />
      </Field>,
    )
    expect(screen.queryByRole('label')).toBeNull()
    expect(screen.getByRole('textbox')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// PasswordInput
// ---------------------------------------------------------------------------

describe('PasswordInput', () => {
  it('starts as password type', () => {
    render(<PasswordInput />)
    const input = document.querySelector('input')!
    expect(input.type).toBe('password')
  })

  it('toggles to text when eye button is clicked', async () => {
    const user = userEvent.setup()
    render(<PasswordInput />)
    const toggle = screen.getByRole('button', { name: /mostrar senha/i })
    await user.click(toggle)
    expect(document.querySelector('input')!.type).toBe('text')
  })

  it('toggles back to password on second click', async () => {
    const user = userEvent.setup()
    render(<PasswordInput />)
    const toggle = screen.getByRole('button', { name: /mostrar senha/i })
    await user.click(toggle)
    const hideBtn = screen.getByRole('button', { name: /ocultar senha/i })
    await user.click(hideBtn)
    expect(document.querySelector('input')!.type).toBe('password')
  })

  it('passes error prop to Input', () => {
    render(<PasswordInput error />)
    expect(document.querySelector('input')!.className).toContain('error')
  })
})

// ---------------------------------------------------------------------------
// MoneyInput
// ---------------------------------------------------------------------------

describe('MoneyInput', () => {
  it('renders an input', () => {
    render(<MoneyInput />)
    expect(document.querySelector('input')).toBeTruthy()
  })

  it('shows default R$ currency symbol', () => {
    render(<MoneyInput />)
    expect(screen.getByText('R$')).toBeTruthy()
  })

  it('shows custom currency symbol', () => {
    render(<MoneyInput currency="$" />)
    expect(screen.getByText('$')).toBeTruthy()
  })

  it('uses decimal inputMode', () => {
    render(<MoneyInput />)
    expect(document.querySelector('input')!.inputMode).toBe('decimal')
  })
})

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

describe('Select', () => {
  it('renders a select element', () => {
    render(
      <Select>
        <option value="a">A</option>
      </Select>,
    )
    expect(screen.getByRole('combobox')).toBeTruthy()
  })

  it('applies select class', () => {
    render(<Select />)
    expect(screen.getByRole('combobox').className).toContain('select')
  })

  it('adds error class when error prop is set', () => {
    render(<Select error />)
    expect(screen.getByRole('combobox').className).toContain('error')
  })

  it('renders options', () => {
    render(
      <Select>
        <option value="one">One</option>
        <option value="two">Two</option>
      </Select>,
    )
    expect(screen.getByRole('option', { name: 'One' })).toBeTruthy()
    expect(screen.getByRole('option', { name: 'Two' })).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

describe('Toggle', () => {
  it('renders a button', () => {
    render(<Toggle on={false} />)
    expect(screen.getByRole('button')).toBeTruthy()
  })

  it('sets aria-pressed to false when off', () => {
    render(<Toggle on={false} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('sets aria-pressed to true when on', () => {
    render(<Toggle on={true} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('applies on class when toggled on', () => {
    render(<Toggle on={true} />)
    expect(screen.getByRole('button').className).toContain('on')
  })

  it('does not apply on class when off', () => {
    render(<Toggle on={false} />)
    expect(screen.getByRole('button').className).not.toContain('on')
  })

  it('calls onChange with toggled value on click', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Toggle on={false} onChange={onChange} />)
    await user.click(screen.getByRole('button'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('calls onChange with false when currently on', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Toggle on={true} onChange={onChange} />)
    await user.click(screen.getByRole('button'))
    expect(onChange).toHaveBeenCalledWith(false)
  })
})

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeTruthy()
  })

  it('applies badge and kind classes', () => {
    const { container } = render(<Badge kind="paid">Paid</Badge>)
    const span = container.querySelector('span')!
    expect(span.className).toContain('badge')
    expect(span.className).toContain('paid')
  })

  it('renders dot span by default', () => {
    const { container } = render(<Badge>Dot</Badge>)
    expect(container.querySelector('.dot')).toBeTruthy()
  })

  it('hides dot when dot=false', () => {
    const { container } = render(<Badge dot={false}>No dot</Badge>)
    expect(container.querySelector('.dot')).toBeNull()
  })

  it('applies square class when square=true', () => {
    const { container } = render(<Badge square>Square</Badge>)
    expect(container.querySelector('span')!.className).toContain('square')
  })

  it('defaults to muted kind', () => {
    const { container } = render(<Badge>Default</Badge>)
    expect(container.querySelector('span')!.className).toContain('muted')
  })
})

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

describe('StatusBadge', () => {
  it('renders PAID label', () => {
    render(<StatusBadge status="PAID" />)
    expect(screen.getByText('Pago')).toBeTruthy()
  })

  it('renders PENDING label', () => {
    render(<StatusBadge status="PENDING" />)
    expect(screen.getByText('Pendente')).toBeTruthy()
  })

  it('renders CANCELLED label', () => {
    render(<StatusBadge status="CANCELLED" />)
    expect(screen.getByText('Cancelado')).toBeTruthy()
  })

  it('PAID badge has paid kind class', () => {
    const { container } = render(<StatusBadge status="PAID" />)
    expect(container.querySelector('.paid')).toBeTruthy()
  })

  it('PENDING badge has pending kind class', () => {
    const { container } = render(<StatusBadge status="PENDING" />)
    expect(container.querySelector('.pending')).toBeTruthy()
  })

  it('CANCELLED badge has cancelled kind class', () => {
    const { container } = render(<StatusBadge status="CANCELLED" />)
    expect(container.querySelector('.cancelled')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// TypeBadge
// ---------------------------------------------------------------------------

describe('TypeBadge', () => {
  it('renders INCOME label', () => {
    render(<TypeBadge type="INCOME" />)
    expect(screen.getByText('Receita')).toBeTruthy()
  })

  it('renders EXPENSE label', () => {
    render(<TypeBadge type="EXPENSE" />)
    expect(screen.getByText('Despesa')).toBeTruthy()
  })

  it('renders TRANSFER label', () => {
    render(<TypeBadge type="TRANSFER" />)
    expect(screen.getByText('Transferência')).toBeTruthy()
  })

  it('renders REFUND label', () => {
    render(<TypeBadge type="REFUND" />)
    expect(screen.getByText('Reembolso')).toBeTruthy()
  })

  it('renders ADJUSTMENT label', () => {
    render(<TypeBadge type="ADJUSTMENT" />)
    expect(screen.getByText('Ajuste')).toBeTruthy()
  })

  it('INCOME badge has income kind class', () => {
    const { container } = render(<TypeBadge type="INCOME" />)
    expect(container.querySelector('.income')).toBeTruthy()
  })

  it('EXPENSE badge has expense kind class', () => {
    const { container } = render(<TypeBadge type="EXPENSE" />)
    expect(container.querySelector('.expense')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// IconBubble
// ---------------------------------------------------------------------------

describe('IconBubble', () => {
  it('renders the icon-bubble element', () => {
    const { container } = render(<IconBubble />)
    expect(container.querySelector('.icon-bubble')).toBeTruthy()
  })

  it('sets --icon-bg and --icon-fg CSS vars', () => {
    const { container } = render(<IconBubble color="#ff0000" />)
    const el = container.querySelector('.icon-bubble') as HTMLElement
    expect(el.style.getPropertyValue('--icon-bg')).toBeTruthy()
    expect(el.style.getPropertyValue('--icon-fg')).toBeTruthy()
  })

  it('applies size class for non-md sizes', () => {
    const { container } = render(<IconBubble size="lg" />)
    expect(container.querySelector('.icon-bubble')!.className).toContain('lg')
  })

  it('renders glyph content', () => {
    render(<IconBubble glyph={<span data-testid="glyph">G</span>} />)
    expect(screen.getByTestId('glyph')).toBeTruthy()
  })

  it('renders icon component', () => {
    const Icon = () => <svg data-testid="icon" />
    render(<IconBubble icon={Icon} />)
    expect(screen.getByTestId('icon')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

describe('Avatar', () => {
  it('renders initials', () => {
    render(<Avatar name="AB" />)
    expect(screen.getByText('AB')).toBeTruthy()
  })

  it('defaults to CC when no name provided', () => {
    render(<Avatar />)
    expect(screen.getByText('CC')).toBeTruthy()
  })

  it('applies avatar class', () => {
    const { container } = render(<Avatar name="JD" />)
    expect(container.querySelector('.avatar')).toBeTruthy()
  })

  it('applies custom color as background style', () => {
    const { container } = render(<Avatar name="AB" color="#123456" />)
    const el = container.querySelector('.avatar') as HTMLElement
    expect(el.style.background).toBe('rgb(18, 52, 86)')
  })
})

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

describe('Modal', () => {
  it('renders with title', () => {
    render(
      <Modal title="Test Modal" onClose={vi.fn()}>
        <p>content</p>
      </Modal>,
    )
    expect(screen.getByText('Test Modal')).toBeTruthy()
  })

  it('renders children', () => {
    render(
      <Modal title="M" onClose={vi.fn()}>
        <p>modal content</p>
      </Modal>,
    )
    expect(screen.getByText('modal content')).toBeTruthy()
  })

  it('renders subtitle when provided', () => {
    render(
      <Modal title="M" subtitle="Subtitle text" onClose={vi.fn()}>
        <p>c</p>
      </Modal>,
    )
    expect(screen.getByText('Subtitle text')).toBeTruthy()
  })

  it('renders footer when provided', () => {
    render(
      <Modal title="M" onClose={vi.fn()} footer={<button>OK</button>}>
        <p>c</p>
      </Modal>,
    )
    expect(screen.getByRole('button', { name: 'OK' })).toBeTruthy()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Modal title="M" onClose={onClose}>
        <p>c</p>
      </Modal>,
    )
    await user.click(screen.getByTestId('modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Modal title="M" onClose={onClose}>
        <p>c</p>
      </Modal>,
    )
    await user.click(screen.getByRole('button', { name: /fechar/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(
      <Modal title="M" onClose={onClose}>
        <p>c</p>
      </Modal>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when clicking inside modal', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <Modal title="M" onClose={onClose}>
        <p data-testid="inner">content</p>
      </Modal>,
    )
    await user.click(screen.getByTestId('inner'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('has role="dialog" and aria-modal="true"', () => {
    render(
      <Modal title="M" onClose={vi.fn()}>
        <p>c</p>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('applies wide class when wide prop is set', () => {
    render(
      <Modal title="M" onClose={vi.fn()} wide>
        <p>c</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog').className).toContain('wide')
  })
})

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeTruthy()
  })

  it('renders description when provided', () => {
    render(<EmptyState title="Empty" desc="No items found" />)
    expect(screen.getByText('No items found')).toBeTruthy()
  })

  it('renders action when provided', () => {
    render(<EmptyState title="Empty" action={<button>Add item</button>} />)
    expect(screen.getByRole('button', { name: 'Add item' })).toBeTruthy()
  })

  it('renders custom icon component', () => {
    const Icon = () => <svg data-testid="custom-icon" />
    render(<EmptyState title="Empty" icon={Icon} />)
    expect(screen.getByTestId('custom-icon')).toBeTruthy()
  })

  it('renders default icon when no icon provided', () => {
    const { container } = render(<EmptyState title="Empty" />)
    expect(container.querySelector('.ico')).toBeTruthy()
  })

  it('applies empty class', () => {
    const { container } = render(<EmptyState title="Empty" />)
    expect(container.querySelector('.empty')).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

describe('Money', () => {
  it('renders formatted value', () => {
    render(<Money value={1234.56} />)
    expect(screen.getByText(/1\.234/)).toBeTruthy()
  })

  it('shows BRL symbol by default', () => {
    render(<Money value={100} />)
    expect(screen.getByText('R$')).toBeTruthy()
  })

  it('shows USD symbol', () => {
    render(<Money value={100} currency="USD" />)
    expect(screen.getByText('$')).toBeTruthy()
  })

  it('shows negative sign for negative values', () => {
    const { container } = render(<Money value={-50} />)
    expect(container.textContent).toContain('-')
  })

  it('shows plus sign with signed=true for positive values', () => {
    const { container } = render(<Money value={100} signed />)
    expect(container.textContent).toContain('+')
  })

  it('shows minus sign with signed=true for negative values', () => {
    const { container } = render(<Money value={-100} signed />)
    expect(container.textContent).toContain('−')
  })

  it('applies mono class', () => {
    const { container } = render(<Money value={0} />)
    expect(container.querySelector('.mono')).toBeTruthy()
  })

  it('renders decimal part', () => {
    render(<Money value={99.99} />)
    expect(screen.getByText(',99')).toBeTruthy()
  })

  it('formats zero correctly', () => {
    render(<Money value={0} />)
    expect(screen.getByText(',00')).toBeTruthy()
  })
})
