'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, Lock, X } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/auth/check', {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.isAuthenticated) {
                        setIsAuthenticated(true);
                    } else {
                        setShowModal(true);
                    }
                } else {
                    setShowModal(true);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                setShowModal(true);
            } finally {
                setIsLoading(false);
            }
        }

        checkAuth();
    }, []);

    const handleSignIn = () => {
        router.push('/auth/signin');
    };

    const handleSignUp = () => {
        router.push('/auth/signup');
    };

    const handleGoHome = () => {
        router.push('/');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated && showModal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                {/* Modal Backdrop */}
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />

                {/* Modal */}
                <div className="fixed z-50 w-full max-w-md mx-4">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-fade-in">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 text-center relative">
                            <button
                                onClick={handleGoHome}
                                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="h-8 w-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
                            <p className="text-green-100 mt-2">Please sign in to access this page</p>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-8">
                            <p className="text-gray-600 text-center mb-6">
                                You need to be signed in to view this content. Create an account or sign in to continue.
                            </p>

                            {/* Buttons */}
                            <div className="space-y-3">
                                <Button
                                    onClick={handleSignIn}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-medium rounded-xl flex items-center justify-center gap-2"
                                >
                                    <LogIn className="h-5 w-5" />
                                    Sign In
                                </Button>

                                <Button
                                    onClick={handleSignUp}
                                    variant="outline"
                                    className="w-full border-2 border-green-600 text-green-600 hover:bg-green-50 py-6 text-lg font-medium rounded-xl flex items-center justify-center gap-2"
                                >
                                    <UserPlus className="h-5 w-5" />
                                    Create Account
                                </Button>
                            </div>

                            {/* Footer */}
                            <div className="mt-6 text-center">
                                <button
                                    onClick={handleGoHome}
                                    className="text-gray-500 hover:text-gray-700 text-sm underline"
                                >
                                    Return to Home Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
