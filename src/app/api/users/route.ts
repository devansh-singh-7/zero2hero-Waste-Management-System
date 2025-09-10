import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/customAuth'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting user registration ===');
    
    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body parsed:', { ...body, password: '[REDACTED]' });
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, email, password } = body;
    
    // Validate input
    if (!email || !password || !name) {
      console.log('Validation failed: Missing required fields');
      return NextResponse.json({ 
        error: 'Validation failed',
        details: {
          name: !name ? 'Name is required' : undefined,
          email: !email ? 'Email is required' : undefined,
          password: !password ? 'Password is required' : undefined
        }
      }, { status: 422 });
    }

    // Validate email format if provided
    if (email && !email.includes('@')) {
      return NextResponse.json({ 
        error: 'Validation failed',
        details: { email: 'Invalid email format' }
      }, { status: 422 });
    }

    // Check database connection
    if (!db) {
      console.error('Database connection not available');
      return NextResponse.json({ 
        error: 'Service unavailable', 
        details: 'Database connection failed'
      }, { status: 503 });
    }

    // Check existing user
    try {
      console.log('Checking existing email');
      const [existingUser] = await db.select({
        id: Users.id,
        email: Users.email
      })
      .from(Users)
      .where(eq(Users.email, email));

      if (existingUser) {
        console.log('Email already registered');
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
    } catch (e) {
      console.error('Error checking existing user:', e);
      return NextResponse.json({ 
        error: 'Database error', 
        details: e instanceof Error ? e.message : 'Error checking existing user'
      }, { status: 500 });
    }

    // Create new user
    console.log('Creating new user');
    try {
      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create the user
      const [newUser] = await db.insert(Users).values({
        email: email,
        name: name,
        password_hash: hashedPassword,
        createdAt: new Date()
      }).returning({
        id: Users.id,
        name: Users.name,
        email: Users.email
      });

      if (!newUser?.id) {
        throw new Error('User creation failed - no user returned');
      }

      console.log('User created successfully:', newUser.id);
      
      // Create successful response
      return NextResponse.json({ 
        id: newUser.id, 
        name: newUser.name, 
        email: newUser.email 
      }, { status: 201 });

    } catch (e) {
      console.error('Error creating user:', e);
      return NextResponse.json({ 
        error: 'Failed to create user',
        details: e instanceof Error ? e.message : 'Unknown database error'
      }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('Sign up error:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}


