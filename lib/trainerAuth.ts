import { getProfile } from "@/lib/supabase/profiles"
import { getDashboardRouteForProfile, isApprovedTrainerProfile } from "@/lib/rbac"
import type { Profile, TrainerStatus } from "@/types/profile"

export type { TrainerStatus }

export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getProfile(userId)
  if (error || !data) return null
  return data
}

export async function getIsApprovedTrainer(userId: string): Promise<boolean> {
  const profile = await getUserProfile(userId)
  return isApprovedTrainerProfile(profile)
}

export async function getTrainerStatus(userId: string): Promise<TrainerStatus | null> {
  const profile = await getUserProfile(userId)
  if (!profile || profile.role !== "trainer") return null
  return profile.trainer_status ?? null
}

export async function getRoleRedirectPath(userId: string): Promise<string> {
  const profile = await getUserProfile(userId)
  return getDashboardRouteForProfile(profile)
}
