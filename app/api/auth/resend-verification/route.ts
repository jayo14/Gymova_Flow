import { NextRequest, NextResponse } from "next/server"
import { createHash, randomInt } from "crypto"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { sendEmail } from "@/lib/email/resend"
import { verificationEmail } from "@/lib/email/templates"
import { getUserByEmail } from "@/lib/getUserByEmail"

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Missing required field: email" }, { status: 400 })
    }

    // Look up the user by email via efficient DB function.
    const user = await getUserByEmail(email)

    if (!user) {
      // Return success to avoid user enumeration.
      return NextResponse.json({ success: true })
    }

    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: "This email is already verified. Please sign in." },
        { status: 409 }
      )
    }

    // Rate-limit: allow at most one resend per minute.
    const { data: existing } = await supabaseAdmin
      .from("auth_tokens")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("type", "verification")
      .order("created_at", { ascending: false })
      .limit(1)

    if (existing && existing.length > 0) {
      const lastSent = new Date(existing[0].created_at).getTime()
      if (Date.now() - lastSent < 60 * 1000) {
        return NextResponse.json(
          { error: "Please wait at least 1 minute before requesting a new code." },
          { status: 429 }
        )
      }
    }

    // Delete old verification tokens for this user.
    await supabaseAdmin
      .from("auth_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("type", "verification")

    // Generate new OTP.
    const otp = String(randomInt(100000, 1000000))
    const hashedOtp = hashToken(otp)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    const { error: tokenError } = await supabaseAdmin.from("auth_tokens").insert({
      user_id: user.id,
      token: hashedOtp,
      type: "verification",
      expires_at: expiresAt.toISOString(),
    })

    if (tokenError) {
      console.error("Token insert failed:", tokenError)
      return NextResponse.json({ error: "Could not resend code." }, { status: 500 })
    }

    try {
      await sendEmail({
        to: email,
        subject: "Verify your GymovaFlow account",
        html: verificationEmail(otp),
      })
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError)
      return NextResponse.json(
        { error: "Could not send verification email. Please try again later." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Unexpected error in resend-verification route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
