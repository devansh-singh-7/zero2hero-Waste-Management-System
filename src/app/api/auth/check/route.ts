import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/customAuth';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ isAuthenticated: false }, { status: 401 });
    }

    return NextResponse.json({ 
      isAuthenticated: true, 
      user: session.user 
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ 
      isAuthenticated: false, 
      error: 'Failed to check authentication' 
    }, { status: 500 });
  }
}
