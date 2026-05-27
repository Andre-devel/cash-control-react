import { describe, it, expect } from 'vitest'
import { decodeJwtPayload, isJwtExpired } from '../jwt'

function makeToken(payload: object, overrideSegment?: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64')
  const mid = overrideSegment ?? Buffer.from(JSON.stringify(payload)).toString('base64')
  return `${header}.${mid}.sig`
}

describe('decodeJwtPayload', () => {
  it('decodes a valid JWT payload', () => {
    const token = makeToken({ sub: 'user-1', email: 'a@b.com', roles: ['USER'] })
    const result = decodeJwtPayload(token)
    expect(result).toMatchObject({ sub: 'user-1', email: 'a@b.com', roles: ['USER'] })
  })

  it('returns null when the middle segment is missing', () => {
    expect(decodeJwtPayload('header-only')).toBeNull()
  })

  it('returns null when the payload segment is not valid JSON', () => {
    const token = makeToken({}, Buffer.from('not-json').toString('base64'))
    expect(decodeJwtPayload(token)).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(decodeJwtPayload('')).toBeNull()
  })
})

describe('isJwtExpired', () => {
  it('returns false for a token with a far-future exp', () => {
    const token = makeToken({ sub: 'u1', exp: 9_999_999_999 })
    expect(isJwtExpired(token)).toBe(false)
  })

  it('returns true for a token with a past exp', () => {
    const token = makeToken({ sub: 'u1', exp: 1 })
    expect(isJwtExpired(token)).toBe(true)
  })

  it('returns true when exp is missing from the payload', () => {
    const token = makeToken({ sub: 'u1' })
    expect(isJwtExpired(token)).toBe(true)
  })

  it('returns true when the JWT cannot be decoded', () => {
    expect(isJwtExpired('bad.token')).toBe(true)
  })
})
