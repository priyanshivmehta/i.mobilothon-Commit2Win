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

  // Redirect logic based on authentication and role
  if (!user && !path.startsWith('/auth') && path !== '/') {
    // Redirect to signin if not authenticated
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  if (user && path.startsWith('/auth')) {
    // Redirect authenticated users away from auth pages
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
