import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createToken } from '@/lib/customAuth';

// Firebase Admin SDK for secure token verification
// NOTE: Requires firebase-admin package: npm install firebase-admin
// and environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
let firebaseAdmin: any = null;

async function getFirebaseAdmin() {
    if (firebaseAdmin) return firebaseAdmin;

    try {
        const mod = await import('firebase-admin');
        firebaseAdmin = mod.default || mod;

        if (firebaseAdmin.getApps().length === 0) {
            // Check for required environment variables
            const projectId = process.env.FIREBASE_PROJECT_ID;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const privateKey = process.env.FIREBASE_PRIVATE_KEY;

            if (!projectId || !clientEmail || !privateKey) {
                console.warn('Firebase Admin credentials not configured - using legacy mode');
                return null;
            }

            firebaseAdmin.initializeApp({
                credential: firebaseAdmin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
        }
        return firebaseAdmin;
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        // Try to get Firebase Admin for token verification
        const admin = await getFirebaseAdmin();

        let verifiedUid: string | null = null;
        let verifiedEmail: string | null = null;
        let verifiedName: string | null = null;
        let verifiedPicture: string | null = null;

        // Check for Authorization header with Firebase ID token
        const authHeader = request.headers.get('Authorization');

        if (admin && authHeader?.startsWith('Bearer ')) {
            // SECURE MODE: Verify the Firebase ID token
            const idToken = authHeader.split('Bearer ')[1];

            try {
                const decodedToken = await admin.auth().verifyIdToken(idToken);
                verifiedUid = decodedToken.uid;
                verifiedEmail = decodedToken.email || null;
                verifiedName = decodedToken.name || decodedToken.email?.split('@')[0] || null;
                verifiedPicture = decodedToken.picture || null;

                console.log('Firebase token verified for:', verifiedEmail);
            } catch (tokenError: any) {
                console.error('Token verification failed:', tokenError.code);
                if (tokenError.code === 'auth/id-token-expired') {
                    return NextResponse.json({ error: 'Token expired' }, { status: 401 });
                }
                return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
            }
        } else {
            // LEGACY MODE: Accept request body (for backwards compatibility during migration)
            // TODO: Remove this fallback once all clients send Authorization header
            console.warn('Using legacy authentication mode - upgrade client to send ID token');

            const payload = await request.json();
            const { firebaseUid, email, name, image, authProvider } = payload;

            if (!email) {
                return NextResponse.json({ error: 'Email is required' }, { status: 400 });
            }

            verifiedUid = firebaseUid;
            verifiedEmail = email;
            verifiedName = name || email.split('@')[0];
            verifiedPicture = image;
        }

        if (!verifiedEmail) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Type-safe email after validation
        const userEmail: string = verifiedEmail;

        // Check if user already exists
        console.log('Checking for existing user with email:', userEmail);
        const existingUsers = await db
            .select()
            .from(Users)
            .where(eq(Users.email, userEmail))
            .limit(1);

        console.log('Existing users found:', existingUsers.length);

        let user;

        if (existingUsers.length > 0) {
            // User exists - update with latest info
            user = existingUsers[0];

            console.log('Updating existing user with Google info');
            await db
                .update(Users)
                .set({
                    name: verifiedName || user.name,
                    image: verifiedPicture || user.image,
                    firebaseUid: verifiedUid ?? undefined,
                    authProvider: 'google',
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
        } else {
            // Create new user
            console.log('Creating new user for Google auth');
            const newUsers = await db
                .insert(Users)
                .values({
                    email: userEmail,
                    name: verifiedName || userEmail.split('@')[0],
                    password: '', // Empty password for Google auth users
                    firebaseUid: verifiedUid ?? undefined,
                    authProvider: 'google',
                    image: verifiedPicture ?? undefined,
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
            code: error.code,
            detail: error.detail,
            hint: error.hint
        });
        return NextResponse.json(
            { error: 'Failed to sync user', details: error.message },
            { status: 500 }
        );
    }
}
