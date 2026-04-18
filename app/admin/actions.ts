"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { sendEmail } from "@/lib/email/resend"
import { trainerApprovedEmail, trainerRejectedEmail } from "@/lib/email/templates"

const ADMIN_COOKIE_NAME = "admin_session"

const VALID_ROLES = ["client", "trainer", "admin"] as const
const VALID_TRAINER_STATUSES = ["pending", "approved", "rejected"] as const
const AI_PROVIDER_CONFIGS = [
  { provider: "openai", display_name: "ChatGPT (OpenAI)", default_model: "gpt-4.1-mini" },
  { provider: "anthropic", display_name: "Claude (Anthropic)", default_model: "claude-3-7-sonnet-latest" },
  { provider: "google", display_name: "Gemini (Google)", default_model: "gemini-2.5-flash" },
  { provider: "xai", display_name: "Grok (xAI)", default_model: "grok-3-mini" },
  { provider: "deepseek", display_name: "DeepSeek", default_model: "deepseek-chat" },
] as const

type ValidRole = (typeof VALID_ROLES)[number]
type ValidTrainerStatus = (typeof VALID_TRAINER_STATUSES)[number]

export async function requireAdminSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (!session) {
    redirect("/login")
  }
}

/**
 * Verify that userId belongs to an admin profile and set the admin session cookie.
 * Called from the client login page after successful Supabase auth.
 */
export async function createAdminSession(userId: string): Promise<{ error?: string }> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (error || profile?.role !== "admin") {
    return { error: "Not authorized as admin." }
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  return {}
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
  redirect("/login")
}

async function ensureTrainerRecord(userId: string) {
  const { data: existingTrainer, error: trainerLookupError } = await supabaseAdmin
    .from("trainer_records")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (trainerLookupError || existingTrainer) return

  const [{ data: profile }, authResult] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),
    supabaseAdmin.auth.admin.getUserById(userId),
  ])

  const email = authResult.data.user?.email ?? null
  const name = profile?.full_name || email?.split("@")[0] || "Trainer"

  await supabaseAdmin.from("trainer_records").insert({
    user_id: userId,
    name,
    specialty: "Personal Trainer",
    specializations: [],
    certifications: [],
    rating: 0,
    reviews: 0,
    price: 0,
    location: null,
    bio: null,
    experience: null,
    clients_helped: 0,
    availability: {},
    reviews_list: [],
  })
}

export async function listAdminUsers() {
  await requireAdminSession()

  const [{ data: profiles, error: profileError }, authResult] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, avatar_url, role, trainer_status, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  if (profileError) {
    throw new Error(profileError.message)
  }

  if (authResult.error) {
    throw new Error(authResult.error.message)
  }

  const authUsers = authResult.data.users ?? []
  const authMap = new Map(authUsers.map((user) => [user.id, user]))

  return (profiles ?? []).map((profile) => {
    const authUser = authMap.get(profile.id)
    return {
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      role: profile.role,
      trainer_status: profile.trainer_status,
      created_at: profile.created_at,
      email: authUser?.email ?? null,
      email_confirmed_at: authUser?.email_confirmed_at ?? null,
      last_sign_in_at: authUser?.last_sign_in_at ?? null,
    }
  })
}

export async function updateUserRole(formData: FormData) {
  await requireAdminSession()

  const userId = String(formData.get("user_id") ?? "")
  const role = String(formData.get("role") ?? "") as ValidRole
  const trainerStatusInput = String(formData.get("trainer_status") ?? "")

  if (!userId || !VALID_ROLES.includes(role)) {
    return { error: "Invalid user update request." }
  }

  const trainerStatus =
    role === "trainer"
      ? ((VALID_TRAINER_STATUSES.includes(trainerStatusInput as ValidTrainerStatus)
          ? trainerStatusInput
          : "pending") as ValidTrainerStatus)
      : null

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ role, trainer_status: trainerStatus })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  if (role === "trainer" && trainerStatus === "approved") {
    await ensureTrainerRecord(userId)
  }

  revalidatePath("/admin/users")
  revalidatePath("/trainer")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteUserAction(formData: FormData) {
  await requireAdminSession()

  const userId = String(formData.get("user_id") ?? "")
  if (!userId) {
    return { error: "User id is required." }
  }

  const { data: trainerRow } = await supabaseAdmin
    .from("trainer_records")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (trainerRow?.id) {
    await supabaseAdmin.from("bookings").delete().eq("trainer_id", trainerRow.id)
    await supabaseAdmin.from("trainer_availability").delete().eq("trainer_id", trainerRow.id)
    await supabaseAdmin.from("trainer_locations").delete().eq("trainer_id", trainerRow.id)
    await supabaseAdmin.from("trainer_records").delete().eq("user_id", userId)
  }

  await supabaseAdmin.from("bookings").delete().eq("client_id", userId)
  await supabaseAdmin.from("trainer_applications").delete().eq("user_id", userId)
  await supabaseAdmin.from("profiles").delete().eq("id", userId)

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (authError) {
    return { error: authError.message }
  }

  revalidatePath("/admin/users")
  return { success: true }
}

