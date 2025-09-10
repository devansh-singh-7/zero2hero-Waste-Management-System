import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Reports, Users, CollectedWastes } from '@/lib/db/schema'
import { count, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get total reports from all users
    const totalReportsResult = await db
      .select({ count: count() })
      .from(Reports)

    // Get only COLLECTED waste (waste that has been actually collected)
    const collectedWasteResult = await db
      .select({ count: count() })
      .from(CollectedWastes)
      .where(eq(CollectedWastes.status, 'collected'))

    // Get verified/completed reports (reports that led to actual waste collection)
    const completedReportsResult = await db
      .select({ count: count() })
      .from(Reports)
      .where(eq(Reports.status, 'completed'))

    // Get total users (for context)
    const totalUsersResult = await db
      .select({ count: count() })
      .from(Users)

    // Calculate metrics based on actual completion
    const totalReports = totalReportsResult[0]?.count || 0
    const collectedWastes = collectedWasteResult[0]?.count || 0
    const completedReports = completedReportsResult[0]?.count || 0
    const totalUsers = totalUsersResult[0]?.count || 0

    // Calculate actual waste collected (only from completed tasks and verified reports)
    const wasteFromCompletedReports = completedReports * 2 // 2kg per completed report
    const wasteFromCollectedTasks = collectedWastes * 5 // 5kg per collected waste task
    const totalWasteCollected = wasteFromCompletedReports + wasteFromCollectedTasks

    // Calculate estimated CO2 saved (assuming 0.5kg CO2 per kg waste actually collected)
    const totalCO2Saved = totalWasteCollected * 0.5

    const platformStats = {
      totalReports,
      totalTasks: collectedWastes, // Only show collected waste tasks
      totalUsers,
      totalWasteCollected: Math.round(totalWasteCollected * 10) / 10, // Round to 1 decimal
      totalCO2Saved: Math.round(totalCO2Saved * 10) / 10, // Round to 1 decimal
      lastUpdated: new Date().toISOString()
    }

    const response = NextResponse.json(platformStats)
    
    // Add cache-busting headers for real-time data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  } catch (error) {
    console.error('Error fetching platform stats:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch platform stats',
      totalReports: 0,
      totalTasks: 0,
      totalUsers: 0,
      totalWasteCollected: 0,
      totalCO2Saved: 0
    }, { status: 500 })
  }
}
