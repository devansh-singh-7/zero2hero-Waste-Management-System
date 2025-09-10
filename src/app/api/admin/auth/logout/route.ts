import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ message: 'Admin logout successful' })
    
    // Clear admin session cookie
    response.cookies.set('admin_session', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0
    })

    return response
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
