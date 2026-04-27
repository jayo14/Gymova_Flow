import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { isOnboardingCompleted } from "@/lib/onboarding"
import { isMissingProfileColumnError } from "@/lib/supabase/profileSchema"

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
    const fullName =
      (user.user_metadata as { full_name?: string } | undefined)?.full_name || email.split("@")[0]
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          full_name: fullName,
          role: accountType, is_verified: true, verified_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )

    if (profileError) {
      console.error("[verify-email] Profile upsert failed:", profileError)
    }

    const metadataOnboardingCompleted =
      ((user.user_metadata as { onboarding_completed?: unknown } | undefined)?.onboarding_completed) === true

    let onboardingCompleted = metadataOnboardingCompleted
    let trainerStatus: "pending" | "approved" | "rejected" | null = null

    const { data: profileState, error: profileStateError } = await supabaseAdmin
      .from("profiles")
      .select("onboarding_completed, onboarding_details, trainer_status")
      .eq("id", user.id)
      .maybeSingle()

    if (profileStateError && !isMissingProfileColumnError(profileStateError)) {
      console.error("[verify-email] Profile state query failed:", profileStateError)
    }

    if (profileStateError && isMissingProfileColumnError(profileStateError)) {
      const { data: fallbackProfileState } = await supabaseAdmin
        .from("profiles")
        .select("trainer_status")
        .eq("id", user.id)
        .maybeSingle()
      trainerStatus = (fallbackProfileState?.trainer_status as "pending" | "approved" | "rejected" | null | undefined) ?? null
    } else {
      onboardingCompleted =
        onboardingCompleted ||
        profileState?.onboarding_completed === true ||
        isOnboardingCompleted(profileState)
      trainerStatus = (profileState?.trainer_status as "pending" | "approved" | "rejected" | null | undefined) ?? null
    }

    return NextResponse.json({
      success: true,
      accountType,
      session: verifyData.session,
      onboardingCompleted,
      trainerStatus,
    })
  } catch (err) {
    console.error("Unexpected error in verify-email route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
