import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { Users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function auth() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded?.id) {
      return null;
    }

    const [user] = await db.select({
      id: Users.id,
      email: Users.email,
      name: Users.name
    })
    .from(Users)
    .where(eq(Users.id, Number(decoded.id)));

    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined
      }
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

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
    const token = request.cookies.get('auth_token')?.value;
    if (!token || !db) {
      console.debug('No token or db connection');
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded?.id) {
      console.debug('Invalid or expired token');
      return null;
    }

    // Get fresh user data from database
    const [user] = await db
      .select({
        id: Users.id,
        email: Users.email,
        name: Users.name
      })
      .from(Users)
      .where(eq(Users.id, Number(decoded.id)));

    if (!user) {
      console.debug('User not found in database');
      return null;
    }

    // Return fresh user data
    return {
      id: user.id,
      email: user.email,
      name: user.name
    };
  } catch (e) {
    console.error('Error in getAuthUser:', e);
    return null;
  }
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

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, storedHash] = hash.split(':');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex') === storedHash);
    });
  });
}
