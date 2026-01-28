import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Users } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { createToken } from '@/lib/customAuth';

export async function POST(request: NextRequest) {
    try {
        const payload = await request.json();
        const { firebaseUid, email, name, image, authProvider } = payload;

        console.log('Firebase sync request:', {
            email,
            firebaseUid,
            authProvider,
            namePart: name ? name.substring(0, 3) : 'undefined'
        });

        // Validate required fields
        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user already exists (by email or firebaseUid)
        console.log('Checking for existing user with email:', email);
        const existingUsers = await db
            .select()
            .from(Users)
            .where(eq(Users.email, email))
            .limit(1);

        console.log('Existing users found:', existingUsers.length);

        let user;

        if (existingUsers.length > 0) {
            // User exists - update with Firebase info if needed
            user = existingUsers[0];

            // Update user with latest info from Google
            if (authProvider === 'google') {
                console.log('Updating existing user with Google info');
                await db
                    .update(Users)
                    .set({
                        name: name || user.name,
                        image: image || user.image,
                        firebaseUid: firebaseUid,
                        authProvider: authProvider || 'google',
                        updatedAt: new Date(),
                    })
                    .where(eq(Users.id, user.id));

                // Refresh user data
                const updatedUsers = await db
                    .select()
                    .from(Users)
                    .where(eq(Users.id, user.id))
                    .limit(1);
                user = updatedUsers[0];
            }
        } else {
            // Create new user for Google auth
            console.log('Creating new user for Google auth');
            const newUsers = await db
                .insert(Users)
                .values({
                    email,
                    name: name || email.split('@')[0],
                    password: '', // Empty password for Google auth users
                    firebaseUid: firebaseUid,
                    authProvider: authProvider || 'google',
                    image: image || null,
                    balance: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            user = newUsers[0];
        }

        // Create JWT token for session
        const token = createToken({
            id: user.id,
            email: user.email,
            name: user.name,
        });

        // Create response with user data
        const response = NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
            },
            isNewUser: existingUsers.length === 0,
        });

        // Set authentication cookie
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60, // 30 days
        });

        return response;
    } catch (error: any) {
        console.error('Firebase sync detailed error:', {
            message: error.message,
            stack: error.stack,
            code: error.code, // PG error codes
            detail: error.detail,
            hint: error.hint
        });
        return NextResponse.json(
            { error: 'Failed to sync user', details: error.message },
            { status: 500 }
        );
    }
}
