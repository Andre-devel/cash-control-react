import { useParams } from 'react-router-dom'

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Account {id}</h1>
    </div>
  )
}
