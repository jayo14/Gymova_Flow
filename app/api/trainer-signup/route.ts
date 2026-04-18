import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      fullName,
      email,
      certifications,
      experience,
      hourlyRate,
      bio,
      specializations,
    } = body

    if (!userId || !fullName || !email) {
      return NextResponse.json(
        { error: "Missing required fields: userId, fullName, email" },
        { status: 400 }
      )
    }

    const completedAt = new Date().toISOString()

    // Upsert the profile row with trainer role and pending status.
    // Uses service role key — bypasses RLS regardless of email confirmation state.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          full_name: fullName,
          role: "trainer",
          trainer_status: "pending",
          onboarding_completed: true,
          onboarding_completed_at: completedAt,
          onboarding_details: {
            onboarding_completed: true,
            onboarding_completed_at: completedAt,
            account_type: "trainer",
            signup: {
              full_name: fullName,
              email,
            },
            trainer: {
              specializations: Array.isArray(specializations) ? specializations : [],
              certifications: certifications || null,
              experience: experience || null,
              hourly_rate: hourlyRate ? Number(hourlyRate) : null,
              bio: bio || null,
            },
          },
        },
        { onConflict: "id" }
      )

    if (profileError) {
      console.error("Trainer profile upsert failed:", profileError)
      return NextResponse.json(
        { error: "Failed to create trainer profile: " + profileError.message },
        { status: 500 }
      )
    }

    // Insert trainer application for admin review.
    const { error: appError } = await supabaseAdmin
      .from("trainer_applications")
      .insert({
        user_id: userId,
        name: fullName,
        email,
        status: "pending",
        certifications: certifications ? [certifications] : [],
        specializations: Array.isArray(specializations) ? specializations : [],
        experience: experience || null,
        hourly_rate: hourlyRate ? Number(hourlyRate) : null,
        bio: bio || null,
      })

    if (appError) {
      console.error("Trainer application insert failed:", appError)
      return NextResponse.json(
        { error: "Failed to save trainer application: " + appError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Unexpected error in trainer-signup route:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
