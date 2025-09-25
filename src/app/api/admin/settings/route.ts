import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// This would typically be stored in a database
// For now, we'll simulate it with in-memory storage
let systemSettings = {
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
}

// GET - Fetch current system settings
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const authCheck = await fetch(new URL('/api/admin/auth/check', request.url), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    })
    
    if (!authCheck.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      settings: systemSettings
    })
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    )
  }
}

// PUT - Update system settings
export async function PUT(request: NextRequest) {
  try {
    // Check if user is admin
    const authCheck = await fetch(new URL('/api/admin/auth/check', request.url), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    })
    
    if (!authCheck.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updatedSettings = await request.json()
    
    // Validate required fields
    if (!updatedSettings.appName || !updatedSettings.appVersion) {
      return NextResponse.json(
        { error: 'App name and version are required' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (updatedSettings.sessionTimeout < 5 || updatedSettings.sessionTimeout > 1440) {
      return NextResponse.json(
        { error: 'Session timeout must be between 5 and 1440 minutes' },
        { status: 400 }
      )
    }

    if (updatedSettings.passwordMinLength < 6 || updatedSettings.passwordMinLength > 20) {
      return NextResponse.json(
        { error: 'Password minimum length must be between 6 and 20 characters' },
        { status: 400 }
      )
    }

    if (updatedSettings.maxLoginAttempts < 1 || updatedSettings.maxLoginAttempts > 10) {
      return NextResponse.json(
        { error: 'Max login attempts must be between 1 and 10' },
        { status: 400 }
      )
    }

    // Update settings
    systemSettings = { ...systemSettings, ...updatedSettings }

    // In a real application, you would save these to a database
    console.log('System settings updated:', systemSettings)

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      settings: systemSettings
    })
  } catch (error) {
    console.error('Error updating system settings:', error)
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    )
  }
}

// DELETE - Reset settings to defaults
export async function DELETE(request: NextRequest) {
  try {
    // Check if user is admin
    const authCheck = await fetch(new URL('/api/admin/auth/check', request.url), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    })
    
    if (!authCheck.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Reset to default settings
    systemSettings = {
      appName: 'EcoReward Platform',
      appVersion: '1.0.0',
      maintenanceMode: false,
      registrationEnabled: true,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireEmailVerification: false,
      twoFactorAuth: false,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      adminAlerts: true,
      baseRewardPoints: 10,
      bonusMultiplier: 1.5,
      referralBonus: 50,
      levelUpThreshold: 100,
      dataRetentionDays: 365,
      autoBackup: true,
      backupFrequency: 'daily',
      analyticsEnabled: true,
      rateLimitEnabled: true,
      maxRequestsPerMinute: 100,
      apiKeyRequired: false,
    }

    console.log('System settings reset to defaults')

    return NextResponse.json({
      success: true,
      message: 'System settings reset to defaults',
      settings: systemSettings
    })
  } catch (error) {
    console.error('Error resetting system settings:', error)
    return NextResponse.json(
      { error: 'Failed to reset system settings' },
      { status: 500 }
    )
  }
}