import { useEffect, useId, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Info, KeyRound, Monitor, Moon, Smartphone, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { updateProfileSchema } from '@/features/profile/schemas/update-profile.schema'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { useUpdateProfile } from '@/features/profile/hooks/use-update-profile'
import { ConsentHistorySection } from '@/features/profile/components/consent-history-section'
import { ChangePasswordSection } from '@/features/profile/components/change-password-section'
import { BankConnectionsSection } from '@/features/bank-connections/components/bank-connections-section'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { getFrontendVersion } from '@/features/version/utils'
import { useInstallPrompt } from '@/app/pwa/use-install-prompt'
import type { Theme } from '@/styles/theme/dark-mode'
import type { UpdateProfileFormValues } from '@/features/profile/schemas/update-profile.schema'

const CARD = 'rounded-xl border border-border bg-surface-1 shadow-1'

const THEME_OPTIONS: { value: Theme; label: string; icon: ReactNode }[] = [
  { value: 'light', label: 'Claro', icon: <Sun size={16} aria-hidden="true" /> },
  { value: 'dark', label: 'Escuro', icon: <Moon size={16} aria-hidden="true" /> },
  { value: 'system', label: 'Sistema', icon: <Monitor size={16} aria-hidden="true" /> },
]

function initials(name: string | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return (first + last).toUpperCase()
}

function ProfileSkeleton() {
  return (
    <div
      className="flex animate-pulse flex-col gap-4 motion-reduce:animate-none"
      aria-busy="true"
      aria-label="Carregando perfil"
    >
      <div className="flex items-center gap-3.5">
        <div className="h-14 w-14 rounded-full bg-surface-3" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-2/5 rounded-xs bg-surface-3" />
          <div className="h-3 w-3/5 rounded-xs bg-surface-3" />
        </div>
      </div>
      <div className="h-12 w-full rounded-md bg-surface-3" />
    </div>
  )
}

function ThemePreference() {
  const theme = useAuthStore((s) => s.theme)
  const setTheme = useAuthStore((s) => s.setTheme)
  const labelId = useId()

  return (
    <section className={`${CARD} flex flex-col gap-2.5 p-4`} aria-labelledby={labelId}>
      <h2 id={labelId} className="text-body font-semibold text-fg">
        Tema
      </h2>
      <div className="segmented" role="group" aria-labelledby={labelId}>
        {THEME_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={theme === option.value ? 'on' : undefined}
            aria-pressed={theme === option.value}
            onClick={() => setTheme(option.value)}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </section>
  )
}

function SettingsRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-14 items-center gap-3 text-body text-fg">
      <span aria-hidden="true" className="text-fg-muted">
        {icon}
      </span>
      {children}
    </div>
  )
}

export default function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useProfile()
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const { canInstall, promptInstall } = useInstallPrompt()
  const [passwordOpen, setPasswordOpen] = useState(false)
  const passwordPanelId = useId()
  const version = getFrontendVersion()

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { displayName: '' },
  })

  useEffect(() => {
    if (profile) {
      form.reset({ displayName: profile.displayName ?? '' })
    }
  }, [profile, form])

  function onSubmit(data: UpdateProfileFormValues) {
    updateProfile({ displayName: data.displayName })
  }

  return (
    <div className="flex max-w-5xl flex-col gap-4">
      <h1 className="font-display text-h1 text-fg">Perfil</h1>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <section className={`${CARD} p-4 md:p-5`} aria-label="Informações da conta">
            {isLoading ? (
              <ProfileSkeleton />
            ) : isError ? (
              <div className="flex flex-col items-start gap-2" role="alert">
                <p className="text-body-sm text-overdue">Falha ao carregar perfil.</p>
                <Button variant="ghost" size="sm" onClick={() => void refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3.5">
                  <span
                    aria-hidden="true"
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-surface-3 text-h2 text-brand-text"
                  >
                    {initials(profile?.displayName)}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-body font-semibold text-fg">
                      {profile?.displayName}
                    </span>
                    {profile?.maskedEmail && (
                      <span className="truncate text-body-sm text-fg-muted">
                        {profile.maskedEmail}
                      </span>
                    )}
                  </div>
                </div>

                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  noValidate
                  className="flex flex-col gap-3"
                >
                  <Field
                    label="Nome de exibição"
                    error={form.formState.errors.displayName?.message}
                  >
                    <Input
                      placeholder="Seu nome"
                      autoComplete="name"
                      {...form.register('displayName')}
                    />
                  </Field>
                  <Button
                    type="submit"
                    variant="primary"
                    className="min-h-touch self-start"
                    loading={isPending}
                  >
                    {isPending ? 'Salvando…' : 'Salvar alterações'}
                  </Button>
                </form>
              </div>
            )}
          </section>

          <ThemePreference />

          <section className={`${CARD} px-4`} aria-label="Conta e aplicativo">
            <div className="border-b border-border">
              <button
                type="button"
                className="flex min-h-14 w-full items-center gap-3 bg-transparent text-left text-body font-medium text-fg"
                aria-expanded={passwordOpen}
                aria-controls={passwordPanelId}
                onClick={() => setPasswordOpen((v) => !v)}
              >
                <KeyRound size={19} aria-hidden="true" className="text-fg-muted" />
                <span className="flex-1">Alterar senha</span>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className={`text-fg-muted transition-transform motion-reduce:transition-none ${
                    passwordOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {passwordOpen && (
                <div id={passwordPanelId} className="pb-4">
                  <ChangePasswordSection />
                </div>
              )}
            </div>

            {canInstall && (
              <div className="border-b border-border">
                <SettingsRow icon={<Smartphone size={19} />}>
                  <span className="flex flex-1 flex-col gap-0.5 py-2">
                    <span className="font-medium">Instalar app</span>
                    <span className="text-caption text-fg-muted">
                      Instale o Cash Control para lançar um comprovante de PIX direto do botão
                      compartilhar do app do seu banco.
                    </span>
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => void promptInstall()}>
                    Instalar
                  </Button>
                </SettingsRow>
              </div>
            )}

            <SettingsRow icon={<Info size={19} />}>
              <span className="flex-1 font-medium">Versão do app</span>
              <span
                className="font-mono text-caption text-fg-muted"
                title={`build ${version.buildTime}`}
              >
                web {version.commit}
              </span>
            </SettingsRow>
          </section>
        </div>

        <BankConnectionsSection />

        <section className="flex flex-col gap-2.5" aria-labelledby="consent-history-title">
          <h2 id="consent-history-title" className="font-display text-h2 text-fg">
            Histórico de consentimento · LGPD
          </h2>
          <div className={`${CARD} px-3.5`}>
            <ConsentHistorySection />
          </div>
        </section>
      </div>
    </div>
  )
}
