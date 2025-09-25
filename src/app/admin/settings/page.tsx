'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Shield, 
  Database, 
  Bell, 
  Globe, 
  Lock, 
  Mail, 
  Server,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Users,
  BarChart3,
  Trash2,
  Archive,
  Trophy
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { useAlert } from '@/hooks/useAlert'
import AdminProtected from '@/components/AdminProtected'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SystemSettings {
  // Application Settings
  appName: string
  appVersion: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  
  // Security Settings
  sessionTimeout: number // in minutes
  maxLoginAttempts: number
  passwordMinLength: number
  requireEmailVerification: boolean
  twoFactorAuth: boolean
  
  // Notification Settings
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  adminAlerts: boolean
  
  // Reward System Settings
  baseRewardPoints: number
  bonusMultiplier: number
  referralBonus: number
  levelUpThreshold: number
  
  // Data Management
  dataRetentionDays: number
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
  analyticsEnabled: boolean
  
  // API Settings
  rateLimitEnabled: boolean
  maxRequestsPerMinute: number
  apiKeyRequired: boolean
}

export default function AdminSettings() {
  const router = useRouter()
  const { alertState, showSuccess, showError, showConfirm, closeAlert } = useAlert()
  const [settings, setSettings] = useState<SystemSettings>({
    // Application Settings
    appName: 'EcoReward Platform',
    appVersion: '1.0.0',
    maintenanceMode: false,
    registrationEnabled: true,
    
    // Security Settings
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireEmailVerification: false,
    twoFactorAuth: false,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    adminAlerts: true,
    
    // Reward System Settings
    baseRewardPoints: 10,
    bonusMultiplier: 1.5,
    referralBonus: 50,
    levelUpThreshold: 100,
    
    // Data Management
    dataRetentionDays: 365,
    autoBackup: true,
    backupFrequency: 'daily',
    analyticsEnabled: true,
    
    // API Settings
    rateLimitEnabled: true,
    maxRequestsPerMinute: 100,
    apiKeyRequired: false,
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('application')
  const [showSensitive, setShowSensitive] = useState(false)
  const [adminData, setAdminData] = useState<any>(null)

  useEffect(() => {
    loadSettings()
    loadAdminData()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        throw new Error('Failed to load settings')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      showError('Load Failed', 'Failed to load system settings.')
    } finally {
      setLoading(false)
    }
  }

  const loadAdminData = async () => {
    try {
      const response = await fetch('/api/admin/auth/check', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setAdminData(data.admin)
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
    }
  }

  const handleSaveSettings = async () => {
    const confirmed = await showConfirm({
      title: 'Save Settings',
      message: 'Are you sure you want to save these system settings? Some changes may require a system restart.',
      type: 'warning',
      confirmText: 'Save Changes',
      cancelText: 'Cancel'
    })

    if (!confirmed) return

    try {
      setSaving(true)
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        showSuccess('Settings Saved', 'System settings have been updated successfully.')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save system settings. Please try again.'
      showError('Save Failed', errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleMaintenanceMode = async (enabled: boolean) => {
    const confirmed = await showConfirm({
      title: enabled ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode',
      message: enabled 
        ? 'This will make the application unavailable to regular users. Only administrators will be able to access the system.'
        : 'This will make the application available to all users again.',
      type: 'warning',
      confirmText: enabled ? 'Enable' : 'Disable',
      cancelText: 'Cancel'
    })

    if (confirmed) {
      setSettings(prev => ({ ...prev, maintenanceMode: enabled }))
      showSuccess(
        enabled ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
        enabled 
          ? 'The application is now in maintenance mode.'
          : 'The application is now available to all users.'
      )
    }
  }

  const handleResetToDefaults = async () => {
    const confirmed = await showConfirm({
      title: 'Reset to Defaults',
      message: 'Are you sure you want to reset all settings to their default values? This action cannot be undone.',
      type: 'error',
      confirmText: 'Reset All',
      cancelText: 'Cancel'
    })

    if (confirmed) {
      try {
        const response = await fetch('/api/admin/settings', {
          method: 'DELETE',
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          setSettings(data.settings)
          showSuccess('Settings Reset', 'All settings have been reset to their default values.')
        } else {
          throw new Error('Failed to reset settings')
        }
      } catch (error) {
        console.error('Error resetting settings:', error)
        showError('Reset Failed', 'Failed to reset settings. Please try again.')
      }
    }
  }

  const tabs = [
    { id: 'application', label: 'Application', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'rewards', label: 'Rewards', icon: BarChart3 },
    { id: 'data', label: 'Data & Backup', icon: Database },
    { id: 'api', label: 'API', icon: Server },
  ]

  if (loading) {
    return (
      <AdminProtected>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Trophy className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
            <p className="mt-4 text-gray-600">Loading system settings...</p>
          </div>
        </div>
      </AdminProtected>
    )
  }

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Settings className="w-8 h-8 mr-3 text-blue-600" />
                  System Settings
                </h1>
                <p className="text-gray-600 mt-2">
                  Configure system-wide settings and preferences
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/admin" className="text-blue-600 hover:text-blue-800">
                  ← Back to Dashboard
                </Link>
                {adminData && (
                  <div className="text-sm text-gray-500">
                    Logged in as: {adminData.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Maintenance Mode Alert */}
          {settings.maintenanceMode && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">
                    Maintenance Mode Active
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    The application is currently in maintenance mode. Only administrators can access the system.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-4 px-2 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Settings Content */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {/* Application Settings */}
            {activeTab === 'application' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Application Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Application Name
                      </label>
                      <Input
                        value={settings.appName}
                        onChange={(e) => setSettings(prev => ({ ...prev, appName: e.target.value }))}
                        placeholder="Enter application name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Version
                      </label>
                      <Input
                        value={settings.appVersion}
                        onChange={(e) => setSettings(prev => ({ ...prev, appVersion: e.target.value }))}
                        placeholder="1.0.0"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
                          <p className="text-sm text-gray-600">Temporarily disable user access</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.maintenanceMode}
                        onCheckedChange={handleMaintenanceMode}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-green-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">User Registration</h4>
                          <p className="text-sm text-gray-600">Allow new users to register</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.registrationEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, registrationEnabled: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Security Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <Input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          sessionTimeout: parseInt(e.target.value) || 60 
                        }))}
                        min="5"
                        max="1440"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Login Attempts
                      </label>
                      <Input
                        type="number"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          maxLoginAttempts: parseInt(e.target.value) || 5 
                        }))}
                        min="1"
                        max="10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Password Length
                      </label>
                      <Input
                        type="number"
                        value={settings.passwordMinLength}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          passwordMinLength: parseInt(e.target.value) || 8 
                        }))}
                        min="6"
                        max="20"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Email Verification</h4>
                          <p className="text-sm text-gray-600">Require email verification for new accounts</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.requireEmailVerification}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, requireEmailVerification: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center">
                        <Key className="w-5 h-5 text-purple-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600">Enable 2FA for enhanced security</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.twoFactorAuth}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, twoFactorAuth: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Configuration</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                          <p className="text-sm text-gray-600">Send notifications via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, emailNotifications: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <Bell className="w-5 h-5 text-green-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                          <p className="text-sm text-gray-600">Browser push notifications</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, pushNotifications: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Admin Alerts</h4>
                          <p className="text-sm text-gray-600">Critical system alerts for administrators</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.adminAlerts}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, adminAlerts: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Reward System Settings */}
            {activeTab === 'rewards' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Reward System Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Reward Points
                      </label>
                      <Input
                        type="number"
                        value={settings.baseRewardPoints}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          baseRewardPoints: parseInt(e.target.value) || 10 
                        }))}
                        min="1"
                        max="100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Points awarded for basic actions</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bonus Multiplier
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={settings.bonusMultiplier}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          bonusMultiplier: parseFloat(e.target.value) || 1.5 
                        }))}
                        min="1.0"
                        max="5.0"
                      />
                      <p className="text-xs text-gray-500 mt-1">Multiplier for bonus rewards</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Referral Bonus
                      </label>
                      <Input
                        type="number"
                        value={settings.referralBonus}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          referralBonus: parseInt(e.target.value) || 50 
                        }))}
                        min="0"
                        max="500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Points for successful referrals</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Level Up Threshold
                      </label>
                      <Input
                        type="number"
                        value={settings.levelUpThreshold}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          levelUpThreshold: parseInt(e.target.value) || 100 
                        }))}
                        min="10"
                        max="1000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Points needed to advance levels</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Data Management Settings */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Retention (days)
                      </label>
                      <Input
                        type="number"
                        value={settings.dataRetentionDays}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          dataRetentionDays: parseInt(e.target.value) || 365 
                        }))}
                        min="30"
                        max="3650"
                      />
                      <p className="text-xs text-gray-500 mt-1">How long to keep user data</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Backup Frequency
                      </label>
                      <select
                        value={settings.backupFrequency}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly'
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <Archive className="w-5 h-5 text-green-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Automatic Backup</h4>
                          <p className="text-sm text-gray-600">Enable automatic data backups</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.autoBackup}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, autoBackup: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <BarChart3 className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Analytics Tracking</h4>
                          <p className="text-sm text-gray-600">Collect usage analytics and statistics</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.analyticsEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, analyticsEnabled: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* API Settings */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Requests Per Minute
                      </label>
                      <Input
                        type="number"
                        value={settings.maxRequestsPerMinute}
                        onChange={(e) => setSettings(prev => ({ 
                          ...prev, 
                          maxRequestsPerMinute: parseInt(e.target.value) || 100 
                        }))}
                        min="10"
                        max="1000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Rate limit for API requests</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-yellow-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Rate Limiting</h4>
                          <p className="text-sm text-gray-600">Enable API rate limiting</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.rateLimitEnabled}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, rateLimitEnabled: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center">
                        <Key className="w-5 h-5 text-red-600 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">API Key Required</h4>
                          <p className="text-sm text-gray-600">Require API keys for external access</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.apiKeyRequired}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, apiKeyRequired: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleResetToDefaults}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

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