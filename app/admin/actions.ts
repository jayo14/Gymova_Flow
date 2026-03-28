"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

const ADMIN_COOKIE_NAME = "admin_session"
const DEFAULT_EMAIL = "admin@gymovaflow.com"
const DEFAULT_PASSWORD = "admin123"

function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL ?? DEFAULT_EMAIL,
    password: process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD,
  }
}

async function requireAdminSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  if (!session) {
    redirect("/admin/login")
  }
}

export async function adminLogin(formData: FormData) {
  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const { email: validEmail, password: validPassword } = getAdminCredentials()
  if (email !== validEmail || password !== validPassword) {
    return { error: "Invalid email or password." }
  }

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  redirect("/admin")
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
  redirect("/admin/login")
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

  return {}
}
