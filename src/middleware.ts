import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAuthUser } from '@/lib/customAuth'

export async function middleware(request: NextRequest) {
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/register', 
    '/api/auth/check',
    '/api/users',
    '/auth/signin',
    '/auth/signup',
    '/',  
    '/leaderboard', 
    '/rewards', 
    '/collect', 
    '/messages', 
    '/favicon.ico',
    '/_next'  
  ];

  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const user = await getAuthUser(request);
  
  const response = NextResponse.next();

  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return response;
  }

  if (!user) {
    const loginUrl = new URL('/auth/signin', request.url);
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
    '/profile/:path*', 
    '/settings/:path*', 
    '/admin/:path*', 
    '/notifications/:path*', 
    '/verify/:path*' 
  ]
}
