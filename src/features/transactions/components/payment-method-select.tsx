import { Select } from '@/components/ui/select'
import { usePaymentMethods } from '@/features/transactions/hooks/use-payment-methods'

interface PaymentMethodSelectProps {
  value: string
  onChange: (value: string) => void
  name?: string
  'aria-label'?: string
  allowAll?: string
  className?: string
}

export function PaymentMethodSelect({
  value,
  onChange,
  name,
  'aria-label': ariaLabel,
  allowAll,
  className,
}: PaymentMethodSelectProps) {
  const { data: paymentMethods, isLoading } = usePaymentMethods()

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      name={name}
      aria-label={ariaLabel}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <option value="">Carregando formas de pagamento…</option>
      ) : (
        <>
          {allowAll !== undefined && <option value="">{allowAll}</option>}
          {paymentMethods?.map((pm) => (
            <option key={pm.id} value={pm.slug}>
              {pm.name}
            </option>
          ))}
        </>
      )}
    </Select>
  )
}
