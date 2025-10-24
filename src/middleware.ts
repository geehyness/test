// src/app/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if request is from an iframe (preview mode)
  const isIframePreview = request.nextUrl.searchParams.get('preview') === 'true'

  // If it's an iframe preview, ONLY allow customer-menu
  if (isIframePreview) {
    if (pathname.startsWith('/customer-menu')) {
      return NextResponse.next()
    }
    // Block any other routes in iframe preview
    return new NextResponse('Access denied in preview mode', { status: 403 })
  }

  // Normal routing for non-iframe requests
  // Allow all routes under /pos
  if (pathname.startsWith('/pos')) {
    return NextResponse.next()
  }

  // Allow customer menu page
  if (pathname.startsWith('/customer-menu')) {
    return NextResponse.next()
  }

  // Redirect all other routes to /pos/login
  return NextResponse.redirect(new URL('/pos/login', request.url))
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}