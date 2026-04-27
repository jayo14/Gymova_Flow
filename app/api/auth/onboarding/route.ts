import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (profileError) {
      console.error("[onboarding-api] Profile update failed:", profileError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError || !user) {
      console.error("[onboarding-api] Auth user fetch failed:", authError)
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    }

    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...user.user_metadata,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      }
    })

    if (metadataError) {
      console.error("[onboarding-api] Auth metadata update failed:", metadataError)
      return NextResponse.json({ error: "Failed to update auth metadata" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Unexpected error in onboarding route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
