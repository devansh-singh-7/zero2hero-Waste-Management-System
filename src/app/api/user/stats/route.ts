import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/customAuth'
import { db } from '@/lib/db'
import { Reports, CollectedWastes, Transactions } from '@/lib/db/schema'
import { eq, count, sum, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userId = Number(session.user.id)
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    // Get total reports by user
    const totalReportsResult = await db
      .select({ count: count() })
      .from(Reports)
      .where(eq(Reports.userId, userId))

    // Get completed collection tasks
    const completedTasksResult = await db
      .select({ count: count() })
      .from(CollectedWastes)
      .where(eq(CollectedWastes.collectorId, userId))

    // Get total earnings from transactions
    const totalEarningsResult = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${Transactions.amount}), 0)` 
      })
      .from(Transactions)
      .where(eq(Transactions.userId, userId))

    // Calculate user rank based on total reports
    const allUsersReports = await db
      .select({ 
        userId: Reports.userId,
        reportCount: count()
      })
      .from(Reports)
      .groupBy(Reports.userId)
      .orderBy(sql`count(*) DESC`)

    const userRank = allUsersReports.findIndex(user => user?.userId === userId) + 1

    // Calculate estimated waste collected (assuming average 2kg per report)
    const estimatedWasteKg = (totalReportsResult[0]?.count || 0) * 2

    // Calculate estimated CO2 saved (assuming 0.5kg CO2 per kg waste)
    const estimatedCO2Saved = estimatedWasteKg * 0.5

    const stats = {
      totalReports: totalReportsResult[0]?.count || 0,
      totalEarnings: totalEarningsResult[0]?.total || 0,
      completedTasks: completedTasksResult[0]?.count || 0,
      currentRank: userRank > 0 ? userRank : null,
      wasteCollected: `${estimatedWasteKg} kg`,
      co2Saved: `${estimatedCO2Saved.toFixed(1)} kg`
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
