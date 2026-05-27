import { useParams } from 'react-router-dom'

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Transaction {id}</h1>
    </div>
  )
}
