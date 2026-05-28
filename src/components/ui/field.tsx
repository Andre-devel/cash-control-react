import React, { useId, type ReactNode } from 'react'

interface FieldProps {
  label?: string
  required?: boolean
  hint?: string
  error?: string
  span?: number
  children: ReactNode
  htmlFor?: string
}

export function Field({ label, required, hint, error, span, children, htmlFor }: FieldProps) {
  const autoId = useId()
  const existingId = React.isValidElement(children)
    ? (children as React.ReactElement<{ id?: string }>).props.id
    : undefined
  const inputId = htmlFor ?? existingId ?? autoId

  const extraProps: { id?: string; 'aria-invalid'?: true } = {}
  if (!existingId) extraProps.id = inputId
  if (error) extraProps['aria-invalid'] = true

  const childWithId =
    React.isValidElement(children) && Object.keys(extraProps).length > 0
      ? React.cloneElement(children as React.ReactElement<typeof extraProps>, extraProps)
      : children

  return (
    <div className="field" style={span ? { gridColumn: `span ${span}` } : undefined}>
      {label && (
        <label htmlFor={inputId}>
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {childWithId}
      {error && (
        <div className="err">
          <svg
            className="ico"
            width={11}
            height={11}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          {error}
        </div>
      )}
      {!error && hint && <div className="hint">{hint}</div>}
    </div>
  )
}
