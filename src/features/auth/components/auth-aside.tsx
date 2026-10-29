import { Camera, FileUp, Layers } from 'lucide-react'
import { AuthBrand } from './auth-brand'

const FEATURES = [
  { icon: Camera, text: 'Comprovante PIX vira lançamento com uma foto' },
  { icon: FileUp, text: 'Importe extratos e faturas com categorias sugeridas' },
  { icon: Layers, text: 'Parcelas, faturas e recorrências sob controle' },
] as const

/** Barras decorativas do "resumo do mês" — só tokens, sem dados reais. */
const BARS = [
  { income: 64, expense: 48 },
  { income: 72, expense: 58 },
  { income: 60, expense: 66 },
  { income: 80, expense: 52 },
  { income: 70, expense: 44 },
  { income: 88, expense: 56 },
] as const

function AsidePreview() {
  return (
    <div
      aria-hidden="true"
      className="mt-auto -mb-14 flex flex-col gap-4 rounded-t-2xl border border-b-0 border-border bg-bg/60 p-6 shadow-3"
    >
      <div className="flex items-center gap-3">
        <span className="h-2.5 w-24 rounded-full bg-border-strong" />
        <span className="ml-auto h-6 w-16 rounded-full bg-brand-soft" />
      </div>
      <div className="flex gap-3">
        {['bg-fg/70', 'bg-income/70', 'bg-expense/70'].map((tone) => (
          <div
            key={tone}
            className="flex flex-1 flex-col gap-2 rounded-lg border border-border bg-surface-2 p-3"
          >
            <span className="h-1.5 w-12 rounded-full bg-border-strong" />
            <span className={`h-3.5 w-20 rounded-sm ${tone}`} />
          </div>
        ))}
      </div>
      <div className="flex h-28 items-end gap-3 rounded-lg border border-border bg-surface-2 px-4 pb-3 pt-4">
        {BARS.map((bar, i) => (
          <div key={i} className="flex flex-1 items-end justify-center gap-1">
            <span className="w-3 rounded-t-xs bg-income/80" style={{ height: `${bar.income}%` }} />
            <span
              className="w-3 rounded-t-xs bg-expense/80"
              style={{ height: `${bar.expense}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Painel de apresentação do login/cadastro no desktop (oculto abaixo de 1024 px). */
export function AuthAside() {
  return (
    <aside className="auth-aside" aria-label="Sobre o Cash Control">
      <AuthBrand />
      <p className="m-0 max-w-[560px] font-display text-[3.5rem] font-extrabold leading-[1.02] tracking-[-0.02em] [text-wrap:balance]">
        Quanto gastei, quanto devo, o que vence.
      </p>
      <ul className="m-0 flex max-w-[480px] list-none flex-col gap-3.5 p-0">
        {FEATURES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-base font-medium leading-snug">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-md bg-brand-soft text-brand-text">
              <Icon size={18} aria-hidden="true" />
            </span>
            {text}
          </li>
        ))}
      </ul>
      <AsidePreview />
    </aside>
  )
}
