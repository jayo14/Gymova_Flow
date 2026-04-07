import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

async function getUserByEmail(email: string) {
  const { data } = await supabaseAdmin.rpc("get_auth_user_by_email", {
    p_email: email.toLowerCase(),
  })
  if (!data || (Array.isArray(data) && data.length === 0)) return null
  return Array.isArray(data) ? data[0] : data
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, token, password } = body

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: "Missing required fields: email, token, password" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      )
    }

    // Find the user by email via efficient DB function.
    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      )
    }

    const hashedToken = hashToken(token.trim())

    // Look up the token.
    const { data: tokenRows, error: tokenError } = await supabaseAdmin
      .from("auth_tokens")
      .select("id, expires_at")
      .eq("user_id", user.id)
      .eq("type", "reset")
      .eq("token", hashedToken)
      .limit(1)

    if (tokenError || !tokenRows || tokenRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset link." },
        { status: 400 }
      )
    }

    const tokenRow = tokenRows[0]

    if (new Date(tokenRow.expires_at) < new Date()) {
      await supabaseAdmin.from("auth_tokens").delete().eq("id", tokenRow.id)
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Update the user's password via admin API.
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password }
    )

    if (updateError) {
      console.error("Password update failed:", updateError)
      return NextResponse.json({ error: "Password reset failed." }, { status: 500 })
    }

    // Delete the used token.
    await supabaseAdmin.from("auth_tokens").delete().eq("id", tokenRow.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Unexpected error in reset-password route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
