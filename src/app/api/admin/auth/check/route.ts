import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const adminSession = request.cookies.get('admin_session')?.value

    if (!adminSession) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    try {
      const adminData = JSON.parse(adminSession)
      return NextResponse.json({ 
        isAdmin: true, 
        admin: adminData 
      })
    } catch (parseError) {
      console.error('Error parsing admin session:', parseError)
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }
  } catch (error) {
    console.error('Admin auth check error:', error)
    return NextResponse.json({ 
      isAdmin: false, 
      error: 'Failed to check admin authentication' 
    }, { status: 500 })
  }
}
