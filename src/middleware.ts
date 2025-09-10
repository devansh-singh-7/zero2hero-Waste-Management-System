import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/customAuth'

export async function middleware(request: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/users',
    '/auth/signin',
    '/auth/signup',
    '/',  // Homepage
    '/favicon.ico',
    '/_next'  // Next.js assets
  ];

  // Check if current path is public
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get user authentication state
  const user = await getAuthUser(request);
  
  // Create response
  const response = NextResponse.next();

  // For API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return response;
  }

  // For protected pages
  if (!user) {
    const loginUrl = new URL('/auth/signin', request.url);
    // Save the current URL to redirect back after login
    if (!request.nextUrl.pathname.startsWith('/auth/')) {
      loginUrl.searchParams.set('from', request.nextUrl.pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/report',
    '/collect',
    '/leaderboard',
    '/messages',
    '/rewards',
    '/settings'
  ]
}
