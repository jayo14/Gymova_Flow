import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { sendEmail } from "@/lib/email/resend"
import { welcomeEmail } from "@/lib/email/templates"
import { getUserByEmail } from "@/lib/getUserByEmail"

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

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

    // Look up the user by email via efficient DB function.
    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 400 }
      )
    }

    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: "This email is already verified. Please sign in." },
        { status: 409 }
      )
    }

    const hashedToken = hashToken(token.trim())

    // Find matching token in DB.
    const { data: tokenRows, error: tokenError } = await supabaseAdmin
      .from("auth_tokens")
      .select("id, expires_at")
      .eq("user_id", user.id)
      .eq("type", "verification")
      .eq("token", hashedToken)
      .limit(1)

    if (tokenError || !tokenRows || tokenRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 400 }
      )
    }

    const tokenRow = tokenRows[0]

    if (new Date(tokenRow.expires_at) < new Date()) {
      // Clean up expired token.
      await supabaseAdmin.from("auth_tokens").delete().eq("id", tokenRow.id)
      return NextResponse.json(
        { error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Mark the user's email as confirmed via admin API.
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    )

    if (updateError) {
      console.error("Email confirmation failed:", updateError)
      return NextResponse.json({ error: "Verification failed." }, { status: 500 })
    }

    // Delete the used token.
    await supabaseAdmin.from("auth_tokens").delete().eq("id", tokenRow.id)

    // Determine account type from user metadata.
    const accountType =
      (user.raw_user_meta_data as { account_type?: string } | undefined)?.account_type ===
      "trainer"
        ? "trainer"
        : "client"

    // For clients: ensure their profile row exists.
    if (accountType === "client") {
      const fullName =
        (user.raw_user_meta_data as { full_name?: string } | undefined)?.full_name ||
        email.split("@")[0]

      await supabaseAdmin
        .from("profiles")
        .upsert({ id: user.id, full_name: fullName, role: "client" }, { onConflict: "id" })

      // Send welcome email.
      const firstName = fullName.split(" ")[0] || "there"
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gymovaflow.com"
      try {
        await sendEmail({
          to: email,
          subject: "Welcome to GymovaFlow! 🎉",
          html: welcomeEmail(firstName, siteUrl),
        })
      } catch (emailError) {
        console.error("Welcome email failed (non-fatal):", emailError)
        // Don't fail verification if welcome email fails - user is already verified
      }
    }

    return NextResponse.json({ success: true, accountType })
  } catch (err) {
    console.error("Unexpected error in verify-email route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
