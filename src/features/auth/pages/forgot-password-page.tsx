import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { AuthHeading, AuthLayout } from '@/features/auth/components/auth-layout'
import { forgotPasswordSchema } from '@/features/auth/schemas/forgot-password.schema'
import { useForgotPassword } from '@/features/auth/hooks/use-forgot-password'
import { ROUTES } from '@/app/router/routes'
import type { ForgotPasswordFormValues } from '@/features/auth/schemas/forgot-password.schema'

export default function ForgotPasswordPage() {
  const { mutate, isPending, isSuccess } = useForgotPassword()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  function onSubmit(data: ForgotPasswordFormValues) {
    mutate(data.email)
  }

  return (
    <AuthLayout>
      <AuthHeading
        title="Recuperar acesso"
        description="Informe seu e-mail e enviaremos um link para criar uma nova senha."
      />

      {isSuccess ? (
        <>
          <div
            role="status"
            className="flex items-start gap-3 rounded-lg border border-paid/30 bg-paid-soft p-4 text-body-sm leading-[1.5] text-fg"
          >
            <MailCheck size={20} className="mt-0.5 flex-none text-paid" aria-hidden="true" />
            <span>
              Se esse e-mail estiver cadastrado, você receberá o link em breve. Verifique também a
              pasta de spam.
            </span>
          </div>
          <Button asChild variant="ghost" size="lg" className="w-full">
            <Link to={ROUTES.LOGIN}>Voltar para login</Link>
          </Button>
        </>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Field label="E-mail" error={form.formState.errors.email?.message}>
            <Input
              type="email"
              placeholder="voce@email.com"
              autoComplete="email"
              error={!!form.formState.errors.email}
              {...form.register('email')}
            />
          </Field>

          <Button type="submit" variant="primary" size="lg" className="w-full" loading={isPending}>
            {isPending ? 'Enviando…' : 'Enviar link'}
          </Button>

          <Button asChild variant="ghost" size="lg" className="w-full">
            <Link to={ROUTES.LOGIN}>Voltar para login</Link>
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
