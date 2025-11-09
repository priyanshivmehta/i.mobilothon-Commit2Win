import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // This function will now pass all matched requests to the updateSession handler.
  // All path-based logic is centralized in `lib/supabase/middleware.ts`.
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     *
     * This ensures that the middleware doesn't run on static assets,
     * improving performance.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
