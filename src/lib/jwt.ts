export interface JwtPayload {
  sub?: string
  email?: string
  name?: string
  roles?: string[]
  permissions?: string[]
  authorities?: string[]
  token_type?: string
  exp?: number
  iat?: number
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const segment = token.split('.')[1]
    if (!segment) return null
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    return JSON.parse(atob(padded)) as JwtPayload
  } catch {
    return null
  }
}

export function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number') return true
  return payload.exp * 1000 < Date.now()
}
