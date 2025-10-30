import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

let systemSettings = {
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

export async function GET(request: NextRequest) {
  try {
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

export async function PUT(request: NextRequest) {
  try {
    const authCheck = await fetch(new URL('/api/admin/auth/check', request.url), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    })
    
    if (!authCheck.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updatedSettings = await request.json()
    
    if (!updatedSettings.appName || !updatedSettings.appVersion) {
      return NextResponse.json(
        { error: 'App name and version are required' },
        { status: 400 }
      )
    }

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

    systemSettings = { ...systemSettings, ...updatedSettings }

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

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await fetch(new URL('/api/admin/auth/check', request.url), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    })
    
    if (!authCheck.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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