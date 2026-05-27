import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
                {profile?.email && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isPending} aria-busy={isPending}>
                  {isPending ? (
                    <>
                      <span
                        className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"
                        aria-hidden="true"
                      />
                      Saving…
                    </>
                  ) : (
                    'Save changes'
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consent History</CardTitle>
        </CardHeader>
        <CardContent>
          <ConsentHistorySection />
        </CardContent>
      </Card>
    </div>
  )
}
