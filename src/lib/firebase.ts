'use client';

import { initializeApp, getApps } from 'firebase/app';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as firebaseSignOut,
    User as FirebaseUser
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyArfPNoNgWcwYFo-hVOCq5P-YC3MiJghO4",
    authDomain: "zero2hero-5c177.firebaseapp.com",
    projectId: "zero2hero-5c177",
    storageBucket: "zero2hero-5c177.firebasestorage.app",
    messagingSenderId: "58387778294",
    appId: "1:58387778294:web:9740016b7123be81613ad7",
    measurementId: "G-2Y3Y95GW3L"
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Sign in with Google
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Sync with backend database
        const response = await fetch('/api/auth/firebase-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                firebaseUid: user.uid,
                email: user.email,
                name: user.displayName || user.email?.split('@')[0] || 'User',
                image: user.photoURL,
                authProvider: 'google'
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to sync user');
        }

        const data = await response.json();
        return { user: data.user, firebaseUser: user };
    } catch (error: any) {
        console.error('Google sign-in error:', error);
        throw error;
    }
};

// Sign out
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
};

// Get current Firebase user
export const getCurrentUser = (): FirebaseUser | null => {
    return auth.currentUser;
};

// Export auth instance
export { auth };
