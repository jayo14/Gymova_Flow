import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, fullName, accountType } = body

    if (!email || !password || !fullName || !accountType) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, fullName, accountType" },
        { status: 400 }
      )
    }

    if (!["client", "trainer"].includes(accountType)) {
      return NextResponse.json({ error: "Invalid accountType" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      )
    }

    // Use Supabase's native signUp. This will:
    // 1. Create the user in auth.users
    // 2. Automatically send a verification email via the configured Supabase SMTP
    // 3. Handle token/OTP generation internally
    const { data, error: signUpError } = await supabaseAdmin.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_type: accountType,
          onboarding_completed: false,
        },
        // If your Supabase is configured for 'Double Opt-In', it will send the email.
        // If 'Email OTP' is enabled, it will send a code.
        // You can specify where the user goes after clicking a link (optional for OTP)
        emailRedirectTo: `${request.nextUrl.origin}/login?verified=true`,
      },
    })

    if (signUpError) {
      const message = signUpError.message.toLowerCase()
      if (message.includes("already") || message.includes("duplicate") || message.includes("exists")) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: signUpError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      userId: data.user?.id,
      // If data.session is null, it means confirmation is required
      confirmationRequired: !data.session 
    })
  } catch (err) {
    console.error("Unexpected error in signup route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
