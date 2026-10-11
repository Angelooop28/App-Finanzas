/**
 * Next.js Middleware — Auth protection + RBAC
 * Protects dashboard routes, admin routes, and redirects unauthenticated users.
 */
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/registro', '/recuperar-password', '/api/registro', '/api/auth', '/api/password-reset', '/api/health'];
const ADMIN_ROUTES = ['/admin'];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // API auth routes always pass through
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/health') || pathname.startsWith('/api/password-reset')) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // Check if route is admin-only
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

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

  // Admin route protection — validate role
  if (isAdminRoute && isLoggedIn) {
    const userRole = req.auth?.user?.role;
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
