import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, createToken } from '@/lib/customAuth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 422 });
    }

    // Find user
    const result = await db
      .select()
      .from(Users)
      .where(eq(Users.email, email));

    const user = result[0];
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!user.password || !isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create response with user data
    const response = NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      }
    });

    // Create JWT token with user data
    const token = createToken({ 
      id: user.id,
      email: user.email,
      name: user.name
    });

    // Set authentication cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return response;
  } catch (error) {
    console.error('Unexpected error during login:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}




