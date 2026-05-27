import { Outlet } from 'react-router-dom'

export function PublicLayout() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Outlet />
    </main>
  )
}
