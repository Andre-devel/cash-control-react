import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field } from '@/components/ui/field'
import { updateProfileSchema } from '@/features/profile/schemas/update-profile.schema'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { useUpdateProfile } from '@/features/profile/hooks/use-update-profile'
import { ConsentHistorySection } from '@/features/profile/components/consent-history-section'
import type { UpdateProfileFormValues } from '@/features/profile/schemas/update-profile.schema'

function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading profile">
      <div className="h-6 w-32 rounded bg-muted" />
      <div className="h-10 w-full rounded bg-muted" />
      <div className="h-10 w-24 rounded bg-muted" />
    </div>
  )
}

export default function ProfilePage() {
  const { data: profile, isLoading, isError, refetch } = useProfile()
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const form = useForm<UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (profile) {
      form.reset({ name: profile.name })
    }
  }, [profile, form])

  function onSubmit(data: UpdateProfileFormValues) {
    updateProfile({ name: data.name })
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      <div className="card">
        <div className="card-h">
          <h3>Account Information</h3>
        </div>
        <div className="card-b">
          {isLoading ? (
            <ProfileSkeleton />
          ) : isError ? (
            <div className="space-y-2" role="alert">
              <p className="text-sm text-destructive">Failed to load profile.</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="col gap-4">
              {profile?.email && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              )}

              <Field label="Display Name" error={form.formState.errors.name?.message}>
                <Input placeholder="Your name" autoComplete="name" {...form.register('name')} />
              </Field>

              <Button type="submit" disabled={isPending} aria-busy={isPending}>
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
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Consent History</h3>
        </div>
        <div className="card-b">
          <ConsentHistorySection />
        </div>
      </div>
    </div>
  )
}
