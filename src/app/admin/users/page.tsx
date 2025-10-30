'use client'

import { useState, useEffect } from 'react'
import { 
  Shield, 
  Users, 
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  ArrowLeft,
  Trash2,
  Edit,
  TrendingUp,
  Trophy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { useAlert } from '@/hooks/useAlert'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import AdminProtected from '@/components/AdminProtected'
import Link from 'next/link'

interface User {
  id: number
  name: string
  email: string
  balance: number
  createdAt: string
  updatedAt: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [adminData, setAdminData] = useState<any>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    password: '',
    balance: 0
  })
  const [showEditModal, setShowEditModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const { alertState, showConfirm, showSuccess, showError, closeAlert } = useAlert()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const adminResponse = await fetch('/api/admin/auth/check', {
          credentials: 'include'
        })
        if (adminResponse.ok) {
          const adminInfo = await adminResponse.json()
          setAdminData(adminInfo.admin)
        }

        const usersResponse = await fetch('/api/admin/users', {
          credentials: 'include'
        })
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData)
          setFilteredUsers(usersData)
        } else {
          throw new Error('Failed to fetch users')
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeleteUser = async (userId: number, userName: string) => {
    const confirmed = await showConfirm({
      title: 'Delete User',
      message: `Are you sure you want to delete user "${userName}"? This action cannot be undone and will permanently remove all their data.`,
      type: 'error',
      confirmText: 'Delete User',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setUsers(prev => prev.filter(user => user.id !== userId))
        setFilteredUsers(prev => prev.filter(user => user.id !== userId))
        showSuccess('User Deleted', `User "${userName}" has been deleted successfully.`)
      } else {
        throw new Error('Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      showError('Deletion Failed', 'Failed to delete user. Please try again.')
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditFormData({
      name: user.name,
      email: user.email,
      password: '', 
      balance: Number(user.balance) || 0
    })
    setShowEditModal(true)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    if (!editFormData.name.trim() || !editFormData.email.trim()) {
      toast.error('Name and email are required')
      return
    }

    if (editFormData.balance < 0) {
      toast.error('Balance cannot be negative')
      return
    }

    setIsUpdating(true)
    try {
      const updateData: any = {
        id: editingUser.id,
        name: editFormData.name.trim(),
        email: editFormData.email.trim(),
        balance: editFormData.balance
      }

      if (editFormData.password.trim()) {
        updateData.password = editFormData.password.trim()
      }

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const result = await response.json()
        const updatedUser = result.user

        setUsers(prev => prev.map(user => 
          user.id === editingUser.id ? updatedUser : user
        ))
        setFilteredUsers(prev => prev.map(user => 
          user.id === editingUser.id ? updatedUser : user
        ))

        toast.success(`User "${updatedUser.name}" updated successfully`)
        setShowEditModal(false)
        setEditingUser(null)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingUser(null)
    setEditFormData({
      name: '',
      email: '',
      password: '',
      balance: 0
    })
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
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                <p className="text-sm text-gray-600">Manage registered users</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {adminData?.name || 'Admin'}
              </span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <UserX className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active registered users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.reduce((sum, user) => sum + Number(user.balance || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Distributed across all users
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New This Week</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(user => {
                    const userDate = new Date(user.createdAt)
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return userDate >= weekAgo
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(user => {
                    const userDate = new Date(user.createdAt)
                    const monthAgo = new Date()
                    monthAgo.setMonth(monthAgo.getMonth() - 1)
                    return userDate >= monthAgo
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Registered Users</CardTitle>
                  <CardDescription>
                    Manage and view all registered users in the system
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <Trophy className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
                    <p className="mt-4 text-gray-600">Loading users...</p>
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm ? 'No users found matching your search' : 'No users registered yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Balance</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Joined Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-green-600 font-medium">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-900">{user.email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <span className="text-lg font-semibold text-green-600">
                                {Number(user.balance) || 0} tokens
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-600">{formatDate(user.createdAt)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteUser(user.id, user.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Edit User</h2>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <Input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    placeholder="Enter user name"
                    disabled={isUpdating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    placeholder="Enter email address"
                    disabled={isUpdating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password (optional)
                  </label>
                  <Input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      password: e.target.value
                    }))}
                    placeholder="Leave empty to keep current password"
                    disabled={isUpdating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep the current password
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token Balance
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={editFormData.balance}
                    onChange={(e) => setEditFormData(prev => ({
                      ...prev,
                      balance: Number(e.target.value) || 0
                    }))}
                    placeholder="Enter token balance"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button 
                  variant="outline" 
                  onClick={handleCloseEditModal}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateUser}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isUpdating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update User'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Dialog */}
        <AlertDialog
          isOpen={alertState.isOpen}
          onClose={closeAlert}
          onConfirm={alertState.onConfirm}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          confirmText={alertState.confirmText}
          cancelText={alertState.cancelText}
          showCancel={alertState.showCancel}
        />
      </div>
    </AdminProtected>
  )
}
