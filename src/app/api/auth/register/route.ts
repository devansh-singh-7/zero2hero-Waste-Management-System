import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, createToken } from '@/lib/customAuth';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { name, email, password } = body;
    
    // Validate input
    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: {
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined
        }
      }, { status: 422 });
    }

    // Validate email format
    if (!email.includes('@')) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: { email: 'Invalid email format' }
      }, { status: 422 });
    }

    // Check if email already exists
    const [existingUser] = await db
      .select({ id: Users.id })
      .from(Users)
      .where(eq(Users.email, email));

    if (existingUser) {
      return NextResponse.json({
        error: 'Email already registered'
      }, { status: 409 });
    }

    try {
      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const [user] = await db.insert(Users)
        .values({
          name: name || email.split('@')[0],
          email,
          password: hashedPassword,
          createdAt: new Date(),
        })
        .returning({
          id: Users.id,
          email: Users.email,
          name: Users.name
        });

      if (!user?.id) {
        throw new Error('Failed to create user - no ID returned');
      }

      // Create JWT token and format response
      const token = createToken({ id: user.id });
      const response = NextResponse.json({ 
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }, { status: 201 });

      // Set auth cookie with JWT token
      response.cookies.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 // 30 days to match rest of system
      });

      return response;
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      throw dbError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      error: 'Failed to create account',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}