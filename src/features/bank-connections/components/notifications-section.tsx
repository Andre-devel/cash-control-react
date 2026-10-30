import { BellRing, EyeOff } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { usePushNotifications } from '@/features/bank-connections/hooks/use-push-notifications'

const CARD = 'rounded-xl border border-border bg-surface-1 shadow-1'

/**
 * Interruptor por aparelho: só este celular passa a receber o aviso de lançamento novo no
 * banco. Some quando o navegador não tem Web Push ou o servidor não tem as chaves.
 */
export function NotificationsSection() {
  const push = usePushNotifications()
  if (!push.supported || !push.available) return null

  return (
    <section className="flex flex-col gap-2.5" aria-labelledby="notifications-title">
      <h2 id="notifications-title" className="font-display text-h2 text-fg">
        Notificações
      </h2>
      <div className={`${CARD} flex flex-col divide-y divide-border px-4`}>
        <div className="flex items-center gap-3 py-3.5">
          <BellRing size={19} className="shrink-0 text-fg-muted" aria-hidden="true" />
          <div className="flex flex-1 flex-col">
            <span className="font-medium">Notificações neste aparelho</span>
            <span className="text-caption text-fg-muted">
              Avisa quando entra ou sai dinheiro na conta conectada, para confirmar na hora.
            </span>
          </div>
          <Toggle
            on={push.on}
            label="Notificações neste aparelho"
            disabled={push.pending}
            onChange={(on) => (on ? push.enable() : push.disable())}
          />
        </div>
        {push.on && (
          <div className="flex items-center gap-3 py-3.5">
            <EyeOff size={19} className="shrink-0 text-fg-muted" aria-hidden="true" />
            <div className="flex flex-1 flex-col">
              <span className="font-medium">Esconder valores</span>
              <span className="text-caption text-fg-muted">
                A notificação mostra o lançamento sem o valor, para a tela bloqueada.
              </span>
            </div>
            <Toggle
              on={push.hideAmounts}
              label="Esconder valores na notificação"
              disabled={push.pending}
              onChange={push.setHideAmounts}
            />
          </div>
        )}
      </div>
    </section>
  )
}
