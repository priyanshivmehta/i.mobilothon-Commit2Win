import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const path = request.nextUrl.pathname

  // Allow root and landing page to pass through unconditionally
  if (path === '/' || path === '/landing') {
    return supabaseResponse
  }

  // Skip auth check for static assets and API routes to improve performance
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.includes('.') // images, fonts, etc
  ) {
    return supabaseResponse
  }

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  let userProfile = null

  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser

    // Get user profile with role
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role, employee_id, department')
        .eq('id', user.id)
        .single()
      
      userProfile = data
    }
  } catch (error) {
    // If auth check fails, just continue without blocking
    console.error('Auth check failed:', error)
  }

  // IMPORTANT: Always allow root path and landing page to pass through
  // Let page.tsx handle the redirect logic
  if (path === '/' || path === '/landing') {
    return supabaseResponse
  }

  // Public paths that don't require authentication
  const isAuthPath = path.startsWith('/auth/')
  const isPrivacySetup = path.startsWith('/privacy-consent-setup')

  // Redirect logic based on authentication and role
  if (!user) {
    // Allow auth pages
    if (isAuthPath) {
      return supabaseResponse
    }

    // Redirect to role-specific auth based on attempted page access
    const url = request.nextUrl.clone()
    if (path.startsWith('/fleet-management-console')) {
      url.pathname = '/auth/fleet/signin'
    } else if (path.startsWith('/driver-attention-monitor')) {
      url.pathname = '/auth/driver/signin'
    } else if (isPrivacySetup) {
      // Redirect to landing if trying to access privacy setup without auth
      url.pathname = '/landing'
    } else {
      // Default to landing page for other protected pages
      url.pathname = '/landing'
    }
    return NextResponse.redirect(url)
  }

  if (user && isAuthPath) {
    // Redirect authenticated users away from auth pages directly to their dashboard
    const url = request.nextUrl.clone()
    if (userProfile?.role === 'EMPLOYEE') {
      url.pathname = '/fleet-management-console'
    } else {
      url.pathname = '/driver-attention-monitor'
    }
    return NextResponse.redirect(url)
  }

  if (user && userProfile) {
    // Role-based route protection
    // Only USER role is restricted to driver monitor
    // EMPLOYEE can access both pages
    if (path.startsWith('/fleet-management-console') && userProfile.role === 'USER') {
      const url = request.nextUrl.clone()
      url.pathname = '/driver-attention-monitor'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
