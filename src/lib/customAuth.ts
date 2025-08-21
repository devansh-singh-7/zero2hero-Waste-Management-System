import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

const HEADER_B64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')

function getSecret() {
  return process.env.CUSTOM_AUTH_SECRET || 'dev-insecure-secret-change-me'
}

export function createToken(payload: Record<string, unknown>, expiresInSeconds: number = 60 * 60 * 24 * 30) {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds }
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url')
  const data = `${HEADER_B64}.${payloadB64}`
  const signature = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url')
  return `${data}.${signature}`
}

export function verifyToken(token: string): null | any {
  try {
    const [header, payload, signature] = token.split('.')
    if (!header || !payload || !signature) return null
    const data = `${header}.${payload}`
    const expected = crypto.createHmac('sha256', getSecret()).update(data).digest('base64url')
    if (expected !== signature) return null
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof json.exp === 'number' && Math.floor(Date.now() / 1000) > json.exp) return null
    return json
  } catch {
    return null
  }
}

export async function getAuthUser(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value
    if (!token || !db) return null
    const decoded = verifyToken(token)
    if (!decoded?.id) return null
    const [user] = await db.select().from(users).where(eq(users.id, Number(decoded.id)))
    return user || null
  } catch (e) {
    return null
  }
}

export function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export async function createSession(userId: number, token: string) {
  const c = cookies()
  c.set('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
}

export async function destroySession() {
  const c = cookies()
  c.set('auth_token', '', { httpOnly: true, path: '/', maxAge: 0 })
}

