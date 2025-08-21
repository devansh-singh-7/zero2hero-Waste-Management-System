import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/customAuth'
import { getWasteCollectionTasks, updateTaskStatus, saveReward, saveCollectedWaste, getUserByEmail } from '@/utils/db/actions'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await getWasteCollectionTasks()
    
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching collection tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, newStatus, collectorId } = body

    const updatedTask = await updateTaskStatus(taskId, newStatus, collectorId || user.id)
    
    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    let result
    if (action === 'saveReward') {
      result = await saveReward(user.id, data.amount)
    } else if (action === 'saveCollectedWaste') {
      result = await saveCollectedWaste(data.reportId, user.id, data.verificationResult)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing collect action:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

