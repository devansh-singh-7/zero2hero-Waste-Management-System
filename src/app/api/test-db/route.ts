import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database connection not initialized' }, { status: 500 })
    }

    // Try to query the users table
    const result = await db.select({ count: users.id }).from(users)
    return NextResponse.json({ status: 'Database connection successful', userCount: result.length })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ error: 'Database connection failed', details: error }, { status: 500 })
  }
}
