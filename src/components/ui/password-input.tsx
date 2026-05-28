import { useState } from 'react'
import { Input, type InputProps } from './input'

type PasswordInputProps = Omit<InputProps, 'type' | 'trailing'>

export function PasswordInput({ error, ...rest }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <Input
      type={show ? 'text' : 'password'}
      error={error}
      trailing={
        <button
          type="button"
          className="trailing btn-eye"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {show ? (
            <svg
              className="ico"
              width={15}
              height={15}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M3 3l18 18" />
              <path d="M10.6 6.1A10 10 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-3.4 4.3" />
              <path d="M6.6 6.6A17 17 0 0 0 2 12s3.5 6 10 6a10 10 0 0 0 4.3-1" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </svg>
          ) : (
            <svg
              className="ico"
              width={15}
              height={15}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      }
      {...rest}
    />
  )
}
