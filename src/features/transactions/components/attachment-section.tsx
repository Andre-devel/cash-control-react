import { useState, type ChangeEvent, type DragEvent } from 'react'
import { Download, FileImage, FileText, Paperclip, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { saveBlob, toast } from '@/lib'
import { downloadAttachment } from '@/features/transactions/api/transactions.api'
import { useAttachments } from '@/features/transactions/hooks/use-attachments'
import { useUploadAttachment } from '@/features/transactions/hooks/use-upload-attachment'
import { useDeleteAttachment } from '@/features/transactions/hooks/use-delete-attachment'
import type { Attachment } from '@/features/transactions/types'

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
// Mesma lista que a API aceita (AttachmentServiceImpl.ALLOWED_MIME_TYPES).
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
}

interface DeleteAttachmentDialogProps {
  attachment: Attachment | null
  open: boolean
  transactionId: string
  onClose: () => void
}

function DeleteAttachmentDialog({
  attachment,
  open,
  transactionId,
  onClose,
}: DeleteAttachmentDialogProps) {
  const { mutate: deleteAttachment, isPending } = useDeleteAttachment(transactionId)

  function handleConfirm() {
    if (!attachment) return
    deleteAttachment(attachment.id, { onSuccess: onClose })
  }

  if (!open) return null

  return (
    <Modal
      alert
      title="Excluir anexo"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button type="button" variant="danger" loading={isPending} onClick={handleConfirm}>
            {isPending ? 'Excluindo…' : 'Excluir'}
          </Button>
        </>
      }
    >
      <p>
        Tem certeza que deseja excluir <strong>{attachment?.originalFilename}</strong>?
      </p>
    </Modal>
  )
}

interface AttachmentSectionProps {
  transactionId: string
}

export function AttachmentSection({ transactionId }: AttachmentSectionProps) {
  const { data: attachments = [], isLoading } = useAttachments(transactionId)
  const { mutate: upload, isPending: uploading, progress } = useUploadAttachment(transactionId)
  const [clientError, setClientError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null)
  const [dragOver, setDragOver] = useState(false)

  function handleDownload(att: Attachment) {
    downloadAttachment(transactionId, att.id)
      .then((blob) => saveBlob(blob, att.originalFilename))
      .catch(() => toast.error('Não foi possível baixar o anexo.'))
  }

  /** Valida e envia; `reset` limpa o input para permitir reenviar o mesmo arquivo. */
  function handleFile(file: File | undefined, reset: () => void) {
    if (!file) return

    setClientError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setClientError('Tipo de arquivo não suportado. Aceitos: JPEG, PNG e PDF.')
      reset()
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setClientError(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE_MB} MB.`)
      reset()
      return
    }

    upload(file, { onSuccess: reset })
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target
    handleFile(input.files?.[0], () => {
      input.value = ''
    })
  }

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setDragOver(false)
    if (uploading) return
    handleFile(e.dataTransfer.files?.[0], () => {})
  }

  return (
    <section
      aria-labelledby="attachments-h"
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface-1 p-5 md:p-6"
    >
      <div className="flex items-center gap-2">
        <Paperclip size={16} aria-hidden="true" className="text-fg-muted" />
        <h2 id="attachments-h" className="font-display text-h2">
          Anexos
        </h2>
        {attachments.length > 0 && (
          <span className="text-body-sm text-fg-muted">· {attachments.length}</span>
        )}
      </div>

      {/* A zona inteira é o <label> do input: clique, toque, teclado (foco no input) e arrastar. */}
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center transition-colors focus-within:ring-2 focus-within:ring-info motion-reduce:transition-none ${
          dragOver ? 'border-brand bg-brand/10' : 'border-border-strong hover:bg-surface-2'
        }${uploading ? ' pointer-events-none opacity-60' : ''}`}
      >
        <UploadCloud size={22} aria-hidden="true" className="text-brand-text" />
        <span className="text-body font-semibold">
          <span className="hidden md:inline">Arraste ou escolha um arquivo</span>
          <span className="md:hidden">Toque para escolher um arquivo</span>
        </span>
        <span className="text-caption text-fg-muted">
          PDF, JPG ou PNG · até {MAX_FILE_SIZE_MB} MB
        </span>
        <input
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="sr-only"
          aria-label="Enviar anexo"
          disabled={uploading}
          onChange={handleFileChange}
        />
      </label>

      {clientError && (
        <p className="text-body-sm text-expense" role="alert">
          {clientError}
        </p>
      )}

      {uploading && (
        <div className="flex flex-col gap-1" aria-live="polite">
          <div
            role="progressbar"
            aria-label="Progresso do envio"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            className="h-2 overflow-hidden rounded-full bg-surface-3"
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-200 motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-caption text-fg-muted">{progress}% enviado</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Carregando anexos">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-surface-3 motion-reduce:animate-none"
            />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-body-sm text-fg-muted">Nenhum anexo ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Lista de anexos">
          {attachments.map((att) => {
            const Icon = att.mimeType.startsWith('image/') ? FileImage : FileText
            return (
              <li
                key={att.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-info-soft text-info">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <button
                  type="button"
                  className="flex min-h-touch min-w-0 flex-1 flex-col justify-center rounded-xs text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info"
                  title={`Baixar ${att.originalFilename}`}
                  onClick={() => handleDownload(att)}
                >
                  <span className="truncate text-body hover:underline">{att.originalFilename}</span>
                  <span className="flex items-center gap-1 text-caption text-fg-muted">
                    <Download size={12} aria-hidden="true" />
                    {formatFileSize(att.fileSizeBytes)} · baixar
                  </span>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="min-h-touch min-w-touch shrink-0 text-expense"
                  aria-label={`Excluir ${att.originalFilename}`}
                  onClick={() => setDeleteTarget(att)}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <DeleteAttachmentDialog
        attachment={deleteTarget}
        open={deleteTarget !== null}
        transactionId={transactionId}
        onClose={() => setDeleteTarget(null)}
      />
    </section>
  )
}
