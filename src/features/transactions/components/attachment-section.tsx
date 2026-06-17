import { useRef, useState, type ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { useAttachments } from '@/features/transactions/hooks/use-attachments'
import { useUploadAttachment } from '@/features/transactions/hooks/use-upload-attachment'
import { useDeleteAttachment } from '@/features/transactions/hooks/use-delete-attachment'
import type { Attachment } from '@/features/transactions/types'

const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'image/gif', 'image/webp']

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
      title="Excluir anexo"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="spacer" />
          <Button
            type="button"
            variant="danger"
            disabled={isPending}
            aria-busy={isPending}
            onClick={handleConfirm}
          >
            {isPending ? 'Excluindo…' : 'Excluir'}
          </Button>
        </>
      }
    >
      <p>
        Tem certeza que deseja excluir <strong>{attachment?.fileName}</strong>?
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [clientError, setClientError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null)

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setClientError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setClientError('Tipo de arquivo não suportado. Aceitos: JPEG, PNG, PDF, GIF, WebP.')
      e.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setClientError(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE_MB} MB.`)
      e.target.value = ''
      return
    }

    upload(file, {
      onSuccess: () => {
        e.target.value = ''
      },
    })
  }

  return (
    <section aria-label="Anexos" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Anexos</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-[44px]"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          Enviar
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="hidden"
          aria-label="Enviar anexo"
          onChange={handleFileChange}
        />
      </div>

      {clientError && (
        <p className="text-sm" role="alert" style={{ color: 'var(--expense)' }}>
          {clientError}
        </p>
      )}

      {uploading && (
        <div className="space-y-1" aria-live="polite" aria-label="Progresso do envio">
          <div className="bar" style={{ borderRadius: 9999 }}>
            <i
              style={{
                width: `${progress}%`,
                background: 'var(--accent)',
                transition: 'width 200ms',
              }}
            />
          </div>
          <p className="text-xs text-dim">{progress}% enviado</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Carregando anexos">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-9 rounded animate-pulse"
              style={{ background: 'var(--surface-3)' }}
            />
          ))}
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-dim">Nenhum anexo ainda.</p>
      ) : (
        <ul className="space-y-2" aria-label="Lista de anexos">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between gap-2 rounded px-3 py-2"
              style={{ border: '1px solid var(--border)' }}
            >
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm truncate hover:underline"
              >
                {att.fileName}
              </a>
              <Button
                type="button"
                variant="danger"
                size="sm"
                className="shrink-0"
                aria-label={`Excluir ${att.fileName}`}
                onClick={() => setDeleteTarget(att)}
              >
                Excluir
              </Button>
            </li>
          ))}
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
