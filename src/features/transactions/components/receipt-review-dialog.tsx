import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { AlertTriangle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CategoryPickerCombobox } from '@/features/categories/components/category-picker-combobox'
import { useCategories } from '@/features/categories/hooks/use-categories'
import { useAccounts } from '@/features/accounts/hooks/use-accounts'
import { useReceiptPreview } from '@/features/transactions/hooks/use-receipt-preview'
import { useCommitReceipt } from '@/features/transactions/hooks/use-commit-receipt'
import { setFormErrors } from '@/lib/form-errors'
import { ROUTES } from '@/app/router/routes'
import {
  receiptReviewSchema,
  RECEIPT_TYPES,
  type ReceiptReviewFormValues,
} from '@/features/transactions/schemas/receipt-review.schema'
import type { ReceiptPreviewResponse } from '@/features/transactions/types'

const RECEIPT_TYPE_LABELS: Record<string, string> = {
  EXPENSE: 'PIX enviado',
  INCOME: 'PIX recebido',
}

const UNREAD_FIELD_LABELS: Record<string, string> = {
  valor: 'valor',
  data: 'data',
  destinatário: 'destinatário',
}

interface ReceiptReviewDialogProps {
  open: boolean
  file: File | null
  onClose: () => void
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0]
}

function defaultValuesFrom(preview: ReceiptPreviewResponse | null): ReceiptReviewFormValues {
  return {
    accountId: '',
    type: 'EXPENSE',
    amount: preview?.amount ?? '0.00',
    description: preview?.suggestedDescription ?? preview?.recipientName ?? '',
    competenceDate: preview?.date ?? todayIso(),
    categoryId: preview?.suggestedCategoryId ?? '',
  }
}

/**
 * Revisão de um comprovante de PIX antes de virar transação — o comprovante é sempre
 * "melhor esforço" (ver {@link ParsedReceipt} no backend), então esta tela nunca grava
 * direto: mostra o que foi lido, o que não foi, e deixa o usuário confirmar ou corrigir.
 *
 * Mesmo padrão de revisão do {@code import-fatura-dialog}: prévia primeiro, edição do
 * usuário depois, confirmação por último. A diferença é que aqui a "prévia" é sempre uma
 * linha só.
 */
