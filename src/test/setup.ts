import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { server } from './msw/server'

// findBy*/waitFor desistem em 1s por padrão; no runner do CI, mais lento por causa
// da cobertura, isso derruba testes que só estão esperando a resposta do MSW.
configure({ asyncUtilTimeout: 5000 })

// Recharts uses ResizeObserver which is not available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
