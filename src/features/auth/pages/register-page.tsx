import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { registerSchema } from '@/features/auth/schemas/register.schema'
import { useRegister } from '@/features/auth/hooks/use-register'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { toast } from '@/lib/toast'
import { ROUTES } from '@/app/router/routes'
import type { RegisterFormValues } from '@/features/auth/schemas/register.schema'
import type { NormalizedError } from '@/features/auth/types'

export default function RegisterPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { mutate, isPending } = useRegister()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />
  }

  function onSubmit(data: RegisterFormValues) {
    mutate(data, {
      onError: (error: NormalizedError) => {
        if (error.errorCode === 'EMAIL_ALREADY_IN_USE') {
          form.setError('email', {
            type: 'manual',
            message: 'This email address is already registered',
          })
        } else {
          toast.error('Registration failed. Please try again.')
        }
      },
    })
  }

  return (
    <div className="card w-full max-w-sm">
      <div className="card-h">
        <div>
          <h2>Create account</h2>
          <p className="text-sm text-muted-foreground">
            Fill in the form below to create your account
          </p>
        </div>
      </div>
      <div className="card-b">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="col gap-4">
          <Field label="Name" error={form.formState.errors.name?.message}>
            <Input
              type="text"
              placeholder="Your name"
              autoComplete="name"
              {...form.register('name')}
            />
          </Field>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...form.register('email')}
            />
          </Field>
          <Field label="Password" error={form.formState.errors.password?.message}>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...form.register('password')}
            />
          </Field>
          <Field label="Confirm password" error={form.formState.errors.confirmPassword?.message}>
            <Input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
            />
          </Field>
          <Button
            type="submit"
            size="lg"
            variant="primary"
            className="w-full"
            disabled={isPending}
            aria-busy={isPending}
          >
            {isPending ? (
              <>
                <span
                  className="animate-spin"
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid currentColor',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                  aria-hidden="true"
                />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
