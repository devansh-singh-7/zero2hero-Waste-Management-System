import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Reports, Users, CollectedWastes } from '@/lib/db/schema'
import { count, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const totalReportsResult = await db
      .select({ count: count() })
      .from(Reports)

    const collectedWasteResult = await db
      .select({ count: count() })
      .from(CollectedWastes)
      .where(eq(CollectedWastes.status, 'collected'))

    const completedReportsResult = await db
      .select({ count: count() })
      .from(Reports)
      .where(eq(Reports.status, 'completed'))

    const totalUsersResult = await db
      .select({ count: count() })
      .from(Users)

    const totalReports = totalReportsResult[0]?.count || 0
    const collectedWastes = collectedWasteResult[0]?.count || 0
    const completedReports = completedReportsResult[0]?.count || 0
    const totalUsers = totalUsersResult[0]?.count || 0

    const wasteFromCompletedReports = completedReports * 2 
    const wasteFromCollectedTasks = collectedWastes * 5 
    const totalWasteCollected = wasteFromCompletedReports + wasteFromCollectedTasks

    const totalCO2Saved = totalWasteCollected * 0.5

    const platformStats = {
      totalReports,
      totalTasks: collectedWastes, 
      totalUsers,
      totalWasteCollected: Math.round(totalWasteCollected * 10) / 10, 
      totalCO2Saved: Math.round(totalCO2Saved * 10) / 10, 
      lastUpdated: new Date().toISOString()
    }

    const response = NextResponse.json(platformStats)
    
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
