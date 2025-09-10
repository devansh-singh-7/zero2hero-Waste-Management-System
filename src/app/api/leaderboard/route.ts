import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Users, Reports, CollectedWastes, Transactions } from '@/lib/db/schema'
import { eq, count, sum, sql, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get user stats without ordering first
    const userStats = await db
      .select({
        userId: Users.id,
        userName: Users.name,
        userEmail: Users.email,
        balance: Users.balance,
        reportsCount: sql<number>`COALESCE(COUNT(DISTINCT ${Reports.id}), 0)`,
        collectedCount: sql<number>`COALESCE(COUNT(DISTINCT ${CollectedWastes.id}), 0)`,
        totalEarnings: sql<number>`COALESCE(SUM(DISTINCT ${Transactions.amount}), 0)`
      })
      .from(Users)
      .leftJoin(Reports, eq(Users.id, Reports.userId))
      .leftJoin(CollectedWastes, eq(Users.id, CollectedWastes.collectorId))
      .leftJoin(Transactions, eq(Users.id, Transactions.userId))
      .groupBy(Users.id, Users.name, Users.email, Users.balance)

    // Calculate rankings and scores, then sort properly
    const leaderboardWithScores = userStats.map((user) => {
      const totalScore = (user.balance || 0) + 
                        (user.reportsCount * 10) + 
                        (user.collectedCount * 15)

      return {
        id: user.userId,
        userName: user.userName || 'Anonymous',
        email: user.userEmail,
        balance: user.balance || 0,
        reportsSubmitted: user.reportsCount,
        tasksCompleted: user.collectedCount,
        totalEarnings: user.totalEarnings || 0,
        score: totalScore,
        // Add badges based on performance
        badges: getBadges(user.reportsCount, user.collectedCount, user.balance || 0)
      }
    })

    // Sort by score in descending order (highest score first)
    const sortedLeaderboard = leaderboardWithScores.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score // Primary: Sort by total score
      }
      if (b.reportsSubmitted !== a.reportsSubmitted) {
        return b.reportsSubmitted - a.reportsSubmitted // Secondary: Sort by reports
      }
      if (b.tasksCompleted !== a.tasksCompleted) {
        return b.tasksCompleted - a.tasksCompleted // Tertiary: Sort by tasks
      }
      return b.balance - a.balance // Final: Sort by balance
    })

    // Add ranks after sorting
    const leaderboard = sortedLeaderboard.map((user, index) => ({
      ...user,
      rank: index + 1
    }))

    const response = NextResponse.json({
      leaderboard,
      totalUsers: leaderboard.length,
      lastUpdated: new Date().toISOString()
    })

    // Add cache-busting headers for real-time data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch leaderboard',
      leaderboard: [],
      totalUsers: 0
    }, { status: 500 })
  }
}

function getBadges(reports: number, tasks: number, balance: number) {
  const badges = []
  
  if (reports >= 1) badges.push('🎯 First Reporter')
  if (reports >= 10) badges.push('⚔️ Waste Warrior') 
  if (reports >= 25) badges.push('🌍 Environmental Guardian')
  
  if (tasks >= 5) badges.push('🤝 Community Helper')
  if (tasks >= 20) badges.push('🚛 Collection Expert')
  
  if (balance >= 100) badges.push('💰 Token Collector')
  if (balance >= 500) badges.push('💎 Wealth Builder')
  
  return badges
}