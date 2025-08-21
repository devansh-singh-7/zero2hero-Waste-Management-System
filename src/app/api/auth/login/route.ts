import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, or } from 'drizzle-orm'
import { createToken, hashPassword } from '@/lib/customAuth'

export async function POST(request: NextRequest) {
  try {
    console.log('Login attempt started');
    const { email, password } = await request.json()
    
    // Validate input
    if (!email || !password) {
      console.log('Missing required fields');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 422 })
    }

    // Check database connection
    if (!db) {
      console.error('Database connection not available');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    // Find user
    let found
    try {
      console.log('Searching for user by email:', email);
      [found] = await db.select().from(users).where(eq(users.email, email))
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!found) {
      console.log('User not found');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    // Verify password
    const hash = hashPassword(password)
    if (!found.password_hash || found.password_hash !== hash) {
      console.log('Invalid password');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = createToken({ id: found.id, email: found.email })
    const res = NextResponse.json({ id: found.id, name: found.name, email: found.email })
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




