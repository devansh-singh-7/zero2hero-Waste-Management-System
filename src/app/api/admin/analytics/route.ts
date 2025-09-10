import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Reports, Users, Transactions } from '@/lib/db/schema'
import { eq, count, sum, and, gte } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    // Get total users
    const totalUsers = await db.select({ count: count() }).from(Users)

    // Get total reports
    const totalReports = await db.select({ count: count() }).from(Reports)

    // Get reports statistics (using Reports table as tasks)
    const allReports = await db.select().from(Reports)
    const pendingTasks = allReports.filter(report => report.status === 'pending').length
    const completedTasks = allReports.filter(report => report.status === 'completed').length
    const inProgressTasks = allReports.filter(report => report.status === 'in-progress').length

    // Get token statistics (using balance from Users table, fallback to Transactions)
    let totalTokensDistributed = 0
    try {
      const userBalances = await db.select({ 
        total: sum(Users.balance) 
      }).from(Users)
      totalTokensDistributed = Number(userBalances[0]?.total) || 0
    } catch (error) {
      // Fallback to calculating from Transactions table
      try {
        const transactions = await db.select({ 
          total: sum(Transactions.amount) 
        }).from(Transactions).where(eq(Transactions.type, 'earned'))
        totalTokensDistributed = Number(transactions[0]?.total) || 0
      } catch (transactionError) {
        console.error('Error calculating tokens from transactions:', transactionError)
        totalTokensDistributed = 0
      }
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentReports = await db.select({ count: count() })
      .from(Reports)
      .where(gte(Reports.createdAt, sevenDaysAgo))

    const recentUsers = await db.select({ count: count() })
      .from(Users)
      .where(gte(Users.createdAt, sevenDaysAgo))

    // Get monthly statistics
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const monthlyReports = await db.select({ count: count() })
      .from(Reports)
      .where(gte(Reports.createdAt, thirtyDaysAgo))

    const monthlyUsers = await db.select({ count: count() })
      .from(Users)
      .where(gte(Users.createdAt, thirtyDaysAgo))

    // Get top users by token balance
    const topUsers = await db.select({
      id: Users.id,
      name: Users.name,
      email: Users.email,
      balance: Users.balance
    }).from(Users)
      .orderBy(Users.balance)
      .limit(5)

    // Get recent reports with user info
    const recentReportsData = await db.select({
      id: Reports.id,
      type: Reports.wasteType,
      location: Reports.location,
      status: Reports.status,
      createdAt: Reports.createdAt,
      userId: Reports.userId,
      userName: Users.name
    }).from(Reports)
      .leftJoin(Users, eq(Reports.userId, Users.id))
      .orderBy(Reports.createdAt)
      .limit(10)

    const analytics = {
      overview: {
        totalUsers: Number(totalUsers[0]?.count) || 0,
        totalReports: Number(totalReports[0]?.count) || 0,
        pendingTasks,
        completedTasks,
        inProgressTasks,
        totalTasks: allReports.length,
        totalTokensDistributed: totalTokensDistributed
      },
      recent: {
        reportsLastWeek: Number(recentReports[0]?.count) || 0,
        usersLastWeek: Number(recentUsers[0]?.count) || 0,
        reportsLastMonth: Number(monthlyReports[0]?.count) || 0,
        usersLastMonth: Number(monthlyUsers[0]?.count) || 0
      },
      topUsers: topUsers.reverse(), // Reverse to show highest balance first
      recentActivity: recentReportsData.reverse() // Show most recent first
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
