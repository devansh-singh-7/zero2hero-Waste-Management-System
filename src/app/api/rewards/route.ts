import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/customAuth'
import { getAllRewards, getAvailableRewards, getRewardTransactions, saveReward } from '@/lib/db/actions'

export const dynamic = 'force-dynamic'

// Custom rewards data - these will be available to all users
const CUSTOM_REWARDS = [
  {
    id: 'eco-warrior',
    name: "🌱 Eco Warrior Badge",
    description: "Achieve your first milestone as an environmental champion",
    points_required: 50,
    level_required: 1,
    category: "achievement",
    icon: "🌱"
  },
  {
    id: 'recycling-master',
    name: "♻️ Recycling Master",
    description: "Prove your expertise in waste classification and collection",
    points_required: 100,
    level_required: 2,
    category: "expertise",
    icon: "♻️"
  },
  {
    id: 'community-hero',
    name: "🏆 Community Hero",
    description: "Lead by example and inspire others to join the movement",
    points_required: 200,
    level_required: 3,
    category: "leadership",
    icon: "🏆"
  },
  {
    id: 'planet-protector',
    name: "🌍 Planet Protector",
    description: "Reach the highest level of environmental stewardship",
    points_required: 500,
    level_required: 5,
    category: "mastery",
    icon: "🌍"
  },
  {
    id: 'waste-spotter',
    name: "🎯 Waste Spotter",
    description: "Develop keen eyes for identifying different types of waste",
    points_required: 75,
    level_required: 1,
    category: "skill",
    icon: "🎯"
  },
  {
    id: 'quick-collector',
    name: "🚀 Quick Collector",
    description: "Master the art of efficient waste collection",
    points_required: 150,
    level_required: 2,
    category: "efficiency",
    icon: "🚀"
  },
  {
    id: 'innovation-leader',
    name: "💡 Innovation Leader",
    description: "Contribute to improving waste management processes",
    points_required: 300,
    level_required: 4,
    category: "innovation",
    icon: "💡"
  },
  {
    id: 'sustainability-champion',
    name: "🌟 Sustainability Champion",
    description: "The ultimate recognition for environmental dedication",
    points_required: 1000,
    level_required: 10,
    category: "legendary",
    icon: "🌟"
  },
  {
    id: 'waste-detective',
    name: "🔍 Waste Detective",
    description: "Specialize in identifying and reporting complex waste situations",
    points_required: 125,
    level_required: 2,
    category: "specialization",
    icon: "🔍"
  },
  {
    id: 'speed-demon',
    name: "⚡ Speed Demon",
    description: "Complete waste collection tasks with exceptional efficiency",
    points_required: 175,
    level_required: 3,
    category: "efficiency",
    icon: "⚡"
  },
  {
    id: 'creative-recycler',
    name: "🎨 Creative Recycler",
    description: "Find innovative ways to handle and report waste",
    points_required: 250,
    level_required: 3,
    category: "creativity",
    icon: "🎨"
  },
  {
    id: 'team-player',
    name: "🤝 Team Player",
    description: "Collaborate effectively with other waste collectors",
    points_required: 400,
    level_required: 4,
    category: "collaboration",
    icon: "🤝"
  },
  {
    id: 'knowledge-seeker',
    name: "📚 Knowledge Seeker",
    description: "Continuously learn about waste management best practices",
    points_required: 80,
    level_required: 1,
    category: "learning",
    icon: "📚"
  },
  {
    id: 'consistency-king',
    name: "🔄 Consistency King",
    description: "Maintain regular participation in waste collection activities",
    points_required: 600,
    level_required: 6,
    category: "dedication",
    icon: "🔄"
  },
  {
    id: 'veteran-collector',
    name: "🎖️ Veteran Collector",
    description: "Long-term commitment to environmental protection",
    points_required: 800,
    level_required: 8,
    category: "veteran",
    icon: "🎖️"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let data
    if (type === 'transactions') {
      // Transactions require authentication
      const user = await getAuthUser(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      data = await getRewardTransactions(user.id)
    } else if (type === 'available') {
      // Available rewards can be viewed without authentication
      // If user is authenticated, show personalized data
      try {
        const user = await getAuthUser(request)
        if (user) {
          // Get user's current level and points
          const userRewards = await getAvailableRewards(user.id)
          const userPoints = userRewards.find(r => r.id === 0)?.cost || 0
          
          // Filter custom rewards based on user's level and points
          const availableCustomRewards = CUSTOM_REWARDS.map(reward => ({
            ...reward,
            cost: reward.points_required,
            isUnlocked: userPoints >= reward.points_required,
            progress: Math.min((userPoints / reward.points_required) * 100, 100),
            collectionInfo: `Unlock this badge by earning ${reward.points_required} points and reaching level ${reward.level_required}`
          }))
          
          data = availableCustomRewards
        } else {
          // User not found, show rewards without personalization
          const availableCustomRewards = CUSTOM_REWARDS.map(reward => ({
            ...reward,
            cost: reward.points_required,
            isUnlocked: false,
            progress: 0,
            collectionInfo: `Unlock this badge by earning ${reward.points_required} points and reaching level ${reward.level_required}`
          }))
          
          data = availableCustomRewards
        }
      } catch (error) {
        // If auth fails, show rewards without personalization
        const availableCustomRewards = CUSTOM_REWARDS.map(reward => ({
          ...reward,
          cost: reward.points_required,
          isUnlocked: false,
          progress: 0,
          collectionInfo: `Unlock this badge by earning ${reward.points_required} points and reaching level ${reward.level_required}`
        }))
        
        data = availableCustomRewards
      }
    } else {
      // Other operations require authentication
      const user = await getAuthUser(request)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      data = await getAllRewards()
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { rewardId, rewardTitle, tokensSpent } = await request.json()
    
    if (!rewardId || !rewardTitle || !tokensSpent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Import database components
    const { db } = require('@/lib/db')
    const { Users, Transactions, RedeemedRewards } = require('@/lib/db/schema')
    const { eq } = require('drizzle-orm')

    // Check if user has sufficient balance
    const userResult = await db.select().from(Users).where(eq(Users.id, user.id))
    if (!userResult.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentBalance = userResult[0].balance || 0
    if (currentBalance < tokensSpent) {
      return NextResponse.json({ 
        error: 'Insufficient tokens',
        required: tokensSpent,
        current: currentBalance
      }, { status: 400 })
    }

    // Check if reward is already redeemed
    const existingRedemption = await db
      .select()
      .from(RedeemedRewards)
      .where(eq(RedeemedRewards.userId, user.id))
      .where(eq(RedeemedRewards.rewardId, rewardId))

    if (existingRedemption.length > 0) {
      return NextResponse.json({ error: 'Reward already redeemed' }, { status: 400 })
    }

    // Start transaction
    await db.transaction(async (tx: any) => {
      // Deduct tokens from user balance
      await tx
        .update(Users)
        .set({ balance: currentBalance - tokensSpent })
        .where(eq(Users.id, user.id))

      // Record the transaction
      await tx.insert(Transactions).values({
        userId: user.id,
        type: 'redeemed',
        amount: -tokensSpent,
        description: `Redeemed reward: ${rewardTitle}`,
        date: new Date()
      })

      // Record the redeemed reward
      await tx.insert(RedeemedRewards).values({
        userId: user.id,
        rewardId,
        rewardTitle,
        tokensSpent,
        redeemedAt: new Date()
      })
    })

    return NextResponse.json({ 
      message: 'Reward redeemed successfully!',
      newBalance: currentBalance - tokensSpent,
      rewardTitle
    })

  } catch (error) {
    console.error('Error redeeming reward:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}









