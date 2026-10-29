import type { CSSProperties } from 'react'
import {
  CircleDollarSign,
  CreditCard,
  Landmark,
  PiggyBank,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { AccountType } from '@/features/accounts/types'

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: 'Conta corrente',
  SAVINGS: 'Poupança',
  CASH: 'Carteira',
  INVESTMENT: 'Investimento',
  CREDIT: 'Crédito',
  OTHER: 'Outros',
}

/**
 * A conta não guarda cor nem ícone na API: o visual sai do tipo. A cor é um token da
 * paleta categórica (`--cc-cat-N`), então se adapta ao tema claro/escuro.
 */
const ACCOUNT_TYPE_VISUAL: Record<AccountType, { icon: LucideIcon; token: number }> = {
  CHECKING: { icon: Landmark, token: 2 },
  SAVINGS: { icon: PiggyBank, token: 1 },
  CASH: { icon: Wallet, token: 4 },
  INVESTMENT: { icon: TrendingUp, token: 7 },
  CREDIT: { icon: CreditCard, token: 8 },
  OTHER: { icon: CircleDollarSign, token: 10 },
}

export function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPE_LABELS[type as AccountType] ?? type
}

export function accountTypeIcon(type: string): LucideIcon {
  return ACCOUNT_TYPE_VISUAL[type as AccountType]?.icon ?? CircleDollarSign
}

/** Cor sólida do tipo (`rgb(var(--cc-cat-N))`), opcionalmente com opacidade. */
export function accountTypeColor(type: string, alpha?: number): string {
  const token = ACCOUNT_TYPE_VISUAL[type as AccountType]?.token ?? 10
  return alpha === undefined
    ? `rgb(var(--cc-cat-${token}))`
    : `rgb(var(--cc-cat-${token}) / ${alpha})`
}

type BubbleSize = 'sm' | 'md' | 'lg'

const BUBBLE_SIZES: Record<BubbleSize, string> = {
  sm: 'h-8 w-8 rounded-sm',
  md: 'h-10 w-10 rounded-md',
  lg: 'h-12 w-12 rounded-md',
}

interface AccountTypeBubbleProps {
  type: string
  size?: BubbleSize
}

/** Bolha de ícone da conta: fundo = cor do tipo a 18%, ícone na cor cheia. */
export function AccountTypeBubble({ type, size = 'md' }: AccountTypeBubbleProps) {
  const Icon = accountTypeIcon(type)
  const style: CSSProperties = {
    background: accountTypeColor(type, 0.18),
    color: accountTypeColor(type),
  }
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center ${BUBBLE_SIZES[size]}`}
      style={style}
    >
      <Icon size={size === 'sm' ? 16 : 20} />
    </span>
  )
}

/** Saldo para exibição: negativo leva o sinal “−” (U+2212); a cor fica a cargo de quem usa. */
export function formatBalance(value: number, currency = 'BRL'): string {
  const abs = Math.abs(value).toLocaleString('pt-BR', { style: 'currency', currency })
  return value < 0 ? `−${abs}` : abs
}
