import { Toaster as Sonner } from 'sonner'
import type { ToasterProps } from 'sonner'

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'group toast',
          description: 'group-[.toast]:text-dim',
          actionButton: 'group-[.toast]:btn group-[.toast]:btn-primary',
          cancelButton: 'group-[.toast]:btn group-[.toast]:btn-ghost',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
