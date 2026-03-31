import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Redirect from login/signup if already logged in
  if ((pathname === "/login" || pathname === "/signup") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, trainer_status")
      .eq("id", user.id)
      .single()

    if (profile?.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    if (profile?.role === "trainer") {
        if (profile.trainer_status === "approved") {
            return NextResponse.redirect(new URL("/trainer", request.url))
        }
        if (profile.trainer_status === "pending") {
            return NextResponse.redirect(new URL("/trainer-pending", request.url))
        }
        if (profile.trainer_status === "rejected") {
            return NextResponse.redirect(new URL("/trainer-rejected", request.url))
        }
    }
    return NextResponse.next()
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/signup", "/trainer/:path*", "/dashboard/:path*"],
}
