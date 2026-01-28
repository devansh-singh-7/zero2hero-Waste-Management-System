import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/customAuth'
import { db } from '@/lib/db'
import { getUserNotifications, markNotificationAsRead } from '@/lib/db/actions'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      console.log('User not found from auth token or cookie');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize database connection
    if (!db) {
      console.error('Database not initialized');
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Get notifications
    try {
      const notifications = await getUserNotifications(user.id);
      console.log(`Fetched ${notifications.length} notifications for user ${user.id}`);
      return NextResponse.json(notifications);
    } catch (dbError) {
      console.error('Database error fetching notifications:', dbError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in notifications endpoint:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { notificationId } = await request.json()
    
    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 })
    }

    await markNotificationAsRead(notificationId)
    
    return NextResponse.json({ message: 'Notification marked as read' })
  } catch (error) {
    console.error('Error updating notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



















