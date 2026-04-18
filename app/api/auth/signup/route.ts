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

    // Since we need to send the email ourselves (custom SMTP via Resend),
    // we use generateLink to create the user and get the OTP.
    const { data: linkData, error: signUpError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          account_type: accountType,
          onboarding_completed: false,
        },
        redirectTo: `${request.nextUrl.origin}/login?verified=true`,
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

    if (linkData?.user?.id) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: linkData.user.id,
            full_name: fullName,
            role: accountType,
            is_verified: false,
            onboarding_details: {
              onboarding_completed: false,
              account_type: accountType,
              signup: {
                full_name: fullName,
                email,
              },
            },
          },
          { onConflict: "id" }
        )

      if (profileError) {
        console.error("[signup] Profile upsert failed:", profileError)
      }
    }

    // Now send the custom verification email using the OTP returned
    if (linkData?.properties?.email_otp) {
      try {
        const { sendEmail } = await import("@/lib/email")
        const { verificationEmail } = await import("@/lib/email/templates")

        await sendEmail({
          to: email,
          subject: "Verify your email – GymovaFlow",
          html: verificationEmail(linkData.properties.email_otp),
        })
      } catch (err) {
        console.error("Failed to send verification email:", err)
        // Note: the account is created, but email failed to send. User can request a new code.
      }
    }

    return NextResponse.json({
      success: true,
      userId: linkData?.user?.id,
      confirmationRequired: true // signup always requires confirmation
    })
  } catch (err) {
    console.error("Unexpected error in signup route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
