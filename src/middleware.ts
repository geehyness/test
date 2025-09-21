// src/app/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // The matcher configuration below handles excluding public files.
  // This function only needs to handle the routing logic for pages.

  // Allow all routes under /pos
  if (pathname.startsWith('/pos')) {
    return NextResponse.next()
  }

  // Redirect all other routes to /pos/login
  return NextResponse.redirect(new URL('/pos/login', request.url))
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Any file with a file extension (e.g., .png, .svg, .js, .css)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}