import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes yang bisa diakses tanpa auth
const PUBLIC_ROUTES = ['/login'];

// Routes yang wajib auth
const PROTECTED_PREFIX = [
  '/',
  '/pekerjaan',
  '/tenaga-ahli',
  '/alat',
  '/dokumen',
  '/perusahaan',
  '/arsip',
  '/tender',
  '/non-tender',
  '/berita-acara',
  '/kategori-dan-tahapan',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for Next.js internals and static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Baca ksc-auth dari cookies (Zustand persist menulis ke localStorage,
  // tapi middleware hanya bisa baca cookies — kita set cookie saat login via client)
  const authCookie = request.cookies.get('ksc-auth-status');
  const isAuthenticated = authCookie?.value === 'true';

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Sudah login, coba akses /login → redirect ke dashboard
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Belum login, coba akses protected route → redirect ke /login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match semua request path kecuali:
     * - api routes
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - public files dengan ekstensi
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
