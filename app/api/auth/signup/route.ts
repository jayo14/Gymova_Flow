import { NextRequest, NextResponse } from "next/server"
import { createHash, randomInt } from "crypto"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { sendEmail } from "@/lib/email/resend"
import { verificationEmail } from "@/lib/email/templates"

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

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

    // Create the user via admin API so we can skip Supabase's built-in confirmation email.
    const { data: createData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: {
          full_name: fullName,
          account_type: accountType,
          onboarding_completed: false,
        },
      })

    if (createError) {
      const isDuplicate =
        createError.message?.toLowerCase().includes("already") ||
        createError.message?.toLowerCase().includes("duplicate") ||
        createError.message?.toLowerCase().includes("exists")

      if (isDuplicate) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        )
      }

      console.error("User creation failed:", createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    const userId = createData.user?.id
    if (!userId) {
      return NextResponse.json(
        { error: "User creation succeeded but no user ID was returned." },
        { status: 500 }
      )
    }

    // Generate 6-digit OTP.
    const otp = String(randomInt(100000, 1000000))
    const hashedOtp = hashToken(otp)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Remove any existing verification tokens for this user before inserting a new one.
    await supabaseAdmin
      .from("auth_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("type", "verification")

    const { error: tokenError } = await supabaseAdmin.from("auth_tokens").insert({
      user_id: userId,
      token: hashedOtp,
      type: "verification",
      expires_at: expiresAt.toISOString(),
    })

    if (tokenError) {
      console.error("Token insert failed:", tokenError)
      // Clean up the created user to avoid orphaned accounts.
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json(
        { error: "Failed to store verification token." },
        { status: 500 }
      )
    }

    // Send verification email via Resend.
    const emailFrom = process.env.EMAIL_FROM ?? "noreply@mail.gymovaflow.com"
    await sendEmail({
      to: email,
      subject: "Verify your GymovaFlow account",
      html: verificationEmail(otp, emailFrom),
    })

    return NextResponse.json({ success: true, userId })
  } catch (err) {
    console.error("Unexpected error in signup route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
