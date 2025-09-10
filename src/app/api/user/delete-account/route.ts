import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Users, Transactions, Notifications, CollectedWastes, WasteCollectionTasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Start transaction to delete all user data
    await db.transaction(async (tx) => {
      // Delete user's transactions
      await tx.delete(Transactions).where(eq(Transactions.userId, user.id));
      
      // Delete user's notifications
      await tx.delete(Notifications).where(eq(Notifications.userId, user.id));
      
      // Delete user's collected waste records
      await tx.delete(CollectedWastes).where(eq(CollectedWastes.collectorId, user.id));
      
      // Delete waste collection tasks created by user
      await tx.delete(WasteCollectionTasks).where(eq(WasteCollectionTasks.createdBy, user.id));
      
      // Finally delete the user account
      await tx.delete(Users).where(eq(Users.id, user.id));
    });

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
