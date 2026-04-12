import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { sendEmail } from "@/lib/email"
import { welcomeEmail } from "@/lib/email/templates"
import { getUserByEmail } from "@/lib/getUserByEmail"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token } = body

    if (!email || !token) {
      return NextResponse.json(
        { error: "Missing required fields: email, token" },
        { status: 400 }
      )
    }

    // Use Supabase's native verifyOtp. 
    // This will mark the user as confirmed in auth.users
    const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      email,
      token: token.trim(),
      type: "signup",
    })

    if (verifyError) {
      console.error("[verify-email] Supabase verification failed:", verifyError)
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 400 }
      )
    }

    const { user } = verifyData
    if (!user) {
      return NextResponse.json({ error: "Verification failed." }, { status: 500 })
    }

    // Determine account type from user metadata.
    const accountType =
      (user.user_metadata as { account_type?: string } | undefined)?.account_type ===
      "trainer"
        ? "trainer"
        : "client"

    // For clients: ensure their profile row exists.
    if (accountType === "client") {
      const fullName = (user.user_metadata as { full_name?: string } | undefined)?.full_name || email.split("@")[0]

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert({ id: user.id, full_name: fullName, role: "client" }, { onConflict: "id" })

      if (profileError) {
        console.error("[verify-email] Profile upsert failed:", profileError)
      }
    }

    return NextResponse.json({ success: true, accountType })
  } catch (err) {
    console.error("Unexpected error in verify-email route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
