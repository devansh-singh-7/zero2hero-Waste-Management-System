import { NextRequest, NextResponse } from 'next/server'
import { updateTaskStatus, saveCollectedWaste, completeTaskWithRewards } from '@/lib/db/actions'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    let adminData
    try {
      adminData = JSON.parse(adminSession)
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid admin session' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, newStatus } = body

    const updatedTask = await updateTaskStatus(taskId, newStatus, adminData.id)
    
    // Serialize the response to handle Date objects
    const serializedTask = {
      ...updatedTask,
      createdAt: updatedTask.createdAt?.toISOString()
    }
    
    return NextResponse.json(serializedTask)
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    let adminData
    try {
      adminData = JSON.parse(adminSession)
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid admin session' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, reportId, verificationResult, imageUrl } = body
    
    // Use the comprehensive completion function that handles rewards
    const result = await completeTaskWithRewards(
      taskId || reportId,
      adminData.id,
      verificationResult,
      imageUrl
    )
    
    // Serialize the response to handle Date objects
    const serializedResult = {
      ...result,
      updatedReport: {
        ...result.updatedReport,
        createdAt: result.updatedReport.createdAt?.toISOString()
      },
      collectedWaste: {
        ...result.collectedWaste,
        collectionDate: result.collectedWaste.collectionDate?.toISOString()
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Task completed successfully! User earned ${result.rewardAmount} tokens.`,
      data: serializedResult
    })
  } catch (error) {
    console.error('Error completing task:', error)
    return NextResponse.json({ 
      error: 'Failed to complete task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
