import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user has metadata like account_type, if not they might need onboarding
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // If it's a new user via OAuth, they might not have account_type yet.
        // We can default them to client or redirect to a special 'finishing-signup' page.
        // For now, redirect to onboarding if incomplete.
        const onboardingCompleted = user.user_metadata?.onboarding_completed === true
        if (!onboardingCompleted) {
           return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error('OAuth callback error:', error.message)
  }

  // return the user to an error page or home
  return NextResponse.redirect(`${origin}/login?error=OAuth failed`)
}
