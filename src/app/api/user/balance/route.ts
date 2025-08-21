import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/customAuth'
import { getUserByEmail, getUserBalance } from '@/utils/db/actions'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const balance = await getUserBalance(user.id)
    
    return NextResponse.json({ balance })
  } catch (error) {
    console.error('Error fetching user balance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



















