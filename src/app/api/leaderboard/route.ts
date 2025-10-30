import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Users, Reports, CollectedWastes, Transactions } from '@/lib/db/schema'
import { eq, count, sum, sql, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('Starting leaderboard data fetch...')
    
    try {
      const connectionTest = await db.select().from(Users).limit(1)
      console.log('Database connection successful')
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json({ 
        error: 'Database connection failed',
        leaderboard: [],
        totalUsers: 0
      }, { status: 500 })
    }
    
    const allUsers = await db.select().from(Users)
    console.log(`Found ${allUsers.length} users in database`)
    
    if (allUsers.length > 0) {
      console.log('Debug - First user raw data:', JSON.stringify(allUsers[0], null, 2))
    }

    if (allUsers.length === 0) {
      console.log('No users found - returning empty leaderboard')
      return NextResponse.json({
        leaderboard: [],
        totalUsers: 0,
        lastUpdated: new Date().toISOString(),
        message: 'No users found in database'
      })
    }

    console.log('Processing user statistics...')
    const leaderboardData = await Promise.all(
      allUsers.map(async (user, index) => {
        console.log(`Processing user ${index + 1}/${allUsers.length}: ${user.name}`)
        console.log(`User ${user.name} raw balance from DB: ${user.balance} (type: ${typeof user.balance})`)
        
        try {
          const reportsResult = await db
            .select({ count: count() })
            .from(Reports)
            .where(eq(Reports.userId, user.id))
          
          const collectionsResult = await db
            .select({ count: count() })
            .from(CollectedWastes)
            .where(eq(CollectedWastes.collectorId, user.id))
          
          const earningsResult = await db
            .select({ total: sum(Transactions.amount) })
            .from(Transactions)
            .where(eq(Transactions.userId, user.id))

          const reportsCount = reportsResult[0]?.count || 0
          const collectionsCount = collectionsResult[0]?.count || 0
          const totalEarnings = earningsResult[0]?.total || 0
          const userBalance = user.balance || 0

          const totalScore = userBalance + (reportsCount * 10) + (collectionsCount * 15)

          console.log(`  ${user.name}: Balance=${userBalance} (raw: ${user.balance}), Reports=${reportsCount}, Collections=${collectionsCount}, Score=${totalScore}`)

          return {
            id: user.id,
            userName: user.name || 'Anonymous',
            email: user.email,
            balance: userBalance,
            reportsSubmitted: reportsCount,
            tasksCompleted: collectionsCount,
            totalEarnings,
            score: totalScore,
            badges: getBadges(reportsCount, collectionsCount, userBalance)
          }
        } catch (userError) {
          console.error(`Error processing user ${user.name}:`, userError)
          return {
            id: user.id,
            userName: user.name || 'Anonymous',
            email: user.email,
            balance: user.balance || 0,
            reportsSubmitted: 0,
            tasksCompleted: 0,
            totalEarnings: 0,
            score: user.balance || 0,
            badges: getBadges(0, 0, user.balance || 0)
          }
        }
      })
    )

    console.log('Sorting leaderboard...')
    const sortedLeaderboard = leaderboardData.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score 
      }
      if (b.reportsSubmitted !== a.reportsSubmitted) {
        return b.reportsSubmitted - a.reportsSubmitted 
      }
      if (b.tasksCompleted !== a.tasksCompleted) {
        return b.tasksCompleted - a.tasksCompleted 
      }
      return b.balance - a.balance 
    })

    const leaderboard = sortedLeaderboard.map((user, index) => ({
      ...user,
      rank: index + 1
    }))

    console.log('🎯 Final leaderboard rankings:')
    leaderboard.slice(0, 5).forEach(u => console.log(`  ${u.rank}. ${u.userName} (Score: ${u.score})`))

    const response = NextResponse.json({
      leaderboard,
      totalUsers: leaderboard.length,
      lastUpdated: new Date().toISOString()
    })

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    console.log(`✅ Leaderboard API completed successfully with ${leaderboard.length} users`)
    return response
  } catch (err) {
    console.error('❌ Critical error in leaderboard API:', err)
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('Error stack:', error.stack)
    return NextResponse.json({ 
      error: 'Failed to fetch leaderboard',
      details: error.message,
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