import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Modal } from '../modal'

afterEach(cleanup)

describe('Modal focus', () => {
  it('focuses the safe button of a destructive confirmation', () => {
    render(
      <Modal
        alert
        title="Excluir conta"
        onClose={() => {}}
        footer={
          <>
            <button className="btn">Cancelar</button>
            <button className="btn btn-danger">Excluir</button>
          </>
        }
      />,
    )
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancelar' }))
  })

  it('moves focus into a regular dialog and restores it on close', () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const { unmount } = render(<Modal title="Nova conta" onClose={() => {}} />)
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
    unmount()
    expect(document.activeElement).toBe(opener)
    opener.remove()
  })
})
