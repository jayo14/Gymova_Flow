export type UserRole = "client" | "trainer" | "admin"
export type TrainerStatus = "pending" | "approved" | "rejected"

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole | null
  trainer_status: TrainerStatus | null
  onboarding_completed: boolean
  onboarding_completed_at: string | null
  is_verified: boolean
  email_verified_at: string | null
  onboarding_details: Record<string, unknown> | null
  created_at: string | null
}
