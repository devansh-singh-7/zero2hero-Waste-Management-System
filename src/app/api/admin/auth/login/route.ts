import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ADMIN_CREDENTIALS = [
  {
    id: 1,
    email: 'devanshsingh159753@gmail.com',
    password: 'Devansh@7',
    name: 'Devansh Singh'
  }
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 422 })
    }

    const admin = ADMIN_CREDENTIALS.find(
      cred => cred.email === email && cred.password === password
    )

    if (!admin) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 })
    }

    const adminData = {
      id: admin.id,
      email: admin.email,
      name: admin.name
    }

    const response = NextResponse.json({ 
      admin: adminData,
      message: 'Admin login successful'
    })

    response.cookies.set('admin_session', JSON.stringify(adminData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 
    })

    console.log('Admin login successful for:', admin.email)
    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
