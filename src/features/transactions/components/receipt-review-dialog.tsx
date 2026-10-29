import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, FileText, ScanText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoneyInput } from '@/components/ui/money-input'
import { Modal } from '@/components/ui/modal'
import { Field } from '@/components/ui/field'
import { Select } from '@/components/ui/select'
import { SegmentedRadio, type SegmentedOption } from './segmented-radio'
import { submitOnModEnter } from '@/features/transactions/utils/form-shortcuts'
import '@/features/transactions/transactions.css'
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
import { localIsoDate } from '@/lib/local-date'

const RECEIPT_TYPE_LABELS: Record<string, string> = {
  EXPENSE: 'PIX enviado',
  INCOME: 'PIX recebido',
}

const RECEIPT_TYPE_OPTIONS: SegmentedOption[] = RECEIPT_TYPES.map((type) => ({
  value: type,
  label: RECEIPT_TYPE_LABELS[type] ?? type,
  icon:
    type === 'INCOME' ? (
      <ArrowDownLeft size={15} aria-hidden="true" />
    ) : (
      <ArrowUpRight size={15} aria-hidden="true" />
    ),
  activeClass: type === 'INCOME' ? 'peer-checked:text-income' : 'peer-checked:text-expense',
}))

/** Envolve um campo preenchido pela leitura: borda `info` até o usuário editá-lo. */
function AutoFilled({ active, children }: { active: boolean; children: ReactNode }) {
  return <div className={active ? 'tx-autofilled' : undefined}>{children}</div>
}

/** Miniatura da foto enviada (só imagens; PDF mostra o ícone). */
function useImagePreview(file: File | null): string | null {
  const url = useMemo(
    () => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null),
    [file],
  )
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])
  return url
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
  return localIsoDate()
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
  const receiptType = form.watch('type')
  const imageUrl = useImagePreview(open ? file : null)

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
  const dirty = form.formState.dirtyFields
  // Preenchido pela leitura e ainda não tocado pelo usuário.
  const auto = {
    amount: Boolean(preview?.amount) && !dirty.amount,
    description:
      Boolean(preview?.suggestedDescription ?? preview?.recipientName) && !dirty.description,
    competenceDate: Boolean(preview?.date) && !dirty.competenceDate,
    categoryId: Boolean(preview?.suggestedCategoryId) && !dirty.categoryId,
  }
  const anyAuto = Object.values(auto).some(Boolean)

  return (
    <Modal
      panel
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
            disabled={isAnalyzing}
            loading={isPending}
          >
            {isPending ? 'Lançando…' : 'Confirmar lançamento'}
          </Button>
        </>
      }
    >
      {isAnalyzing ? (
        <div
          className="flex flex-col items-center gap-4 py-8 text-center"
          aria-busy="true"
          aria-label="Lendo comprovante"
        >
          <div className="relative h-36 w-28 overflow-hidden rounded-lg border border-border bg-surface-2">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="size-full object-cover opacity-70" />
            ) : (
              <FileText
                size={36}
                aria-hidden="true"
                className="absolute inset-0 m-auto text-fg-subtle"
              />
            )}
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-1/2 h-[3px] bg-brand shadow-brand motion-safe:animate-pulse"
            />
          </div>
          <span
            aria-hidden="true"
            className="size-7 rounded-full border-[3px] border-surface-3 border-t-brand motion-safe:animate-spin"
          />
          <p className="font-display text-h2">Lendo o comprovante…</p>
          <p className="max-w-[260px] text-body-sm text-fg-muted">
            Identificando valor, data e destinatário.
          </p>
        </div>
      ) : (
        <form
          id="receipt-review-form"
          onSubmit={form.handleSubmit(onSubmit)}
          onKeyDown={submitOnModEnter}
          noValidate
          className="flex flex-col gap-4"
        >
          {form.formState.errors.root && (
            <div role="alert" className="err">
              {form.formState.errors.root.message}
            </div>
          )}

          {/* Cabeçalho da revisão: foto + o que veio da leitura */}
          <div className="flex items-center gap-3 rounded-xl bg-info-soft p-3">
            <div className="grid h-[72px] w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-surface-2">
              {imageUrl ? (
                <img src={imageUrl} alt="Foto do comprovante" className="size-full object-cover" />
              ) : (
                <FileText size={22} aria-hidden="true" className="text-fg-muted" />
              )}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex items-center gap-1.5 text-body font-semibold text-info">
                <ScanText size={16} aria-hidden="true" />
                Lido do comprovante
              </span>
              <span className="text-body-sm text-fg-muted">
                Confira os campos antes de salvar.
                {anyAuto && ' Campos em destaque foram preenchidos automaticamente.'}
              </span>
              <span className="truncate font-mono text-caption text-fg-subtle">{file.name}</span>
            </div>
          </div>

          {preview?.duplicate && (
            <div
              role="alert"
              className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-overdue-soft px-3 py-2.5 text-body-sm text-overdue"
            >
              <AlertTriangle size={16} aria-hidden="true" className="shrink-0" />
              Este comprovante já parece ter sido lançado.
              {preview.duplicateTransactionId && (
                <Link
                  className="font-semibold underline"
                  to={ROUTES.TRANSACTION_DETAIL.replace(':id', preview.duplicateTransactionId)}
                >
                  Ver transação existente
                </Link>
              )}
            </div>
          )}

          {unreadFields.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-pending-soft px-3 py-2.5 text-body-sm text-pending">
              <AlertTriangle size={16} className="mt-px shrink-0" aria-hidden="true" />
              <span>
                Não foi possível ler{' '}
                {unreadFields.map((f) => UNREAD_FIELD_LABELS[f] ?? f).join(', ')} do comprovante.
                Confira os campos abaixo.
              </span>
            </div>
          )}

          <SegmentedRadio
            legend="Tipo"
            options={RECEIPT_TYPE_OPTIONS}
            registration={form.register('type')}
            error={form.formState.errors.type?.message}
          />

          <div className="[display:grid] grid-cols-1 gap-4 md:grid-cols-2">
            <AutoFilled active={auto.amount}>
              <div className="tx-amount" data-positive={receiptType === 'INCOME'}>
                <Field
                  label="Valor"
                  required
                  error={form.formState.errors.amount?.message}
                  hint={!preview?.amount ? 'Não lido do comprovante' : undefined}
                >
                  <MoneyInput
                    placeholder="0,00"
                    currency={receiptType === 'INCOME' ? '+ R$' : '− R$'}
                    {...form.register('amount')}
                  />
                </Field>
              </div>
            </AutoFilled>

            <AutoFilled active={auto.description}>
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
            </AutoFilled>

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

            <AutoFilled active={auto.competenceDate}>
              <Field
                label="Data"
                required
                error={form.formState.errors.competenceDate?.message}
                hint={!preview?.date ? 'Não lida do comprovante' : undefined}
              >
                <Input type="date" {...form.register('competenceDate')} />
              </Field>
            </AutoFilled>
          </div>

          <AutoFilled active={auto.categoryId}>
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
          </AutoFilled>

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
