import { NextRequest, NextResponse } from 'next/server'
import { updateTaskStatus, saveCollectedWaste, completeTaskWithRewards, getDb } from '@/lib/db/actions'
import { Users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

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
      console.error('Invalid admin session format:', parseError)
      return NextResponse.json({ error: 'Invalid admin session' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, newStatus } = body

    // Validate input
    if (!taskId || !newStatus) {
      return NextResponse.json({ error: 'taskId and newStatus are required' }, { status: 400 })
    }

    console.log(`Updating task ${taskId} to status: ${newStatus}`)

    // Ensure the admin user exists in the users table
    const database = await getDb()
    let validCollectorId: number | undefined
    
    try {
      // First check if admin user exists by email
      const adminEmail = adminData.email || 'admin@wastecollection.com'
      const [existingUser] = await database
        .select()
        .from(Users)
        .where(eq(Users.email, adminEmail))
        .limit(1)
      
      if (existingUser) {
        validCollectorId = existingUser.id
        console.log(`Using existing admin user ID: ${validCollectorId} with email: ${adminEmail}`)
      } else {
        // Admin user doesn't exist, create one
        try {
          const [newAdminUser] = await database
            .insert(Users)
            .values({
              email: adminEmail,
              name: adminData.name || 'System Admin',
              password: 'temp-admin-password',
              balance: 0,
            })
            .returning()
          
          validCollectorId = newAdminUser.id
          console.log(`Created admin user with ID: ${validCollectorId}`)
        } catch (insertError) {
          console.error('Failed to create admin user:', insertError)
          // If creation fails, try to find existing user again (in case of race condition)
          const [retryUser] = await database
            .select()
            .from(Users)
            .where(eq(Users.email, adminEmail))
            .limit(1)
          
          if (retryUser) {
            validCollectorId = retryUser.id
            console.log(`Found existing admin user on retry: ${validCollectorId}`)
          } else {
            validCollectorId = undefined
          }
        }
      }
    } catch (userError) {
      console.error('Error handling admin user:', userError)
      // Fallback: don't assign collector_id if there's an issue
      validCollectorId = undefined
    }

    const updatedTask = await updateTaskStatus(taskId, newStatus, validCollectorId)
    
    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found or update failed' }, { status: 404 })
    }
    
    // Serialize the response to handle Date objects
    const serializedTask = {
      ...updatedTask,
      createdAt: updatedTask.createdAt?.toISOString()
    }
    
    return NextResponse.json(serializedTask)
  } catch (error) {
    console.error('Error updating task status:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 })
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
    
    // Get database connection and handle admin user existence
    const database = await getDb()
    let validCollectorId: number | undefined
    
    try {
      // First check if admin user exists by email
      const adminEmail = adminData.email || 'admin@wastecollection.com'
      const [existingUser] = await database
        .select()
        .from(Users)
        .where(eq(Users.email, adminEmail))
        .limit(1)
      
      if (existingUser) {
        validCollectorId = existingUser.id
        console.log(`Using existing admin user ID: ${validCollectorId} with email: ${adminEmail}`)
      } else {
        // Admin user doesn't exist, create one
        try {
          const [newAdminUser] = await database
            .insert(Users)
            .values({
              email: adminEmail,
              name: adminData.name || 'System Admin',
              password: 'temp-admin-password',
              balance: 0,
            })
            .returning()
          
          validCollectorId = newAdminUser.id
          console.log(`Created admin user with ID: ${validCollectorId}`)
        } catch (insertError) {
          console.error('Failed to create admin user:', insertError)
          // If creation fails, try to find existing user again (in case of race condition)
          const [retryUser] = await database
            .select()
            .from(Users)
            .where(eq(Users.email, adminEmail))
            .limit(1)
          
          if (retryUser) {
            validCollectorId = retryUser.id
            console.log(`Found existing admin user on retry: ${validCollectorId}`)
          } else {
            return NextResponse.json({ 
              error: 'Failed to create or find admin user' 
            }, { status: 500 })
          }
        }
      }
    } catch (userError) {
      console.error('Error handling admin user:', userError)
      return NextResponse.json({ 
        error: 'Failed to handle admin user authentication' 
      }, { status: 500 })
    }
    
    // Use the comprehensive completion function that handles rewards
    const result = await completeTaskWithRewards(
      taskId || reportId,
      validCollectorId,
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
