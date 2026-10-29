import { Circle, CircleCheck } from 'lucide-react'

const RULES = [
  { label: 'No mínimo 8 caracteres', test: (pw: string) => pw.length >= 8 },
  { label: 'Uma letra maiúscula', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'Um número', test: (pw: string) => /\d/.test(pw) },
  { label: 'Um símbolo (!@#…)', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
] as const

const LABELS = ['Muito fraca', 'Fraca', 'Fraca', 'Média', 'Forte'] as const

const HINTS: Record<number, string> = {
  0: 'Use pelo menos 8 caracteres',
  1: 'Misture maiúsculas, números e símbolos',
  2: 'Misture maiúsculas, números e símbolos',
  3: 'adicione o que falta para ficar forte',
  4: 'boa escolha',
}

function scoreOf(pw: string) {
  return RULES.filter((r) => r.test(pw)).length
}

function toneOf(score: number) {
  if (score >= 4) return { bar: 'bg-paid', text: 'text-paid' }
  if (score >= 3) return { bar: 'bg-pending', text: 'text-pending' }
  return { bar: 'bg-overdue', text: 'text-overdue' }
}

interface PasswordStrengthProps {
  password: string
  /** Mostra a lista de regras (tela de redefinição); sem ela, só barra + legenda. */
  showRules?: boolean
}

/**
 * Indicador de força da senha. É orientação visual: a validação de envio continua
 * sendo a do schema (mínimo de 8 caracteres).
 */
export function PasswordStrength({ password, showRules = false }: PasswordStrengthProps) {
  const score = scoreOf(password)
  const tone = toneOf(score)
  const empty = password.length === 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${!empty && i < score ? tone.bar : 'bg-surface-3'}`}
          />
        ))}
      </div>
      <span
        className={`text-caption font-semibold ${empty ? 'text-fg-subtle' : tone.text}`}
        aria-live="polite"
      >
        {empty ? 'Força da senha' : `Força: ${LABELS[score]}`}
        {!empty && !showRules && (
          <span className="font-normal text-fg-muted"> — {HINTS[score]}</span>
        )}
      </span>
      {showRules && (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0" aria-label="Requisitos da senha">
          {RULES.map((rule) => {
            const ok = rule.test(password)
            return (
              <li
                key={rule.label}
                className={`flex items-center gap-2 text-body-sm ${ok ? 'text-paid' : 'text-fg-muted'}`}
              >
                {ok ? (
                  <CircleCheck size={16} aria-hidden="true" />
                ) : (
                  <Circle size={16} aria-hidden="true" />
                )}
                <span>
                  {rule.label}
                  <span className="sr-only">{ok ? ' — atendido' : ' — pendente'}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
