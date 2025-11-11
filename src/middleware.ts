// src/app/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const appMode = process.env.NEXT_PUBLIC_APP_MODE || 'pos';

  // Allow API routes, static files, and image optimization to pass through
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || /\..*$/.test(pathname)) {
    return NextResponse.next();
  }
  
  // Handle iframe preview for customer menu customization
  const isIframePreview = request.nextUrl.searchParams.get('preview') === 'true';
  if (isIframePreview) {
    if (pathname.startsWith('/customer-menu')) {
      return NextResponse.next();
    }
    // Block any other route in preview mode
    return new NextResponse('Access denied in preview mode', { status: 403 });
  }

  // Routing logic for ADMIN mode
  if (appMode === 'admin') {
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    // If user is trying to access a non-admin page, redirect them to admin dashboard
    if (!pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Default routing logic for POS mode
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/pos', request.url));
  }
  // Allow access to all necessary POS-related routes
  if (pathname.startsWith('/pos') || pathname.startsWith('/customer-menu') || pathname.startsWith('/payment')) {
    return NextResponse.next();
  }
  
  // If a non-admin user tries to access an unknown path, redirect them to the POS entry
  return NextResponse.redirect(new URL('/pos', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - files with extensions (e.g. .svg, .png)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}