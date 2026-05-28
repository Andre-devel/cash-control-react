import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  title: string
  subtitle?: ReactNode
  onClose: () => void
  children?: ReactNode
  footer?: ReactNode
  wide?: boolean
  alert?: boolean
}

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
  alert = false,
}: ModalProps) {
  const idRef = useRef(`modal-title-${Math.random().toString(36).slice(2)}`)
  const containerRef = useRef<HTMLDivElement | null>(null)

  if (!containerRef.current) {
    containerRef.current = document.createElement('div')
  }

  useLayoutEffect(() => {
    const container = containerRef.current!
    document.body.appendChild(container)

    // Hide all other body children from the accessibility tree (same as Radix Dialog)
    const hiddenEls: Element[] = []
    Array.from(document.body.children).forEach((el) => {
      if (el !== container && !el.hasAttribute('aria-hidden')) {
        el.setAttribute('aria-hidden', 'true')
        hiddenEls.push(el)
      }
    })

    return () => {
      if (document.body.contains(container)) document.body.removeChild(container)
      hiddenEls.forEach((el) => el.removeAttribute('aria-hidden'))
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div className="modal-back" onClick={onClose} data-testid="modal-backdrop">
      <div
        className={`modal${wide ? ' wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role={alert ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={idRef.current}
      >
        <div className="modal-h">
          <div>
            <h2 id={idRef.current}>{title}</h2>
            {subtitle && <div className="sub">{subtitle}</div>}
          </div>
          <button className="x" onClick={onClose} aria-label="Fechar">
            <svg
              className="ico"
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-b">{children}</div>
        {footer && <div className="modal-f">{footer}</div>}
      </div>
    </div>,
    containerRef.current,
  )
}
