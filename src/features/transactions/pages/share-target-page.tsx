import { useEffect, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, FileUp, ReceiptText } from 'lucide-react'
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

  function handlePick(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    e.target.value = ''
    if (picked) setFile(picked)
  }

  function handleClose() {
    setFile(null)
    navigate(ROUTES.TRANSACTIONS)
  }

  if (!checkedShare) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center"
        aria-busy="true"
        aria-label="Verificando comprovante compartilhado"
      >
        <div className="relative grid h-36 w-28 place-items-center overflow-hidden rounded-lg border border-border bg-surface-2">
          <ReceiptText size={36} aria-hidden="true" className="text-fg-subtle" />
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-[45%] h-[3px] bg-brand shadow-brand motion-safe:animate-pulse"
          />
        </div>
        <span
          aria-hidden="true"
          className="size-7 rounded-full border-[3px] border-surface-3 border-t-brand motion-safe:animate-spin"
        />
        <p className="font-display text-h2">Verificando comprovante compartilhado</p>
        <p className="max-w-[280px] text-body-sm text-fg-muted">
          Recebemos a imagem do seu app do banco. Em instantes você revisa os dados.
        </p>
      </div>
    )
  }

  const pickClass =
    'flex min-h-[54px] cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-body font-semibold focus-within:ring-2 focus-within:ring-info'

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4">
      <h1 className="font-display text-h1 font-extrabold">Lançar comprovante</h1>

      {!file && (
        <div className="flex flex-col gap-3">
          <div className="flex aspect-[3/4] max-h-[340px] flex-col items-center justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-border-strong px-6 text-center text-body-sm text-fg-muted">
            <ReceiptText size={40} aria-hidden="true" className="text-brand-text" />
            <p>
              Compartilhe um comprovante de PIX do app do seu banco, ou fotografe / selecione o
              arquivo aqui. A leitura preenche os campos para você revisar.
            </p>
          </div>

          <label className={`${pickClass} bg-brand text-brand-ink md:hidden`}>
            <Camera size={18} aria-hidden="true" />
            Tirar foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={handlePick}
            />
          </label>
          <label
            className={`${pickClass} border border-border-strong text-fg max-md:bg-transparent md:bg-brand md:text-brand-ink md:border-0`}
          >
            <FileUp size={18} aria-hidden="true" />
            Selecionar comprovante
            <input
              type="file"
              accept="application/pdf,image/*"
              aria-label="Comprovante"
              className="sr-only"
              onChange={handlePick}
            />
          </label>
          <Button
            type="button"
            variant="ghost"
            className="min-h-touch"
            onClick={() => navigate(ROUTES.TRANSACTIONS)}
          >
            Cancelar
          </Button>
        </div>
      )}

      <ReceiptReviewDialog open={file !== null} file={file} onClose={handleClose} />
    </div>
  )
}
