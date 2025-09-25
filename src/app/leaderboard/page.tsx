'use client'
import { useState, useEffect } from 'react'
import { Loader, Award, User, Trophy, Crown, Medal, Star, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

type LeaderboardUser = {
  rank: number
  id: number
  userName: string
  balance: number
  reportsSubmitted: number
  tasksCompleted: number
  score: number
  badges: string[]
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const fetchLeaderboard = async () => {
    try {
      console.log('🔄 Starting leaderboard fetch...')
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/leaderboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📦 Received data:', data)
        console.log('👥 Leaderboard array:', data.leaderboard)
        console.log('📊 Total users:', data.totalUsers)
        
        if (data.leaderboard && Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard)
          setDebugInfo({
            totalUsers: data.totalUsers,
            hasData: data.leaderboard.length > 0,
            lastUpdated: data.lastUpdated
          })
          console.log('✅ Leaderboard state updated with', data.leaderboard.length, 'users')
        } else {
          console.log('⚠️ Invalid leaderboard data structure')
          setError('Invalid data format received')
        }
      } else {
        const errorData = await response.json()
        console.error('❌ API Error:', errorData)
        setError(`Failed to load leaderboard: ${errorData.error || 'Unknown error'}`)
        toast.error('Failed to load leaderboard.')
      }
    } catch (err) {
      console.error('❌ Fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`Network error: ${errorMessage}`)
      toast.error('An error occurred while loading leaderboard.')
    } finally {
      setLoading(false)
      console.log('🏁 Leaderboard fetch completed')
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />
      case 2: return <Medal className="h-6 w-6 text-gray-400" />
      case 3: return <Award className="h-6 w-6 text-amber-600" />
      default: return <Star className="h-5 w-5 text-gray-400" />
    }
  }

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return "border-yellow-200 bg-yellow-50"
      case 2: return "border-gray-200 bg-gray-50"
      case 3: return "border-amber-200 bg-amber-50"
      default: return "border-gray-100 bg-white"
    }
  }

  return (
    <div className="p-4 lg:p-8 bg-white shadow-md rounded-lg">
      <div className="flex items-center mb-6">
        <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-800">Leaderboard</h1>
      </div>
      
      {/* Debug Info */}
      {debugInfo && (
        <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
          <strong>Debug Info:</strong> Total Users: {debugInfo.totalUsers}, 
          Has Data: {debugInfo.hasData ? 'Yes' : 'No'}, 
          Last Updated: {debugInfo.lastUpdated}
        </div>
      )}
      
      {loading ? (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</p>
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchLeaderboard} 
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Try Again
          </button>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No users found yet.</p>
          <p className="text-gray-400">Be the first to make an impact!</p>
          <div className="mt-4 p-4 bg-gray-100 rounded text-sm text-gray-600">
            <p>Debug: Leaderboard array length: {leaderboard.length}</p>
            <p>Loading: {loading ? 'true' : 'false'}</p>
            <p>Error: {error || 'none'}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard.map((user) => (
            <div 
              key={user.id} 
              className={`p-6 border-2 rounded-xl transition-all hover:shadow-md ${getRankStyle(user.rank)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {getRankIcon(user.rank)}
                    <span className="ml-2 text-2xl font-bold text-gray-700">
                      #{user.rank}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {user.userName}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>📊 {user.reportsSubmitted} reports</span>
                      <span>🚛 {user.tasksCompleted} tasks</span>
                      <span>💰 {user.balance} tokens</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {user.score}
                  </div>
                  <div className="text-sm text-gray-500">Total Score</div>
                </div>
              </div>
              
              {user.badges.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Achievements:</div>
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map((badge, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}