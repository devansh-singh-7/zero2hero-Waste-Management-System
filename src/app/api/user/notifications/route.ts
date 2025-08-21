import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/customAuth'
import { db } from '@/lib/db'
import { getUnreadNotifications } from '@/utils/db/actions'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await getUnreadNotifications(user.id)
    
    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



















