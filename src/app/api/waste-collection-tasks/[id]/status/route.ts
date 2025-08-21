import { NextRequest, NextResponse } from 'next/server'
import { updateTaskStatus } from '@/utils/db/actions'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = parseInt(params.id)
    const { status, collectorId } = await request.json()
    
    const updatedTask = await updateTaskStatus(taskId, status, collectorId)
    
    if (!updatedTask) {
      return NextResponse.json({ error: 'Failed to update task status' }, { status: 400 })
    }
    
    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}