export async function listAiModelConfigs() {
  await requireAdminSession()

  const { data, error } = await supabaseAdmin
    .from("ai_model_configs")
    .select("provider, display_name, model_name, api_key, is_enabled, updated_at")
    .order("display_name")

  if (error) {
    throw new Error(error.message)
  }

  const rows = data ?? []
  const existing = new Map(rows.map((row) => [row.provider, row]))

  return AI_PROVIDER_CONFIGS.map((config) => {
    const row = existing.get(config.provider)
    return {
      provider: config.provider,
      display_name: row?.display_name ?? config.display_name,
      model_name: row?.model_name ?? config.default_model,
      api_key: row?.api_key ?? "",
      is_enabled: row?.is_enabled ?? false,
      updated_at: row?.updated_at ?? null,
      default_model: config.default_model,
    }
  })
}

export async function saveAiModelConfig(formData: FormData) {
  await requireAdminSession()

  const provider = String(formData.get("provider") ?? "")
  const apiKey = String(formData.get("api_key") ?? "").trim()
  const modelName = String(formData.get("model_name") ?? "").trim()
  const config = AI_PROVIDER_CONFIGS.find((item) => item.provider === provider)

  if (!config) {
    return { error: "Unsupported AI provider." }
  }

  const { error } = await supabaseAdmin.from("ai_model_configs").upsert(
    {
      provider,
      display_name: config.display_name,
      model_name: modelName || config.default_model,
      api_key: apiKey,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider" }
  )

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/ai-models")
  return { success: true }
}

export async function toggleAiModel(formData: FormData) {
  await requireAdminSession()

  const provider = String(formData.get("provider") ?? "")
  const enabled = String(formData.get("enabled") ?? "false") === "true"
  const config = AI_PROVIDER_CONFIGS.find((item) => item.provider === provider)

  if (!config) {
    return { error: "Unsupported AI provider." }
  }

  const { error } = await supabaseAdmin.from("ai_model_configs").upsert(
    {
      provider,
      display_name: config.display_name,
      model_name: config.default_model,
      is_enabled: enabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider" }
  )

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/ai-models")
  return { success: true }
}

export async function approveTrainer(
  applicationId: string,
  userId: string
): Promise<{ error?: string }> {
  await requireAdminSession()

  const { error: appError } = await supabaseAdmin
    .from("trainer_applications")
    .update({ status: "approved" })
    .eq("id", applicationId)

  if (appError) {
    return { error: "Failed to update application: " + appError.message }
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ role: "trainer", trainer_status: "approved" })
    .eq("id", userId)

  if (profileError) {
    return {
      error: "Application approved but profile update failed: " + profileError.message,
    }
  }

  const { data: application, error: fetchError } = await supabaseAdmin
    .from("trainer_applications")
    .select("name, email, specializations, certifications, experience, hourly_rate, bio, location")
    .eq("id", applicationId)
    .single()

  if (fetchError || !application) {
    console.error("Could not fetch application data for trainer_records upsert:", fetchError)
    return {}
  }

  const specializations: string[] = Array.isArray(application.specializations)
    ? application.specializations
    : []

  const trainerPayload = {
    user_id: userId,
    name: application.name,
    specialty: specializations[0] ?? "Personal Trainer",
    specializations,
    certifications: Array.isArray(application.certifications)
      ? application.certifications
      : [],
    experience: application.experience ?? null,
    price: application.hourly_rate ?? null,
    bio: application.bio ?? null,
    location: application.location ?? null,
    rating: 0,
    reviews: 0,
    clients_helped: 0,
    availability: {},
    reviews_list: [],
  }

  const { data: existingTrainer } = await supabaseAdmin
    .from("trainer_records")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle()

  if (existingTrainer) {
    const { error: updateError } = await supabaseAdmin
      .from("trainer_records")
      .update(trainerPayload)
      .eq("user_id", userId)

    if (updateError) {
      console.error("trainer_records update failed after approval:", updateError)
      return { error: "Trainer approved but public profile update failed: " + updateError.message }
    }
  } else {
    const { error: insertError } = await supabaseAdmin
      .from("trainer_records")
      .insert(trainerPayload)

    if (insertError) {
      console.error("trainer_records insert failed after approval:", insertError)
      return { error: "Trainer approved but public profile creation failed: " + insertError.message }
    }
  }



  return {}
}

export async function rejectTrainer(
  applicationId: string,
  userId: string
): Promise<{ error?: string }> {
  await requireAdminSession()

  const { error: appError } = await supabaseAdmin
    .from("trainer_applications")
    .update({ status: "rejected" })
    .eq("id", applicationId)

  if (appError) {
    return { error: "Failed to update application: " + appError.message }
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ role: "trainer", trainer_status: "rejected" })
    .eq("id", userId)

  if (profileError) {
    console.error("Profile rejection status update failed:", profileError)
  }

  const { data: application, error: fetchError } = await supabaseAdmin
    .from("trainer_applications")
    .select("name, email")
    .eq("id", applicationId)
    .single()



  return {}
}
