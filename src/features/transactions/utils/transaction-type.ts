import type { ComponentType } from 'react'
import { ArrowDownLeft, ArrowUpRight, RotateCcw, ArrowLeftRight, Scale } from 'lucide-react'
import type { BadgeKind } from '@/components/ui/badge'
import type { TransactionType } from '@/features/transactions/types'

export type TransactionTypeIcon = ComponentType<{ size?: number; stroke?: number }>

function asIcon(i: unknown): TransactionTypeIcon {
  return i as TransactionTypeIcon
}

interface TransactionTypeDisplay {
  icon: TransactionTypeIcon
  label: string
  /**
   * Cor fixa do tipo, ou `null` quando ela depende do sinal do valor —
   * caso do MANUAL_ADJUSTMENT, que o backend grava como delta assinado
   * (positivo aumenta o saldo, negativo diminui).
   */
  color: string | null
  /** Mesma regra da cor: `null` quando o badge depende do sinal do valor. */
  badgeKind: BadgeKind | null
}

/**
 * Fonte única de apresentação por tipo de transação.
 *
 * O `Record<TransactionType, …>` é proposital: acrescentar um valor ao enum
 * `domain/entity/TransactionType.java` (e ao type `TransactionType`) quebra a
 * compilação aqui, em vez de cair silenciosamente num fallback de EXPENSE.
 */
export const TRANSACTION_TYPE_DISPLAY: Record<TransactionType, TransactionTypeDisplay> = {
  INCOME: {
    icon: asIcon(ArrowDownLeft),
    label: 'Receita',
    color: 'var(--income)',
    badgeKind: 'income',
  },
  EXPENSE: {
    icon: asIcon(ArrowUpRight),
    label: 'Despesa',
    color: 'var(--expense)',
    badgeKind: 'expense',
  },
  REFUND: {
    icon: asIcon(RotateCcw),
    label: 'Reembolso',
    color: 'var(--income)',
    badgeKind: 'info',
  },
  TRANSFER: {
    icon: asIcon(ArrowLeftRight),
    label: 'Transferência',
    color: 'var(--info)',
    badgeKind: 'info',
  },
  MANUAL_ADJUSTMENT: {
    icon: asIcon(Scale),
    label: 'Ajuste',
    color: null,
    badgeKind: null,
  },
}

/** Indica se o valor entra a favor do usuário — define o sinal e a cor exibidos. */
export function isPositiveTransaction(type: TransactionType, amount: number): boolean {
  if (type === 'MANUAL_ADJUSTMENT') return amount >= 0
  return type === 'INCOME' || type === 'REFUND'
}

/** Cor do ícone/valor, resolvendo pelo sinal os tipos que não têm cor fixa. */
export function transactionTypeColor(type: TransactionType, amount: number): string {
  return (
    TRANSACTION_TYPE_DISPLAY[type].color ??
    (isPositiveTransaction(type, amount) ? 'var(--income)' : 'var(--expense)')
  )
}

/**
 * `kind` do badge de tipo. Sem `amount`, tipos que dependem do sinal caem no
 * neutro `info` — nunca em `expense`, que é o que exibia crédito como débito.
 */
export function transactionTypeBadgeKind(type: TransactionType, amount?: number): BadgeKind {
  const { badgeKind } = TRANSACTION_TYPE_DISPLAY[type]
  if (badgeKind) return badgeKind
  if (amount === undefined) return 'info'
  return isPositiveTransaction(type, amount) ? 'income' : 'expense'
}
