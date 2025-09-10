import { NextRequest, NextResponse } from 'next/server'
import { getWasteCollectionTasks } from '@/lib/db/actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Fetch collection tasks
    const tasks = await getWasteCollectionTasks(limit)
    
    // Serialize dates for JSON response
    const serializedTasks = tasks.map(task => ({
      ...task,
      createdAt: task.createdAt?.toISOString()
    }))
    
    const response = NextResponse.json({ 
      tasks: serializedTasks,
      timestamp: new Date().toISOString(),
      count: serializedTasks.length
    })
    
    // Add cache-busting headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
    
    return response
  } catch (error) {
    console.error('Error fetching collection tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch collection tasks' }, { status: 500 })
  }
}
