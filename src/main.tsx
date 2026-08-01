import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from '@/app/providers/query-provider'
import { Toaster } from '@/components/ui/toaster'
import { router } from '@/app/router/router'
import './styles/globals.css'

// O tema já foi aplicado antes da primeira pintura pelo script inline do index.html,
// e o auth store o reaplica ao reidratar. Chamar initializeTheme() aqui rodaria DEPOIS
// da reidratação e sobrescreveria a escolha do usuário.

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </QueryProvider>
  </React.StrictMode>,
)
