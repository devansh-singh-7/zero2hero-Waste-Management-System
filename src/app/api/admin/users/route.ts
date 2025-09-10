import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Users, Reports, CollectedWastes, Transactions, Notifications, Rewards } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    // Fetch all users (excluding sensitive data)
    const users = await db.select({
      id: Users.id,
      name: Users.name,
      email: Users.email,
      balance: Users.balance,
      createdAt: Users.createdAt,
      updatedAt: Users.updatedAt
    }).from(Users).orderBy(Users.createdAt)

    // Serialize dates for JSON response
    const serializedUsers = users.map(user => ({
      ...user,
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString()
    }))

    return NextResponse.json(serializedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const userIdInt = parseInt(userId)

    // Check if user exists
    const existingUser = await db.select().from(Users).where(eq(Users.id, userIdInt)).limit(1)
    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete related data first (cascade deletion without transactions)
    console.log(`Starting deletion process for user ID: ${userIdInt}`)

    try {
      // 1. Delete notifications (depends on user)
      await db.delete(Notifications).where(eq(Notifications.userId, userIdInt))
      console.log(`Deleted notifications for user ${userIdInt}`)

      // 2. Delete transactions (depends on user)
      await db.delete(Transactions).where(eq(Transactions.userId, userIdInt))
      console.log(`Deleted transactions for user ${userIdInt}`)

      // 3. Delete rewards (depends on user)
      await db.delete(Rewards).where(eq(Rewards.userId, userIdInt))
      console.log(`Deleted rewards for user ${userIdInt}`)

      // 4. Delete collected wastes where user is the collector
      await db.delete(CollectedWastes).where(eq(CollectedWastes.collectorId, userIdInt))
      console.log(`Deleted collected wastes for collector ${userIdInt}`)

      // 5. Update reports to remove collector references, then delete user's reports
      // First, update reports where this user was a collector (set collectorId to null)
      await db.update(Reports)
        .set({ collectorId: null })
        .where(eq(Reports.collectorId, userIdInt))
      console.log(`Updated reports to remove collector reference for user ${userIdInt}`)

      // Then delete reports created by this user
      await db.delete(Reports).where(eq(Reports.userId, userIdInt))
      console.log(`Deleted reports created by user ${userIdInt}`)

      // 6. Finally, delete the user
      const deletedUser = await db.delete(Users).where(eq(Users.id, userIdInt)).returning()
      console.log(`Deleted user ${userIdInt}`)

      if (!deletedUser[0]) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
      }

      return NextResponse.json({ 
        message: 'User and all related data deleted successfully',
        deletedUser: {
          id: deletedUser[0].id,
          name: deletedUser[0].name,
          email: deletedUser[0].email
        }
      })
    } catch (deleteError) {
      console.error('Error during cascade deletion:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete user and related data',
        details: deleteError instanceof Error ? deleteError.message : 'Unknown error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ 
      error: 'Failed to delete user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, email, password, balance } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate balance if provided
    if (balance !== undefined && (isNaN(balance) || balance < 0)) {
      return NextResponse.json({ error: 'Balance must be a non-negative number' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await db.select().from(Users)
      .where(eq(Users.id, id))
      .limit(1)
    
    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is already taken by another user
    const emailCheck = await db.select().from(Users)
      .where(eq(Users.email, email))
      .limit(1)
    
    if (emailCheck.length > 0 && emailCheck[0].id !== id) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      balance: balance !== undefined ? balance : existingUser[0].balance,
      updatedAt: new Date()
    }

    // Hash new password if provided
    if (password && password.trim() !== '') {
      updateData.password_hash = await bcrypt.hash(password, 10)
    }

    // Update user
    const updatedUser = await db.update(Users)
      .set(updateData)
      .where(eq(Users.id, id))
      .returning()

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Remove password hash from response and serialize dates
    const { password: _, ...userWithoutPassword } = updatedUser[0]
    const serializedUser = {
      ...userWithoutPassword,
      createdAt: userWithoutPassword.createdAt?.toISOString(),
      updatedAt: userWithoutPassword.updatedAt?.toISOString()
    }

    return NextResponse.json({
      message: 'User updated successfully',
      user: serializedUser
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ 
      error: 'Failed to update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const adminSession = request.cookies.get('admin_session')?.value
    if (!adminSession) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, balance = 0 } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await db.select().from(Users)
      .where(eq(Users.email, email))
      .limit(1)
    
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Hash password (using bcrypt for security)
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const newUser = await db.insert(Users)
      .values({
        name,
        email,
        password: hashedPassword,
        balance: balance || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    if (newUser.length === 0) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Remove password hash from response and serialize dates
    const { password: _, ...userWithoutPassword } = newUser[0]
    const serializedUser = {
      ...userWithoutPassword,
      createdAt: userWithoutPassword.createdAt?.toISOString(),
      updatedAt: userWithoutPassword.updatedAt?.toISOString()
    }

    return NextResponse.json(serializedUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
