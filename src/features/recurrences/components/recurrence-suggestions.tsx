import { useState } from 'react'
import { Plus, Repeat, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/ui/money'
import { formatMoneyInput } from '@/lib/money'
import { localIsoDate, parseLocalDate } from '@/lib/local-date'
import {
  useDismissRecurrenceSuggestion,
  useRecurrenceSuggestions,
} from '@/features/recurrences/hooks/use-recurrence-suggestions'
import { CreateRecurrenceDialog } from '@/features/recurrences/components/create-recurrence-dialog'
import type { CreateRecurrenceFormValues } from '@/features/recurrences/schemas/create-recurrence.schema'
import type { RecurrenceSuggestion } from '@/features/recurrences/types'

/**
 * Primeiro vencimento depois do último lançamento: o mesmo dia no mês seguinte (ou o último dia,
 * se o mês for mais curto). O último já foi pago; começar nele criaria uma ocorrência duplicada.
 */
export function nextSuggestionDate(suggestion: RecurrenceSuggestion): string {
  const last = parseLocalDate(suggestion.lastDate)
  const year = last.getFullYear()
  const month = last.getMonth() + 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return localIsoDate(new Date(year, month, Math.min(suggestion.dayOfMonth, daysInMonth)))
}

/** Valores do formulário de nova recorrência a partir da sugestão. */
export function suggestionToFormValues(
  suggestion: RecurrenceSuggestion,
): Partial<CreateRecurrenceFormValues> {
  return {
    description: suggestion.description,
    amount: formatMoneyInput(suggestion.amount),
    type: 'EXPENSE',
    frequency: 'MONTHLY',
    accountId: suggestion.accountId ?? '',
    categoryId: suggestion.categoryId ?? '',
    startDate: nextSuggestionDate(suggestion),
    paymentMethod: suggestion.creditCardId ? 'CREDIT_CARD' : 'OTHER',
    creditCardId: suggestion.creditCardId ?? '',
  }
}

interface SuggestionCardProps {
  suggestion: RecurrenceSuggestion
  onCreate: (suggestion: RecurrenceSuggestion) => void
  onDismiss: (suggestion: RecurrenceSuggestion) => void
  dismissing: boolean
}

function SuggestionCard({ suggestion, onCreate, onDismiss, dismissing }: SuggestionCardProps) {
  const titleId = `suggestion-${suggestion.pattern}-title`
  return (
    <li
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-xl border border-dashed border-border-strong bg-surface-1 p-4"
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-info-soft text-info"
          aria-hidden="true"
        >
          <Repeat size={18} />
        </span>
        <p id={titleId} className="min-w-0 flex-1 text-body-sm text-fg">
          <span className="font-semibold">{suggestion.description}</span>
          {' · '}
          <Money value={parseFloat(suggestion.amount)} />
          {` todo dia ${suggestion.dayOfMonth} · ${suggestion.months} ${
            suggestion.months === 1 ? 'mês' : 'meses'
          }`}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          leading={<Plus size={14} />}
          onClick={() => onCreate(suggestion)}
        >
          Criar recorrência
        </Button>
        <Button
          variant="ghost"
          size="sm"
          leading={<X size={14} />}
          disabled={dismissing}
          onClick={() => onDismiss(suggestion)}
        >
          Ignorar
        </Button>
      </div>
    </li>
  )
}

/**
 * "Parece recorrente": despesas que se repetem no histórico sem regra cadastrada. Some quando não
 * há sugestão (ou a busca falha: é um atalho, não informação que a página precise).
 */
export function RecurrenceSuggestions() {
  const { data: suggestions = [] } = useRecurrenceSuggestions()
  const { mutate: dismiss, isPending, variables } = useDismissRecurrenceSuggestion()
  const [target, setTarget] = useState<RecurrenceSuggestion | null>(null)

  if (suggestions.length === 0 && !target) return null

  return (
    <>
      {suggestions.length > 0 && (
        <section aria-labelledby="recurrence-suggestions-title" className="mb-4">
          <h2
            id="recurrence-suggestions-title"
            className="mb-2 text-overline uppercase text-fg-muted"
          >
            Parece recorrente
          </h2>
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.pattern}
                suggestion={suggestion}
                onCreate={setTarget}
                onDismiss={(s) => dismiss(s.pattern)}
                dismissing={isPending && variables === suggestion.pattern}
              />
            ))}
          </ul>
        </section>
      )}

      {target && (
        <CreateRecurrenceDialog
          key={target.pattern}
          open
          onClose={() => setTarget(null)}
          initialValues={suggestionToFormValues(target)}
        />
      )}
    </>
  )
}
