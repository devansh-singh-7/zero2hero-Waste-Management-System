'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Users, 
  Trash2, 
  BarChart3, 
  Settings, 
  LogOut,
  Home,
  MapPin,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import AdminProtected from '@/components/AdminProtected'
import Link from 'next/link'

interface AdminStats {
  totalUsers: number
  totalReports: number
  pendingTasks: number
  completedTasks: number
  totalTokensDistributed: number
}

interface StatCard {
  title: string
  value: number
  description: string
  icon: any
  color: string
  bgColor: string
}

export default function AdminDashboard() {
  const [adminData, setAdminData] = useState<any>(null)
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalReports: 0,
    pendingTasks: 0,
    completedTasks: 0,
    totalTokensDistributed: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch dashboard data function
  const fetchDashboardData = async () => {
    
    try {
      // Get admin info
      const adminResponse = await fetch('/api/admin/auth/check', {
        credentials: 'include'
      })
      if (adminResponse.ok) {
        const adminInfo = await adminResponse.json()
        setAdminData(adminInfo.admin)
      }

      // Fetch real-time stats with cache busting
      const timestamp = Date.now()
      const statsResponse = await fetch(`/api/admin/stats?t=${timestamp}`, { 
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      })

      if (statsResponse.ok) {
        const platformStats = await statsResponse.json()
        
        // Also get admin-specific data for user management
        const [usersRes, collectionTasksRes] = await Promise.all([
          fetch(`/api/admin/users?t=${timestamp}`, { 
            credentials: 'include',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          }),
          fetch(`/api/admin/collection-tasks?t=${timestamp}`, { 
            credentials: 'include',
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          })
        ])

        const users = usersRes.ok ? await usersRes.json() : []
        const tasks = collectionTasksRes.ok ? await collectionTasksRes.json() : { tasks: [] }

        const usersArray = Array.isArray(users) ? users : []
        const tasksArray = Array.isArray(tasks.tasks) ? tasks.tasks : []

        const pendingTasks = tasksArray.filter((task: any) => task.status === 'pending').length
        const completedTasks = tasksArray.filter((task: any) => task.status === 'completed' || task.status === 'verified').length

        setStats({
          totalUsers: platformStats.totalUsers || usersArray.length,
          totalReports: platformStats.totalReports || 0,
          pendingTasks,
          completedTasks,
          totalTokensDistributed: usersArray.reduce((sum: number, user: any) => sum + (user.balance || 0), 0)
        })

        // Only log stats in development mode and limit frequency
        if (process.env.NODE_ENV === 'development') {
          console.log('Dashboard stats updated:', {
            users: platformStats.totalUsers,
            reports: platformStats.totalReports,
            pending: pendingTasks,
            completed: completedTasks
          })
        }
      } else {
        throw new Error('Failed to fetch platform stats')
      }

    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Auto-refresh every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 10000)

    return () => clearInterval(interval)
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

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Console</h1>
                <p className="text-sm text-gray-600">Zero2Hero Waste Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {adminData?.name || 'Admin'}
              </span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
            <nav className="p-6">
              <ul className="space-y-2">
                <li>
                  <Link href="/admin" className="flex items-center p-3 text-gray-700 rounded-lg bg-green-50 border border-green-200">
                    <Home className="h-5 w-5 mr-3" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/admin/collections" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Trash2 className="h-5 w-5 mr-3" />
                    Waste Collection
                  </Link>
                </li>
                <li>
                  <Link href="/admin/users" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Users className="h-5 w-5 mr-3" />
                    User Management
                  </Link>
                </li>
                <li>
                  <Link href="/admin/analytics" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50">
                    <BarChart3 className="h-5 w-5 mr-3" />
                    Analytics & Reports
                  </Link>
                </li>
                <li>
                  <Link href="/admin/settings" className="flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-50">
                    <Settings className="h-5 w-5 mr-3" />
                    Settings
                  </Link>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard Overview</h2>
                <p className="text-gray-600">Monitor and manage the Zero2Hero waste management system</p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                  <p className="text-xs text-gray-500 mt-1">Registered users</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Total Reports</CardTitle>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalReports}</div>
                  <p className="text-xs text-gray-500 mt-1">Waste reports submitted</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Pending Tasks</CardTitle>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</div>
                  <p className="text-xs text-gray-500 mt-1">Awaiting collection</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-700">Completed Tasks</CardTitle>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stats.completedTasks}</div>
                  <p className="text-xs text-gray-500 mt-1">Successfully collected</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-800">
                    <div className="p-2 bg-green-100 rounded-lg mr-3">
                      <Trash2 className="h-5 w-5 text-green-600" />
                    </div>
                    Waste Collection
                  </CardTitle>
                  <CardDescription>
                    Manage waste collection tasks and assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/collections">
                    <Button className="w-full bg-black hover:bg-gray-800 text-white">
                      Open Collection Manager
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-800">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    User Management
                  </CardTitle>
                  <CardDescription>
                    View and manage user accounts and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/users">
                    <Button variant="outline" className="w-full">
                      Manage Users
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center text-gray-800">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    Analytics
                  </CardTitle>
                  <CardDescription>
                    View detailed reports and system analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin/analytics">
                    <Button variant="outline" className="w-full">
                      View Reports
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            {/* Live Status Indicator */}
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-medium text-green-800">System Status: Online</span>
                  </div>
                  <div className="ml-6 text-sm text-green-600">
                    Auto-refresh: Active (10s intervals)
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AdminProtected>
  )
}
