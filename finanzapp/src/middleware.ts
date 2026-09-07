/**
 * Next.js Middleware — Auth protection
 * Protects dashboard routes, redirects unauthenticated users to login.
 */
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public routes
  const publicRoutes = ['/login', '/registro', '/api/registro', '/api/auth'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // API auth routes should always pass through
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // If not logged in and trying to access protected route
  if (!isLoggedIn && !isPublicRoute && pathname !== '/') {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login/register
  if (isLoggedIn && (pathname === '/login' || pathname === '/registro' || pathname === '/')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
