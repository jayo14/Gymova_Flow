import type { Profile, TrainerStatus, UserRole } from "@/types/profile"

export type AppDashboardRole = "client" | "trainer" | "admin"

export function normalizeUserRole(role: UserRole | null | undefined): AppDashboardRole | null {
  if (role === "admin") return "admin"
  if (role === "trainer") return "trainer"
  if (role === "client") return "client"
  return null
}

export function getDashboardRouteForProfile(profile: Profile | null | undefined): string {
  const normalizedRole = normalizeUserRole(profile?.role)

  if (normalizedRole === "admin") return "/admin"

  if (normalizedRole === "trainer") {
    if (profile?.trainer_status === "approved") return "/trainer"
    if (profile?.trainer_status === "pending") return "/trainer-pending"
    if (profile?.trainer_status === "rejected") return "/trainer-rejected"
  }

  return "/dashboard"
}

export function canAccessDashboardRoute(profile: Profile | null | undefined, pathname: string): boolean {
  const normalizedRole = normalizeUserRole(profile?.role)

  if (pathname.startsWith("/admin")) return normalizedRole === "admin"
  if (pathname.startsWith("/trainer")) return normalizedRole === "trainer" && profile?.trainer_status === "approved"
  if (pathname.startsWith("/dashboard")) return normalizedRole === "client" || normalizedRole === "trainer" || normalizedRole === "admin"
  return true
}

export function isApprovedTrainerProfile(profile: Profile | null | undefined): boolean {
  return normalizeUserRole(profile?.role) === "trainer" && profile?.trainer_status === "approved"
}

export type { TrainerStatus }
