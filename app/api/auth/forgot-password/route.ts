import { NextRequest, NextResponse } from "next/server"
import { createHash, randomBytes } from "crypto"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { sendEmail } from "@/lib/email/resend"
import { resetPasswordEmail } from "@/lib/email/templates"

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

function getBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured && configured.length > 0) return configured.replace(/\/$/, "")
  const proto = request.headers.get("x-forwarded-proto") ?? "https"
  const host = request.headers.get("host") ?? "localhost:3000"
  const protocol = host.startsWith("localhost") ? "http" : proto
  return `${protocol}://${host}`
}

async function getUserByEmail(email: string) {
  const { data, error } = await supabaseAdmin.rpc("get_auth_user_by_email", {
    p_email: email.toLowerCase(),
  })
  if (error) {
    console.error("[forgot-password] getUserByEmail RPC error:", error)
    throw new Error("Failed to look up user by email.")
  }
  if (!data || (Array.isArray(data) && data.length === 0)) return null
  return Array.isArray(data) ? data[0] : data
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Missing required field: email" }, { status: 400 })
    }

    // Find user via efficient DB function — respond generically to avoid email enumeration.
    const user = await getUserByEmail(email)

    if (!user) {
      return NextResponse.json({ success: true })
    }

    // Rate-limit: one reset request per minute per user.
    const { data: existing } = await supabaseAdmin
      .from("auth_tokens")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("type", "reset")
      .order("created_at", { ascending: false })
      .limit(1)

    if (existing && existing.length > 0) {
      const lastSent = new Date(existing[0].created_at).getTime()
      if (Date.now() - lastSent < 60 * 1000) {
        return NextResponse.json(
          { error: "Please wait at least 1 minute before requesting another reset link." },
          { status: 429 }
        )
      }
    }

    // Delete old reset tokens for this user.
    await supabaseAdmin
      .from("auth_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("type", "reset")

    // Generate a secure random 32-byte hex token.
    const rawToken = randomBytes(32).toString("hex")
    const hashedToken = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    const { error: tokenError } = await supabaseAdmin.from("auth_tokens").insert({
      user_id: user.id,
      token: hashedToken,
      type: "reset",
      expires_at: expiresAt.toISOString(),
    })

    if (tokenError) {
      console.error("Token insert failed:", tokenError)
      return NextResponse.json({ error: "Could not send reset link." }, { status: 500 })
    }

    const baseUrl = getBaseUrl(request)
    const resetLink = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`

    await sendEmail({
      to: email,
      subject: "Reset your GymovaFlow password",
      html: resetPasswordEmail(resetLink),
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Unexpected error in forgot-password route:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
