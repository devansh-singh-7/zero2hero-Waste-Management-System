import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/customAuth';
import { db } from '@/lib/db';
import { Users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Fetch complete user data from database
    const userData = await db
      .select({
        id: Users.id,
        name: Users.name,
        email: Users.email,
        balance: Users.balance,
        createdAt: Users.createdAt,
        updatedAt: Users.updatedAt,
        image: Users.image
      })
      .from(Users)
      .where(eq(Users.id, session.user.id))
      .limit(1);

    if (!userData || userData.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Serialize dates for JSON response
    const serializedProfile = {
      ...userData[0],
      createdAt: userData[0].createdAt?.toISOString(),
      updatedAt: userData[0].updatedAt?.toISOString()
    }

    return NextResponse.json({ profile: serializedProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const body = await request.json()
    const { name, image } = body
    
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 503 })
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (name !== undefined) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      }
      updateData.name = name.trim()
    }
    
    if (image !== undefined) {
      updateData.image = image
    }
    
    // Update user in database
    const updatedUser = await db
      .update(Users)
      .set(updateData)
      .where(eq(Users.id, session.user.id))
      .returning({
        id: Users.id,
        name: Users.name,
        email: Users.email,
        balance: Users.balance,
        createdAt: Users.createdAt,
        updatedAt: Users.updatedAt,
        image: Users.image
      });

    if (!updatedUser || updatedUser.length === 0) {
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: 'Profile updated successfully',
      profile: updatedUser[0]
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

















