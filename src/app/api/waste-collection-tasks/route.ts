import { NextRequest, NextResponse } from 'next/server'
import { getWasteCollectionTasks } from '@/lib/db/actions'

export async function GET(request: NextRequest) {
  try {
    const tasks = await getWasteCollectionTasks(20)
    
    // Serialize dates for JSON response
    const serializedTasks = tasks.map(task => ({
      ...task,
      createdAt: task.createdAt?.toISOString()
    }))
    
    return NextResponse.json(serializedTasks)
  } catch (error) {
    console.error('Error fetching waste collection tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}










