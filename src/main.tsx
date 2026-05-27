import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryProvider } from '@/app/providers/query-provider'
import { Toaster } from '@/components/ui/toaster'
import { router } from '@/app/router/router'
import { initializeTheme } from '@/styles/theme/dark-mode'
import './styles/globals.css'

initializeTheme()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </QueryProvider>
  </React.StrictMode>,
)
