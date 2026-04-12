import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Missing required field: email" }, { status: 400 })
    }

    // Use Supabase's native resend method. 
    // This will send either a 'signup' confirmation or 'forgot_password' etc.
    // depending on the 'type' parameter.
    const { error } = await supabaseAdmin.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/login?verified=true`,
      }
    })

    if (error) {
       // Ignore if already verified (Supabase might return error if user is already confirmed)
      if (error.message.includes("already confirmed")) {
        return NextResponse.json(
          { error: "This email is already verified. Please sign in." },
          { status: 409 }
        )
      }
      
      if (error.status === 429) {
        return NextResponse.json(
          { error: "Please wait at least 1 minute before requesting a new code." },
          { status: 429 }
        )
      }

      console.error("[resend-verification] Supabase resend failed:", error)
      return NextResponse.json({ error: "Could not resend code." }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Unexpected error in resend-verification route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
