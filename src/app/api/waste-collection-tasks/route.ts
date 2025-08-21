import { NextRequest, NextResponse } from 'next/server'
import { getWasteCollectionTasks } from '@/utils/db/actions'

export async function GET(request: NextRequest) {
  try {
    const tasks = await getWasteCollectionTasks(20)
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching waste collection tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}










