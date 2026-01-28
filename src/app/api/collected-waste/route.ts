import { NextRequest, NextResponse } from 'next/server'
import { saveCollectedWaste } from '@/lib/db/actions'
import { getAuthUser } from '@/lib/customAuth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse and validate request body
    const { reportId, verificationResult } = await request.json();
    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // Try to save the collected waste
    try {
      const collectedWaste = await saveCollectedWaste(reportId, user.id, verificationResult);
      return NextResponse.json(collectedWaste);
    } catch (error) {
      console.error('Failed to save collected waste:', error);
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to save collected waste' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing waste collection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}










