import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
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
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Fill in the form below to create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Your name" autoComplete="name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? (
                <>
                  <span
                    className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to={ROUTES.LOGIN} className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
