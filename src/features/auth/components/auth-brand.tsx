import { Wallet } from 'lucide-react'

export function AuthBrand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-md bg-brand text-brand-ink">
        <Wallet size={19} aria-hidden="true" />
      </span>
      <span className="font-display text-xl font-bold leading-none">Cash Control</span>
    </div>
  )
}
