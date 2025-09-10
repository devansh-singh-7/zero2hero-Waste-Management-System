import { NextRequest, NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { Users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSettings = await db.select({
      publicProfileVisible: Users.publicProfileVisible,
      profileSearchable: Users.profileSearchable,
      showRealName: Users.showRealName,
      personalStatsVisible: Users.personalStatsVisible,
      dataSharing: Users.dataSharing,
      environmentalTracking: Users.environmentalTracking,
      collectionHistoryRetention: Users.collectionHistoryRetention,
    }).from(Users).where(eq(Users.id, user.id)).limit(1);

    if (userSettings.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(userSettings[0]);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      publicProfileVisible,
      profileSearchable,
      showRealName,
      personalStatsVisible,
      dataSharing,
      environmentalTracking,
      collectionHistoryRetention,
    } = body;

    await db.update(Users)
      .set({
        publicProfileVisible: publicProfileVisible ?? true,
        profileSearchable: profileSearchable ?? true,
        showRealName: showRealName ?? false,
        personalStatsVisible: personalStatsVisible ?? true,
        dataSharing: dataSharing ?? 'anonymous',
        environmentalTracking: environmentalTracking ?? true,
        collectionHistoryRetention: collectionHistoryRetention ?? '1year',
        updatedAt: new Date(),
      })
      .where(eq(Users.id, user.id));

    return NextResponse.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
