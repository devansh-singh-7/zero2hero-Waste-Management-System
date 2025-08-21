'use client'
import { useState, useEffect } from 'react'
import { Coins, ArrowUpRight, ArrowDownRight, Gift, AlertCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

type Transaction = {
  id: number
  type: 'earned_report' | 'earned_collect' | 'redeemed'
  amount: number
  description: string
  date: string
}

type Reward = {
  id: string | number
  name: string
  cost: number
  description: string | null
  collectionInfo: string
  category?: string
  isUnlocked?: boolean
  progress?: number
}

export default function RewardsPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRewards = async () => {
      setLoading(true)
      try {
        // Fetch available rewards (no authentication required)
        const rewardsResponse = await fetch('/api/rewards?type=available')
        
        if (rewardsResponse.ok) {
          const fetchedRewards = await rewardsResponse.json()
          setRewards(fetchedRewards as Reward[])
        } else {
          // If API fails, show default rewards
          setRewards([
            {
              id: 'eco-warrior',
              name: "🌱 Eco Warrior Badge",
              description: "Achieve your first milestone as an environmental champion",
              cost: 50,
              collectionInfo: "Unlock this badge by earning 50 points",
              category: "achievement",
              isUnlocked: false,
              progress: 0
            },
            {
              id: 'recycling-master',
              name: "♻️ Recycling Master",
              description: "Prove your expertise in waste classification and collection",
              cost: 100,
              collectionInfo: "Unlock this badge by earning 100 points",
              category: "expertise",
              isUnlocked: false,
              progress: 0
            },
            {
              id: 'community-hero',
              name: "🏆 Community Hero",
              description: "Lead by example and inspire others to join the movement",
              cost: 200,
              collectionInfo: "Unlock this badge by earning 200 points",
              category: "leadership",
              isUnlocked: false,
              progress: 0
            },
            {
              id: 'planet-protector',
              name: "🌍 Planet Protector",
              description: "Reach the highest level of environmental stewardship",
              cost: 500,
              collectionInfo: "Unlock this badge by earning 500 points",
              category: "mastery",
              isUnlocked: false,
              progress: 0
            },
            {
              id: 'waste-spotter',
              name: "🎯 Waste Spotter",
              description: "Develop keen eyes for identifying different types of waste",
              cost: 75,
              collectionInfo: "Unlock this badge by earning 75 points",
              category: "skill",
              isUnlocked: false,
              progress: 0
            },
            {
              id: 'quick-collector',
              name: "🚀 Quick Collector",
              description: "Master the art of efficient waste collection",
              cost: 150,
              collectionInfo: "Unlock this badge by earning 150 points",
              category: "efficiency",
              isUnlocked: false,
              progress: 0
            }
          ])
        }
      } catch (error) {
        console.error('Error fetching rewards:', error)
        toast.error('Failed to load rewards. Showing default rewards instead.')
        
        // Set default rewards on error
        setRewards([
          {
            id: 'eco-warrior',
            name: "🌱 Eco Warrior Badge",
            description: "Achieve your first milestone as an environmental champion",
            cost: 50,
            collectionInfo: "Unlock this badge by earning 50 points",
            category: "achievement",
            isUnlocked: false,
            progress: 0
          },
          {
            id: 'recycling-master',
            name: "♻️ Recycling Master",
            description: "Prove your expertise in waste classification and collection",
            cost: 100,
            collectionInfo: "Unlock this badge by earning 100 points",
            category: "expertise",
            isUnlocked: false,
            progress: 0
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchRewards()
  }, [])

  const handleRedeemReward = async (rewardId: string | number) => {
    toast('Please sign in to redeem rewards and track your progress!')
  }

  const handleRedeemAllPoints = async () => {
    toast('Please sign in to redeem points and track your progress!')
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <Loader className="animate-spin h-8 w-8 text-gray-600" />
    </div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">Rewards & Achievements</h1>
      
      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-md">
        <div className="flex items-center">
          <AlertCircle className="h-6 w-6 text-blue-400 mr-3" />
          <div>
            <p className="text-blue-700 font-medium">View Rewards Freely!</p>
            <p className="text-blue-600 text-sm">Browse all available badges and achievements. Sign in to track your progress and unlock rewards.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">How It Works</h2>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600 font-semibold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Report Waste</p>
                  <p className="text-sm text-gray-600">Earn points by reporting waste in your area</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Collect Waste</p>
                  <p className="text-sm text-gray-600">Help clean up and earn more points</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-purple-600 font-semibold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Unlock Badges</p>
                  <p className="text-sm text-gray-600">Reach point thresholds to unlock achievements</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button 
                onClick={() => window.location.href = '/auth/signin'} 
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                Sign In to Start Earning
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Available Rewards</h2>
          <div className="space-y-4">
            {rewards.length > 0 ? (
              <div className="grid gap-4">
                {/* Achievement Badges Section */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                    🏆 Achievement Badges
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rewards
                      .filter(reward => reward.category === 'achievement' || reward.category === 'expertise')
                      .map(reward => (
                        <div key={reward.id} className="bg-white p-3 rounded-lg border-2 border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800 text-sm">{reward.name}</h4>
                            <span className="text-xs font-semibold text-gray-500">
                              {reward.cost} pts
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{reward.description}</p>
                          <div className="space-y-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${reward.progress || 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500">
                              Sign in to track progress
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Skill Badges Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                    🎯 Skill Badges
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rewards
                      .filter(reward => reward.category === 'skill' || reward.category === 'efficiency')
                      .map(reward => (
                        <div key={reward.id} className="bg-white p-3 rounded-lg border-2 border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800 text-sm">{reward.name}</h4>
                            <span className="text-xs font-semibold text-gray-500">
                              {reward.cost} pts
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{reward.description}</p>
                          <div className="space-y-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${reward.progress || 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500">
                              Sign in to track progress
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Leadership Badges Section */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                    🌟 Leadership Badges
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rewards
                      .filter(reward => reward.category === 'leadership' || reward.category === 'innovation')
                      .map(reward => (
                        <div key={reward.id} className="bg-white p-3 rounded-lg border-2 border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800 text-sm">{reward.name}</h4>
                            <span className="text-xs font-semibold text-gray-500">
                              {reward.cost} pts
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{reward.description}</p>
                          <div className="space-y-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${reward.progress || 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500">
                              Sign in to track progress
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Special Badges Section */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                    🎖️ Special Badges
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rewards
                      .filter(reward => reward.category === 'mastery' || reward.category === 'legendary' || reward.category === 'veteran')
                      .map(reward => (
                        <div key={reward.id} className="bg-white p-3 rounded-lg border-2 border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-800 text-sm">{reward.name}</h4>
                            <span className="text-xs font-semibold text-gray-500">
                              {reward.cost} pts
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{reward.description}</p>
                          <div className="space-y-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${reward.progress || 0}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500">
                              Sign in to track progress
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-6 w-6 text-yellow-400 mr-3" />
                  <p className="text-yellow-700">No rewards available at the moment.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
