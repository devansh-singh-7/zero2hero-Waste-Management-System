'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface User {
  id: number;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      // First try to fetch auth status from API (source of truth)
      const response = await fetch('/api/auth/check');
      if (!response.ok) {
        throw new Error(`Authentication check failed: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response type from server');
      }

      const data = await response.json();

      if (data.isAuthenticated && data.user) {
        setUser(data.user);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        // API says not authenticated - clear everything
        setUser(null);
        localStorage.removeItem('userEmail');
        localStorage.removeItem('user');
      }
    } catch (err) {
      // On API error, check localStorage as fallback but mark as potential stale
      console.error('Auth check error:', err);
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        try {
          // Only use cache if API call failed (network error), not if API returned 401
          setUser(JSON.parse(cachedUser));
        } catch (e) {
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      localStorage.removeItem('userEmail');
      setError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response type from server');
      }

      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('userEmail', data.user.email);
      } else {
        throw new Error('Invalid login response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Clear user state and ALL localStorage items
      setUser(null);
      localStorage.removeItem('userEmail');
      localStorage.removeItem('user');

      // Clear any session storage as well
      sessionStorage.clear();
    } catch (err) {
      setError('Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
