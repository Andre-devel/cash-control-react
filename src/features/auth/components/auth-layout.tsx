import type { ReactNode } from 'react'
import { AuthAside } from './auth-aside'
import { AuthBrand } from './auth-brand'
import '../auth.css'

interface AuthLayoutProps {
  children: ReactNode
  /** Marca no topo do formulário, só abaixo de 1024 px (no desktop ela fica no painel). */
  showMobileBrand?: boolean
}

/** Casca das telas públicas de autenticação: painel de apresentação (desktop) + coluna do formulário. */
export function AuthLayout({ children, showMobileBrand = true }: AuthLayoutProps) {
  return (
    <div className="auth-shell cc-auth">
      <AuthAside />
      <main className="auth-main">
        <div className="auth-card">
          {showMobileBrand && (
            <div className="lg:hidden">
              <AuthBrand />
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}

interface AuthHeadingProps {
  title: string
  description?: ReactNode
}

/** Título da tela (h1) com a fonte display do design. */
export function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="m-0 font-display text-[2rem] font-extrabold leading-[1.1] tracking-[-0.01em] [text-wrap:balance]">
        {title}
      </h1>
      {description && (
        <p className="m-0 text-[0.9375rem] leading-[1.45] text-fg-muted">{description}</p>
      )}
    </div>
  )
}
