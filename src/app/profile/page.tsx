'use client'

import { useState, useEffect, useRef } from 'react'
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Award,
  Recycle,
  TrendingUp,
  Star,
  Edit2,
  Save,
  X,
  Coins,
  Target,
  BarChart3,
  Upload,
  Camera,
  Trophy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/providers/AuthProvider'
import { toast } from 'react-hot-toast'
import AuthGuard from '@/components/AuthGuard'

interface UserProfile {
  id: number
  name: string
  email: string
  balance: number
  createdAt: string
  image?: string
}

interface UserStats {
  totalReports: number
  totalEarnings: number
  completedTasks: number
  currentRank?: number
  wasteCollected: string
  co2Saved: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  achieved: boolean
  progress: number
  total: number
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      loadProfileData()
    }
  }, [user])

  useEffect(() => {
    if (stats) {
      loadAchievements()
    }
  }, [stats])

  const loadProfileData = async () => {
    try {
      // Load profile
      const profileRes = await fetch('/api/user/profile', {
        credentials: 'include'
      })
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile(profileData.profile)
        setEditName(profileData.profile.name || '')
      } else {
        throw new Error('Failed to load profile')
      }

      // Load user stats
      const statsRes = await fetch('/api/user/stats', {
        credentials: 'include'
      })
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      } else {
        // Fallback stats if API fails
        setStats({
          totalReports: 0,
          totalEarnings: 0,
          completedTasks: 0,
          currentRank: undefined,
          wasteCollected: '0 kg',
          co2Saved: '0 kg'
        })
      }

      // Load achievements based on user stats
      loadAchievements()

    } catch (error) {
      console.error('Error loading profile data:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const loadAchievements = () => {
    // Load achievements based on real user data - matching rewards page
    const userAchievements: Achievement[] = [
      {
        id: 'first_report',
        title: 'First Reporter',
        description: 'Submit your first waste report',
        icon: '🎯',
        achieved: (stats?.totalReports || 0) >= 1,
        progress: Math.min(stats?.totalReports || 0, 1),
        total: 1
      },
      {
        id: 'waste_warrior',
        title: 'Waste Warrior',
        description: 'Report 10 waste incidents',
        icon: '⚔️',
        achieved: (stats?.totalReports || 0) >= 10,
        progress: Math.min(stats?.totalReports || 0, 10),
        total: 10
      },
      {
        id: 'environmental_guardian',
        title: 'Environmental Guardian',
        description: 'Report 25 waste incidents',
        icon: '🌍',
        achieved: (stats?.totalReports || 0) >= 25,
        progress: Math.min(stats?.totalReports || 0, 25),
        total: 25
      },
      {
        id: 'token_collector',
        title: 'Token Collector',
        description: 'Earn 100 tokens',
        icon: '💰',
        achieved: (stats?.totalEarnings || 0) >= 100,
        progress: Math.min(stats?.totalEarnings || 0, 100),
        total: 100
      },
      {
        id: 'wealth_builder',
        title: 'Wealth Builder',
        description: 'Earn 500 tokens',
        icon: '💎',
        achieved: (stats?.totalEarnings || 0) >= 500,
        progress: Math.min(stats?.totalEarnings || 0, 500),
        total: 500
      },
      {
        id: 'community_helper',
        title: 'Community Helper',
        description: 'Complete 5 collection tasks',
        icon: '🤝',
        achieved: (stats?.completedTasks || 0) >= 5,
        progress: Math.min(stats?.completedTasks || 0, 5),
        total: 5
      },
      {
        id: 'collection_expert',
        title: 'Collection Expert',
        description: 'Complete 20 collection tasks',
        icon: '🚛',
        achieved: (stats?.completedTasks || 0) >= 20,
        progress: Math.min(stats?.completedTasks || 0, 20),
        total: 20
      },
      {
        id: 'early_adopter',
        title: 'Early Adopter',
        description: 'One of the first users',
        icon: '🌟',
        achieved: true,
        progress: 1,
        total: 1
      }
    ]

    setAchievements(userAchievements)
  }

  const handleSaveName = async () => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: editName.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setProfile(data.profile)
        setIsEditing(false)
        toast.success('Name updated successfully!')
      } else {
        throw new Error(data.error || 'Failed to update name')
      }
    } catch (error) {
      console.error('Error updating name:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update name')
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setUploadingImage(true)

    try {
      // Convert image to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string

        // Show preview immediately
        if (profile) {
          setProfile({ ...profile, image: base64String })
        }

        // Update profile with new image
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ image: base64String }),
        })

        if (response.ok) {
          const data = await response.json()
          setProfile(data.profile)
          toast.success('Profile picture updated successfully!')
        } else {
          throw new Error('Failed to update profile picture')
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to update profile picture')
      // Reload profile data on error
      loadProfileData()
    } finally {
      setUploadingImage(false)
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Manage your account and track your environmental impact</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-4">
                      {profile?.image ? (
                        <img
                          src={profile.image}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center border-4 border-green-200">
                          <User className="h-12 w-12 text-green-600" />
                        </div>
                      )}
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="flex items-center gap-2"
                      >
                        {uploadingImage ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4" />
                            Change Photo
                          </>
                        )}
                      </Button>
                      {profile?.image && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setUploadingImage(true)
                            try {
                              const response = await fetch('/api/user/profile', {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                credentials: 'include',
                                body: JSON.stringify({ image: null }),
                              })
                              if (response.ok) {
                                const data = await response.json()
                                setProfile(data.profile)
                                toast.success('Profile picture removed!')
                              }
                            } catch (error) {
                              toast.error('Failed to remove photo')
                            } finally {
                              setUploadingImage(false)
                            }
                          }}
                          disabled={uploadingImage}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    {isEditing ? (
                      <div className="mt-1 flex gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Enter your name"
                        />
                        <Button
                          size="sm"
                          onClick={handleSaveName}
                          disabled={saving}
                        >
                          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false)
                            setEditName(profile?.name || '')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-gray-900">{profile?.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{profile?.email}</span>
                    </div>
                  </div>

                  {/* Join Date */}
                  <div>
                    <label className="text-sm font-medium text-gray-700">Member Since</label>
                    <div className="mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {profile?.createdAt ? formatDate(profile.createdAt) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats and Achievements */}
            <div className="lg:col-span-2 space-y-8">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Reports</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.totalReports || 0}</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Waste Collected</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.wasteCollected || '0 kg'}</p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Recycle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">CO₂ Saved</p>
                        <p className="text-2xl font-bold text-gray-900">{stats?.co2Saved || '0 kg'}</p>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Current Rank</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats?.currentRank ? `#${stats.currentRank}` : 'Unranked'}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Star className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Achievements
                  </CardTitle>
                  <CardDescription>
                    Track your progress and unlock new achievements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className={`p-4 rounded-lg border-2 transition-all ${achievement.achieved
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {achievement.title}
                              </h3>
                              {achievement.achieved && (
                                <Badge variant="default" className="bg-green-500">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {achievement.description}
                            </p>
                            {!achievement.achieved && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Progress</span>
                                  <span>{achievement.progress}/{achievement.total}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-500 h-2 rounded-full transition-all"
                                    style={{
                                      width: `${(achievement.progress / achievement.total) * 100}%`
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