export function ReceiptReviewDialog({ open, file, onClose }: ReceiptReviewDialogProps) {
  const { data: categories = [] } = useCategories()
  const { data: allAccounts = [] } = useAccounts()
  const accounts = allAccounts.filter((a) => !a.archivedAt)

  const [preview, setPreview] = useState<ReceiptPreviewResponse | null>(null)
  const { mutate: analyze, isPending: isAnalyzing, reset: resetAnalyze } = useReceiptPreview()

  const form = useForm<ReceiptReviewFormValues>({
    resolver: zodResolver(receiptReviewSchema),
    defaultValues: defaultValuesFrom(null),
  })

  const { mutate: commit, isPending: isCommitting } = useCommitReceipt({
    onFieldError: (error) => setFormErrors(error, form.setError),
  })

  const description = form.watch('description')

  useEffect(() => {
    if (!open || !file) return
    setPreview(null)
    form.reset(defaultValuesFrom(null))
    analyze(
      { file },
      {
        onSuccess: (result) => {
          setPreview(result)
          form.reset(defaultValuesFrom(result))
        },
      },
    )
    // Só ao abrir com um arquivo novo — reanalisar a cada tecla do formulário destruiria a edição do usuário.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, file])

  function handleClose() {
    resetAnalyze()
    setPreview(null)
    form.reset(defaultValuesFrom(null))
    onClose()
  }

  function onSubmit(data: ReceiptReviewFormValues) {
    if (!file) return

    // O nome lido do comprovante, antes de qualquer edição — é dele que o servidor deriva
    // o apelido a lembrar. Sem leitura, não há "original" para comparar: usar a própria
    // descrição final é o que faz o servidor não gravar apelido nenhum, o comportamento
    // certo quando o usuário digitou tudo à mão.
    const originalDescription = preview?.recipientName ?? data.description

    // externalRef normalmente vem da prévia (endToEndId do PIX, ou um hash de
    // data+valor+destinatário). Quando nada foi lido, não há identidade nenhuma para
    // hashear — um id aleatório evita bloquear o lançamento, ao custo de não detectar
    // duplicata neste caso raro (comprovante ilegível, tudo preenchido à mão).
    const externalRef = preview?.externalRef ?? crypto.randomUUID()

    commit(
      {
        data: {
          accountId: data.accountId,
          externalRef,
          type: data.type,
          amount: data.amount,
          description: data.description,
          originalDescription,
          competenceDate: data.competenceDate,
          categoryId: data.categoryId || undefined,
        },
        file,
      },
      { onSuccess: handleClose },
    )
  }

  if (!open || !file) return null

  const unreadFields = preview?.unreadFields ?? []
  const isPending = isCommitting

  return (
    <Modal
      title="Revisar comprovante"
      subtitle={file.name}
      onClose={handleClose}
      wide
      footer={
        <>
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="submit"
            form="receipt-review-form"
            variant="primary"
            disabled={isAnalyzing || isPending}
            aria-busy={isPending}
          >
            {isPending ? 'Lançando…' : 'Confirmar lançamento'}
          </Button>
        </>
      }
    >
      {isAnalyzing ? (
        <div className="col gap-2" aria-busy="true" aria-label="Lendo comprovante">
          <div className="h-9 rounded animate-pulse" style={{ background: 'var(--surface-3)' }} />
          <div className="h-9 rounded animate-pulse" style={{ background: 'var(--surface-3)' }} />
          <p className="text-sm text-dim">Lendo o comprovante…</p>
        </div>
      ) : (
        <form
          id="receipt-review-form"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="col gap-4"
        >
          {form.formState.errors.root && (
            <div role="alert" className="err">
              {form.formState.errors.root.message}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <FileText size={14} aria-hidden="true" />
            <span className="text-dim">{file.name}</span>
          </div>

          {preview?.duplicate && (
            <div role="alert" className="err">
              Este comprovante já parece ter sido lançado.{' '}
              {preview.duplicateTransactionId && (
                <Link to={ROUTES.TRANSACTION_DETAIL.replace(':id', preview.duplicateTransactionId)}>
                  Ver transação existente
                </Link>
              )}
            </div>
          )}

          {unreadFields.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 8,
                fontSize: 12,
                color: 'var(--text-dim)',
                alignItems: 'flex-start',
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
              <span>
                Não foi possível ler{' '}
                {unreadFields.map((f) => UNREAD_FIELD_LABELS[f] ?? f).join(', ')} do comprovante.
                Confira os campos abaixo.
              </span>
            </div>
          )}

          <Field label="Tipo" error={form.formState.errors.type?.message}>
            <Select aria-label="Tipo" {...form.register('type')}>
              {RECEIPT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {RECEIPT_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Conta" required error={form.formState.errors.accountId?.message}>
            <Select aria-label="Conta" {...form.register('accountId')}>
              <option value="">Selecionar conta</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Valor"
            required
            error={form.formState.errors.amount?.message}
            hint={!preview?.amount ? 'Não lido do comprovante' : undefined}
          >
            <MoneyInput placeholder="Ex: 150,75" {...form.register('amount')} />
          </Field>

          <Field
            label="Descrição"
            required
            error={form.formState.errors.description?.message}
            hint={
              preview?.suggestedDescription
                ? 'Apelido lembrado deste destinatário'
                : !preview?.recipientName
                  ? 'Não lido do comprovante'
                  : undefined
            }
          >
            <Input placeholder="Ex: Padaria São João" {...form.register('description')} />
          </Field>

          <Field
            label="Data"
            required
            error={form.formState.errors.competenceDate?.message}
            hint={!preview?.date ? 'Não lida do comprovante' : undefined}
          >
            <Input type="date" {...form.register('competenceDate')} />
          </Field>

          <Controller
            control={form.control}
            name="categoryId"
            render={({ field, fieldState }) => (
              <Field label="Categoria" error={fieldState.error?.message}>
                <CategoryPickerCombobox
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  categories={categories}
                  description={description}
                  aria-label="Categoria"
                />
              </Field>
            )}
          />

          {preview?.suggestionSource && preview.suggestionSource !== 'NONE' && (
            <Badge kind="muted" square dot={false}>
              {preview.suggestionSource === 'RULE'
                ? 'categoria por regra'
                : 'categoria pelo histórico'}
            </Badge>
          )}
        </form>
      )}
    </Modal>
  )
}
