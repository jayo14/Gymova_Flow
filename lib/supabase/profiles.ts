import { supabase } from "@/lib/supabaseClient"
import { isOnboardingCompleted } from "@/lib/onboarding"
import type { Profile } from "@/types/profile"

const AVATAR_BUCKET = "avatars"

/**
 * Fetch a single user profile. Safe to call client-side (anon key, subject to RLS).
 */
export async function getProfile(
  userId: string
): Promise<{ data: Profile | null; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, avatar_url, role, trainer_status, created_at, onboarding_completed, onboarding_completed_at, is_verified, verified_at, onboarding_details"
    )
    .eq("id", userId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  if (!data) return { data: null, error: null }

  const row = data as {
    id: string
    full_name: string | null
    avatar_url: string | null
    role: Profile["role"]
    trainer_status: Profile["trainer_status"]
    created_at: string | null
    onboarding_completed: boolean | null
    onboarding_completed_at: string | null
    is_verified: boolean | null
    verified_at: string | null
    onboarding_details: Record<string, unknown> | null
  }

  const normalized: Profile = {
    id: row.id,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    role: row.role,
    trainer_status: row.trainer_status,
    is_verified: row.is_verified === true,
    verified_at: row.verified_at ?? null,
    onboarding_details: row.onboarding_details ?? null,
    created_at: row.created_at,
    onboarding_completed: row.onboarding_completed === true || isOnboardingCompleted(data),
    onboarding_completed_at: row.onboarding_completed_at ?? null,
  }
  return { data: normalized, error: null }
}

/**
 * Upsert profile fields for the given user. Only updates the supplied fields.
 */
export async function upsertProfile(
  userId: string,
  updates: Partial<Pick<Profile, "full_name" | "avatar_url">>
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...updates }, { onConflict: "id" })

  if (error) return { error: error.message }
  return { error: null }
}

export async function uploadAvatar(userId: string, file: File): Promise<{ data: string | null; error: string | null }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const path = `${userId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    return { data: null, error: uploadError.message }
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return { data: data.publicUrl, error: null }
}

/**
 * Batch-fetch id, full_name and avatar_url for a set of user IDs.
 */
export async function getProfilesByIds(
  ids: string[]
): Promise<{ data: Pick<Profile, "id" | "full_name" | "avatar_url">[]; error: string | null }> {
  if (ids.length === 0) return { data: [], error: null }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids)

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []) as Pick<Profile, "id" | "full_name" | "avatar_url">[],
    error: null,
  }
}
