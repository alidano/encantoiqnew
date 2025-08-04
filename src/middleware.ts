import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/register',
  '/',
];

// Define admin-only routes
const adminRoutes = [
  '/admin',
  '/admin/users',
  '/admin/submissions',
];

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/patients',
  '/automations',
  '/communications',
  '/chat',
  '/reports',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next();
  }

  // For now, we'll implement basic route protection
  // In a full implementation, you'd verify the auth token here
  
  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, we'll let the client-side handle the auth check
  // This is because Firebase Auth state is handled on the client side
  if (protectedRoutes.some(route => pathname.startsWith(route)) || 
      adminRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Default: allow the request to continue
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};