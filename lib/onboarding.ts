type ProfileOnboardingLike = {
  onboarding_completed?: boolean | null
  onboarding_details?: Record<string, unknown> | null
}

export function isOnboardingCompleted(profile: ProfileOnboardingLike | null | undefined): boolean {
  if (profile?.onboarding_completed === true) return true

  const details = profile?.onboarding_details
  if (!details || typeof details !== "object") return false

  return (details as { onboarding_completed?: unknown }).onboarding_completed === true
}
