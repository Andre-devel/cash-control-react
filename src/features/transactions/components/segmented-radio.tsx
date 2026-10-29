import type { ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

export interface SegmentedOption {
  value: string
  label: string
  icon?: ReactNode
  /** Classe de cor do texto quando marcado (ex.: `text-income`). */
  activeClass?: string
}

interface SegmentedRadioProps {
  legend: string
  options: readonly SegmentedOption[]
  /** Retorno de `form.register(name)` — aplicado a cada rádio, como pede o react-hook-form. */
  registration: UseFormRegisterReturn
  error?: string
  className?: string
}

/**
 * Grupo de rádios nativos com cara de controle segmentado (Tipo, Status). Rádio nativo
 * mantém teclado (setas), leitor de tela e o `register` do react-hook-form sem adaptação.
 */
export function SegmentedRadio({
  legend,
  options,
  registration,
  error,
  className = '',
}: SegmentedRadioProps) {
  return (
    <fieldset className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <legend className="lbl mb-1.5">{legend}</legend>
      <div className="flex rounded-lg bg-surface-2 p-[3px]">
        {options.map((o) => (
          <label key={o.value} className="relative flex flex-1 cursor-pointer">
            <input
              type="radio"
              value={o.value}
              className="peer absolute inset-0 cursor-pointer opacity-0"
              aria-invalid={error ? true : undefined}
              {...registration}
            />
            <span
              className={`flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-md px-2 text-body-sm font-semibold text-fg-muted transition-colors peer-checked:bg-surface-1 peer-checked:shadow-1 peer-focus-visible:ring-2 peer-focus-visible:ring-info motion-reduce:transition-none ${
                o.activeClass ?? 'peer-checked:text-fg'
              }`}
            >
              {o.icon}
              {o.label}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <span role="alert" className="text-caption text-expense">
          {error}
        </span>
      )}
    </fieldset>
  )
}
