import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canAccessRoute } from '@/lib/permissions';
import type { UserRole } from '@/stores/authStore';

const PUBLIC_ROUTES = ['/login', '/forbidden'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('ksc-auth-status');
  const roleCookie = request.cookies.get('ksc-user-role');
  const isAuthenticated = authCookie?.value === 'true';
  const userRole = roleCookie?.value as UserRole | undefined;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Sudah login, coba akses /login → redirect ke dashboard
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Belum login, coba akses protected route → redirect ke /login
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Sudah login, cek apakah role punya akses ke route ini
  if (isAuthenticated && !isPublicRoute && !canAccessRoute(userRole, pathname)) {
    return NextResponse.redirect(new URL('/forbidden', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
