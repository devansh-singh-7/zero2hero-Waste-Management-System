'use client'
import { useState, useEffect } from 'react'
import { Trophy, Star, Target, Shield, Heart, Zap, Crown, Award, Lock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '../../components/ui/progress'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/components/providers/AuthProvider'

interface UserStats {
  totalReports: number
  totalEarnings: number
  completedTasks: number
  currentStreak: number
}

interface BadgeReward {
  id: string
  title: string
  description: string
  icon: string
  category: 'reporter' | 'collector' | 'earner' | 'special'
  difficulty: 'bronze' | 'silver' | 'gold' | 'platinum'
  pointsRequired?: number
  reportsRequired?: number
  tasksRequired?: number
  earningsRequired?: number
  achieved: boolean
  progress: number
  total: number
  unlockBonus?: number
}

export default function RewardsPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<UserStats>({
    totalReports: 0,
    totalEarnings: 0,
    completedTasks: 0,
    currentStreak: 0
  })
  const [badges, setBadges] = useState<BadgeReward[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    if (authLoading) return
    loadRewardsData()
  }, [authLoading, user])

  const loadRewardsData = async () => {
    setLoading(true)
    try {
      if (user) {
        // Fetch user stats
        const statsResponse = await fetch('/api/user/stats', { 
          credentials: 'include',
          cache: 'no-store'
        })
        
        if (statsResponse.ok) {
          const userStats = await statsResponse.json()
          setStats({
            totalReports: userStats.totalReports || 0,
            totalEarnings: userStats.totalEarnings || 0,
            completedTasks: userStats.completedTasks || 0,
            currentStreak: userStats.currentStreak || 0
          })
          
          // Generate badges based on stats
          generateBadges(userStats)
        }
      } else {
        // Generate default badges for non-authenticated users
        generateBadges({})
      }
    } catch (error) {
      console.error('Error loading rewards data:', error)
      toast.error('Failed to load rewards data')
      generateBadges({})
    } finally {
      setLoading(false)
    }
  }

  const generateBadges = (userStats: any) => {
    const allBadges: BadgeReward[] = [
      // Reporter Badges
      {
        id: 'first_report',
        title: 'First Reporter',
        description: 'Submit your first waste report',
        icon: '🎯',
        category: 'reporter',
        difficulty: 'bronze',
        reportsRequired: 1,
        achieved: (userStats.totalReports || 0) >= 1,
        progress: Math.min(userStats.totalReports || 0, 1),
        total: 1,
        unlockBonus: 10
      },
      {
        id: 'waste_warrior',
        title: 'Waste Warrior',
        description: 'Report 10 waste incidents',
        icon: '⚔️',
        category: 'reporter', 
        difficulty: 'silver',
        reportsRequired: 10,
        achieved: (userStats.totalReports || 0) >= 10,
        progress: Math.min(userStats.totalReports || 0, 10),
        total: 10,
        unlockBonus: 25
      },
      {
        id: 'environmental_guardian',
        title: 'Environmental Guardian',
        description: 'Report 25 waste incidents',
        icon: '🌍',
        category: 'reporter',
        difficulty: 'gold',
        reportsRequired: 25,
        achieved: (userStats.totalReports || 0) >= 25,
        progress: Math.min(userStats.totalReports || 0, 25),
        total: 25,
        unlockBonus: 100
      },
      {
        id: 'eco_champion',
        title: 'Eco Champion',
        description: 'Report 50 waste incidents',
        icon: '🏆',
        category: 'reporter',
        difficulty: 'platinum',
        reportsRequired: 50,
        achieved: (userStats.totalReports || 0) >= 50,
        progress: Math.min(userStats.totalReports || 0, 50),
        total: 50,
        unlockBonus: 250
      },

      // Collector Badges
      {
        id: 'community_helper',
        title: 'Community Helper',
        description: 'Complete 5 collection tasks',
        icon: '🤝',
        category: 'collector',
        difficulty: 'bronze',
        tasksRequired: 5,
        achieved: (userStats.completedTasks || 0) >= 5,
        progress: Math.min(userStats.completedTasks || 0, 5),
        total: 5,
        unlockBonus: 15
      },
      {
        id: 'collection_expert',
        title: 'Collection Expert',
        description: 'Complete 20 collection tasks',
        icon: '🚛',
        category: 'collector',
        difficulty: 'silver',
        tasksRequired: 20,
        achieved: (userStats.completedTasks || 0) >= 20,
        progress: Math.min(userStats.completedTasks || 0, 20),
        total: 20,
        unlockBonus: 100
      },
      {
        id: 'waste_master',
        title: 'Waste Master',
        description: 'Complete 50 collection tasks',
        icon: '👑',
        category: 'collector',
        difficulty: 'gold',
        tasksRequired: 50,
        achieved: (userStats.completedTasks || 0) >= 50,
        progress: Math.min(userStats.completedTasks || 0, 50),
        total: 50,
        unlockBonus: 200
      },

      // Earner Badges
      {
        id: 'token_collector',
        title: 'Token Collector',
        description: 'Earn 100 tokens',
        icon: '💰',
        category: 'earner',
        difficulty: 'bronze',
        earningsRequired: 100,
        achieved: (userStats.totalEarnings || 0) >= 100,
        progress: Math.min(userStats.totalEarnings || 0, 100),
        total: 100,
        unlockBonus: 20
      },
      {
        id: 'wealth_builder',
        title: 'Wealth Builder',
        description: 'Earn 500 tokens',
        icon: '💎',
        category: 'earner',
        difficulty: 'silver',
        earningsRequired: 500,
        achieved: (userStats.totalEarnings || 0) >= 500,
        progress: Math.min(userStats.totalEarnings || 0, 500),
        total: 500,
        unlockBonus: 100
      },
      {
        id: 'token_tycoon',
        title: 'Token Tycoon',
        description: 'Earn 1000 tokens',
        icon: '🏦',
        category: 'earner',
        difficulty: 'gold',
        earningsRequired: 1000,
        achieved: (userStats.totalEarnings || 0) >= 1000,
        progress: Math.min(userStats.totalEarnings || 0, 1000),
        total: 1000,
        unlockBonus: 250
      },

      // Special Badges
      {
        id: 'early_adopter',
        title: 'Early Adopter',
        description: 'One of the first users of the platform',
        icon: '🌟',
        category: 'special',
        difficulty: 'gold',
        achieved: true, // Give to all current users
        progress: 1,
        total: 1,
        unlockBonus: 50
      },
      {
        id: 'streak_master',
        title: 'Streak Master',
        description: 'Maintain a 7-day activity streak',
        icon: '🔥',
        category: 'special',
        difficulty: 'silver',
        achieved: (userStats.currentStreak || 0) >= 7,
        progress: Math.min(userStats.currentStreak || 0, 7),
        total: 7,
        unlockBonus: 75
      }
    ]

    setBadges(allBadges)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return 'from-orange-400 to-orange-600'
      case 'silver': return 'from-gray-400 to-gray-600'
      case 'gold': return 'from-yellow-400 to-yellow-600'
      case 'platinum': return 'from-purple-400 to-purple-600'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'bronze': return <Award className="h-4 w-4" />
      case 'silver': return <Star className="h-4 w-4" />
      case 'gold': return <Crown className="h-4 w-4" />
      case 'platinum': return <Trophy className="h-4 w-4" />
      default: return <Award className="h-4 w-4" />
    }
  }

  const filteredBadges = selectedCategory === 'all' 
    ? badges 
    : badges.filter(badge => badge.category === selectedCategory)

  const achievedBadges = badges.filter(badge => badge.achieved)
  const totalBadges = badges.length
  const completionPercentage = totalBadges > 0 ? (achievedBadges.length / totalBadges) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Badge Rewards</h1>
          </div>
          <p className="text-gray-600 mb-6">
            Earn badges by completing various activities and milestones
          </p>
          
          {/* Progress Overview */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Your Progress</h3>
                <Badge variant="default" className="bg-green-500">
                  {achievedBadges.length}/{totalBadges} Badges
                </Badge>
              </div>
              <Progress value={completionPercentage} className="h-3 mb-2" />
              <p className="text-sm text-gray-600">
                {completionPercentage.toFixed(1)}% Complete • {totalBadges - achievedBadges.length} badges remaining
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {['all', 'reporter', 'collector', 'earner', 'special'].map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category === 'all' ? 'All Badges' : `${category} Badges`}
            </Button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBadges.map((badge) => (
            <Card 
              key={badge.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
                badge.achieved 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Difficulty Ribbon */}
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${getDifficultyColor(badge.difficulty)} opacity-20`}>
                <div className="absolute top-2 right-2 text-white">
                  {getDifficultyIcon(badge.difficulty)}
                </div>
              </div>

              {/* Achievement Badge */}
              {badge.achieved && (
                <div className="absolute top-3 left-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl p-3 rounded-lg ${badge.achieved ? 'bg-white' : 'bg-gray-100 grayscale'}`}>
                    {badge.achieved ? badge.icon : '🔒'}
                  </div>
                  <div className="flex-1">
                    <CardTitle className={`text-lg ${badge.achieved ? 'text-gray-800' : 'text-gray-500'}`}>
                      {badge.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getDifficultyColor(badge.difficulty).replace('from-', 'border-').replace('to-', 'text-').split(' ')[0]}`}
                      >
                        {badge.difficulty.toUpperCase()}
                      </Badge>
                      {badge.unlockBonus && (
                        <Badge variant="outline" className="text-xs border-green-500 text-green-600">
                          +{badge.unlockBonus} pts
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <CardDescription className="mb-4 text-sm">
                  {badge.description}
                </CardDescription>

                {/* Progress Bar */}
                {!badge.achieved && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Progress</span>
                      <span>{badge.progress}/{badge.total}</span>
                    </div>
                    <Progress 
                      value={(badge.progress / badge.total) * 100} 
                      className="h-2"
                    />
                  </div>
                )}

                {badge.achieved && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Badge Earned!</span>
                  </div>
                )}

                {/* Requirements */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    {badge.reportsRequired && `${badge.reportsRequired} reports required`}
                    {badge.tasksRequired && `${badge.tasksRequired} tasks required`}
                    {badge.earningsRequired && `${badge.earningsRequired} tokens required`}
                    {badge.id === 'early_adopter' && 'Awarded to early platform users'}
                    {badge.id === 'streak_master' && '7-day activity streak required'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredBadges.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No badges found</h3>
            <p className="text-gray-500">Try selecting a different category</p>
          </div>
        )}

        {/* Call to Action */}
        {!user && (
          <Card className="mt-8 bg-gradient-to-r from-green-500 to-blue-600 text-white">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Start Earning Badges Today!</h3>
              <p className="mb-4">Sign up to track your progress and unlock amazing rewards</p>
              <Button variant="secondary" size="lg">
                Get Started
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}