import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Users, Transactions, Notifications, CollectedWastes, Reports, Rewards } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get password from request body
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required for account deletion' }, { status: 400 });
    }

    // Get user's current password hash from database
    const userData = await db.select({
      password: Users.password
    }).from(Users).where(eq(Users.id, user.id));

    if (!userData[0] || !userData[0].password) {
      return NextResponse.json({ error: 'User data not found' }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData[0].password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    console.log('Password verified successfully, proceeding with account deletion...');

    // Delete all user data sequentially (neon-http doesn't support transactions)
    try {
      // Delete user's collected waste records first (has foreign keys to both users and reports)
      await db.delete(CollectedWastes).where(eq(CollectedWastes.collectorId, user.id));
      
      // Delete user's transactions
      await db.delete(Transactions).where(eq(Transactions.userId, user.id));
      
      // Delete user's notifications
      await db.delete(Notifications).where(eq(Notifications.userId, user.id));
      
      // Delete user's rewards
      await db.delete(Rewards).where(eq(Rewards.userId, user.id));
      
      // Update reports to remove collector references (don't delete reports they collected)
      await db.update(Reports)
        .set({ collectorId: null })
        .where(eq(Reports.collectorId, user.id));
      
      // Delete reports created by the user
      await db.delete(Reports).where(eq(Reports.userId, user.id));
      
      // Finally delete the user account
      await db.delete(Users).where(eq(Users.id, user.id));
      
    } catch (deleteError) {
      console.error('Error during deletion process:', deleteError);
      throw new Error('Failed to delete user data');
    }

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
