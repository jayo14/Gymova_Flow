export type UserRole = "student" | "client" | "trainer" | "admin"
export type TrainerStatus = "pending" | "approved" | "rejected"

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole | null
  trainer_status: TrainerStatus | null
  created_at: string | null
}
