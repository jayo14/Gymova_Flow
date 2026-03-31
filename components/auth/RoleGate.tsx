"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/AuthProvider"
import {
  type AppDashboardRole,
  getDashboardRouteForProfile,
  normalizeUserRole,
} from "@/lib/rbac"
import { getProfile } from "@/lib/supabase/profiles"

interface RoleGateProps {
  allowedRoles: AppDashboardRole[]
  requireApprovedTrainer?: boolean
  loadingMessage?: string
  children: React.ReactNode
}

export function RoleGate({
  allowedRoles,
  requireApprovedTrainer = true,
  loadingMessage = "Checking access...",
  children,
}: RoleGateProps) {
  const { session, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function validateAccess() {
      if (loading) return

      if (!session?.user) {
        router.replace("/login")
        return
      }

      const { data: profile } = await getProfile(session.user.id)
      if (cancelled) return

      const role = normalizeUserRole(profile?.role)
      const isAllowedRole = role !== null && allowedRoles.includes(role)
      const trainerApproved = role !== "trainer" || !requireApprovedTrainer || profile?.trainer_status === "approved"

      if (!isAllowedRole || !trainerApproved) {
        const fallback = getDashboardRouteForProfile(profile)
        if (fallback !== pathname) {
          router.replace(fallback)
        }
        return
      }

      setAuthorized(true)
    }

    setAuthorized(false)
    void validateAccess()

    return () => {
      cancelled = true
    }
  }, [allowedRoles, loading, pathname, requireApprovedTrainer, router, session])

  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">{loadingMessage}</span>
      </div>
    )
  }

  return <>{children}</>
}
