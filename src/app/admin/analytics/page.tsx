'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  ArrowLeft,
  BarChart3,
  Users,
  FileText,
  Clock,
  CheckCircle,
  PlayCircle,
  TrendingUp,
  Award,
  Calendar,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import AdminProtected from '@/components/AdminProtected'
import Link from 'next/link'

interface Analytics {
  overview: {
    totalUsers: number
    totalReports: number
    pendingTasks: number
    completedTasks: number
    inProgressTasks: number
    totalTasks: number
    totalTokensDistributed: number
  }
  recent: {
    reportsLastWeek: number
    usersLastWeek: number
    reportsLastMonth: number
    usersLastMonth: number
  }
  topUsers: Array<{
    id: number
    name: string
    email: string
    balance: number
  }>
  recentActivity: Array<{
    id: number
    type: string
    location: string
    status: string
    createdAt: string
    userId: number
    userName: string
  }>
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [adminData, setAdminData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get admin info
        const adminResponse = await fetch('/api/admin/auth/check', {
          credentials: 'include'
        })
        if (adminResponse.ok) {
          const adminInfo = await adminResponse.json()
          setAdminData(adminInfo.admin)
        }

        // Fetch analytics
        const analyticsResponse = await fetch('/api/admin/analytics', {
          credentials: 'include'
        })
        
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          setAnalytics(analyticsData)
        } else {
          throw new Error('Failed to fetch analytics')
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
        toast.error('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      localStorage.removeItem('adminEmail')
      toast.success('Logged out successfully')
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Logout failed')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTaskCompletionRate = () => {
    if (!analytics?.overview.totalTasks) return 0
    return Math.round((analytics.overview.completedTasks / analytics.overview.totalTasks) * 100)
  }

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <Link href="/admin" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
                <p className="text-sm text-gray-600">System performance and statistics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {adminData?.name || 'Admin'}
              </span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {analytics?.overview.totalUsers || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +{analytics?.recent.usersLastWeek || 0} this week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                    <FileText className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {analytics?.overview.totalReports || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +{analytics?.recent.reportsLastWeek || 0} this week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {analytics?.overview.totalTasks || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getTaskCompletionRate()}% completion rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tokens Distributed</CardTitle>
                    <Award className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {analytics?.overview.totalTokensDistributed || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across all users
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Task Status */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Task Status Overview
                    </CardTitle>
                    <CardDescription>Current status of all waste collection tasks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                        <span className="text-sm font-medium">Pending</span>
                      </div>
                      <span className="text-xl font-bold text-yellow-500">
                        {analytics?.overview.pendingTasks || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <PlayCircle className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium">In Progress</span>
                      </div>
                      <span className="text-xl font-bold text-blue-500">
                        {analytics?.overview.inProgressTasks || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                      <span className="text-xl font-bold text-green-500">
                        {analytics?.overview.completedTasks || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Growth Statistics
                    </CardTitle>
                    <CardDescription>Recent activity and growth metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Users (Last Week)</span>
                      <span className="text-lg font-bold text-blue-600">
                        +{analytics?.recent.usersLastWeek || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Users (Last Month)</span>
                      <span className="text-lg font-bold text-blue-600">
                        +{analytics?.recent.usersLastMonth || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Reports (Last Week)</span>
                      <span className="text-lg font-bold text-purple-600">
                        +{analytics?.recent.reportsLastWeek || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Reports (Last Month)</span>
                      <span className="text-lg font-bold text-purple-600">
                        +{analytics?.recent.reportsLastMonth || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Users and Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Top Users by Tokens
                    </CardTitle>
                    <CardDescription>Users with highest token balances</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.topUsers && analytics.topUsers.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.topUsers.map((user, index) => (
                          <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-green-600">
                                  {index + 1}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                            <span className="font-bold text-green-600">
                              {Number(user.balance) || 0} tokens
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No user data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>Latest waste reports and activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
                      <div className="space-y-3">
                        {analytics.recentActivity.map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium text-gray-900">
                                {activity.type} Report
                              </div>
                              <div className="text-sm text-gray-500">
                                by {activity.userName} • {activity.location}
                              </div>
                              <div className="text-xs text-gray-400">
                                {formatDate(activity.createdAt)}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              activity.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : activity.status === 'in-progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {activity.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No recent activity</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminProtected>
  )
}
