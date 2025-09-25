'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Download, 
  Calendar, 
  CheckCircle, 
  Gift,
  Camera,
  Eye,
  Trash2,
  MapPin,
  Trophy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import AuthCheck from '@/components/AuthCheck'
import Link from 'next/link'

interface Notification {
  id: number
  message: string
  type: string
  isRead: boolean
  imageUrl?: string | null
  metadata?: any
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/user/notifications', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      } else {
        throw new Error('Failed to fetch notifications')
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const downloadImage = async (imageUrl: string, fileName?: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || `collection-photo-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Photo downloaded successfully!')
    } catch (error) {
      console.error('Error downloading image:', error)
      toast.error('Failed to download photo')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'completion_with_photo':
        return <Camera className="h-5 w-5 text-green-600" />
      case 'reward':
        return <Gift className="h-5 w-5 text-yellow-600" />
      default:
        return <Bell className="h-5 w-5 text-blue-600" />
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

  return (
    <AuthCheck>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <Bell className="h-8 w-8 text-green-600" />
                  Notifications
                </h1>
                <p className="text-gray-600 mt-2">
                  Stay updated with your waste collection activities and rewards
                </p>
              </div>
              <Link href="/">
                <Button variant="outline">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Notifications</p>
                    <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
                  </div>
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unread</p>
                    <p className="text-2xl font-bold text-green-600">
                      {notifications.filter(n => !n.isRead).length}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">With Photos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {notifications.filter(n => n.imageUrl).length}
                    </p>
                  </div>
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <Trophy className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
                <p className="mt-4 text-gray-600">Loading notifications...</p>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No notifications yet</h3>
                <p className="text-gray-500">
                  Start reporting waste to receive updates and rewards!
                </p>
                <Link href="/collect">
                  <Button className="mt-4">
                    Report Waste
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all hover:shadow-md ${
                    !notification.isRead ? 'border-l-4 border-l-green-500 bg-green-50' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1">
                          <p className="text-gray-800 mb-2 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          {/* Metadata Display */}
                          {notification.metadata && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
                              <div className="grid grid-cols-2 gap-2">
                                {notification.metadata.wasteType && (
                                  <div>
                                    <span className="font-medium text-gray-600">Waste Type:</span>
                                    <span className="ml-2 text-gray-800">{notification.metadata.wasteType}</span>
                                  </div>
                                )}
                                {notification.metadata.location && (
                                  <div className="flex items-center">
                                    <MapPin className="h-3 w-3 text-gray-500 mr-1" />
                                    <span className="text-gray-600 text-xs">{notification.metadata.location}</span>
                                  </div>
                                )}
                                {notification.metadata.rewardAmount && (
                                  <div>
                                    <span className="font-medium text-gray-600">Reward:</span>
                                    <span className="ml-2 text-green-600 font-bold">
                                      {notification.metadata.rewardAmount} tokens
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Photo Section */}
                          {notification.imageUrl && (
                            <div className="bg-blue-50 rounded-lg p-4 mb-3">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-blue-800 flex items-center gap-2">
                                  <Camera className="h-4 w-4" />
                                  Collection Completion Photo
                                </h4>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                <img 
                                  src={notification.imageUrl} 
                                  alt="Collection completion" 
                                  className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setSelectedImage(notification.imageUrl || null)}
                                />
                                
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedImage(notification.imageUrl || null)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => downloadImage(
                                      notification.imageUrl!, 
                                      `collection-${notification.id}-${Date.now()}.jpg`
                                    )}
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(notification.createdAt)}
                            </div>
                            
                            {!notification.isRead && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            onClick={() => setSelectedImage(null)}
          >
            <div className="max-w-4xl max-h-4xl p-4">
              <img 
                src={selectedImage} 
                alt="Collection completion" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              <div className="flex justify-center mt-4 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => downloadImage(selectedImage, `collection-photo-${Date.now()}.jpg`)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={() => setSelectedImage(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthCheck>
  )
}
