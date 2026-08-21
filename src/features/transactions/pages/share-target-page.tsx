import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { FilePicker } from '@/components/ui/file-picker'
import { Button } from '@/components/ui/button'
import { ReceiptReviewDialog } from '@/features/transactions/components/receipt-review-dialog'
import { takeSharedFile } from '@/app/pwa/shared-file-store'
import { ROUTES } from '@/app/router/routes'

/**
 * Destino do Web Share Target (`share_target.action` no manifest) e também acessível
 * direto pelo menu, para quem prefere anexar o comprovante à mão em vez de compartilhar
 * do app do banco.
 *
 * O arquivo não vem pela navegação: o service worker (`src/sw.ts`) já o estacionou no
 * IndexedDB antes do redirect chegar aqui — inclusive quando a navegação passou por
 * `/login` no meio do caminho. `takeSharedFile` é quem o recupera.
 */
export default function ShareTargetPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [checkedShare, setCheckedShare] = useState(false)

  useEffect(() => {
    let cancelled = false
    void takeSharedFile().then((shared) => {
      if (cancelled) return
      if (shared) setFile(shared.file)
      setCheckedShare(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function handleClose() {
    setFile(null)
    navigate(ROUTES.TRANSACTIONS)
  }

  if (!checkedShare) {
    return (
      <div
        className="flex items-center justify-center min-h-[50vh]"
        aria-busy="true"
        aria-label="Verificando comprovante compartilhado"
      >
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight">Lançar comprovante</h1>

      {!file && (
        <div className="col gap-4">
          <p className="text-sm text-dim">
            Compartilhe um comprovante de PIX do app do seu banco, ou selecione o arquivo aqui.
          </p>
          <FilePicker
            accept="application/pdf,image/*"
            aria-label="Comprovante"
            file={file}
            onFileChange={setFile}
            placeholder="Selecionar comprovante"
          />
          <Button type="button" variant="ghost" onClick={() => navigate(ROUTES.TRANSACTIONS)}>
            <Upload size={14} aria-hidden="true" style={{ marginRight: 6 }} />
            Cancelar
          </Button>
        </div>
      )}

      <ReceiptReviewDialog open={file !== null} file={file} onClose={handleClose} />
    </div>
  )
}
