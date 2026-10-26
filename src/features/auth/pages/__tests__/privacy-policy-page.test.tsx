import { describe, it, expect, afterEach } from 'vitest'
import { screen, cleanup } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils'
import PrivacyPolicyPage from '../privacy-policy-page'

afterEach(() => {
  cleanup()
})

describe('PrivacyPolicyPage', () => {
  it('renders without a session and shows the controller contact', async () => {
    renderWithProviders(<PrivacyPolicyPage />)

    expect(await screen.findByRole('heading', { name: /política de privacidade/i })).toBeTruthy()
    const contacts = screen.getAllByRole('link', { name: 'dimensionlab.financeiro@gmail.com' })
    expect(contacts[0].getAttribute('href')).toBe('mailto:dimensionlab.financeiro@gmail.com')
  })
})
