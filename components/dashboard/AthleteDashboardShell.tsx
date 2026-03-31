"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Calendar,
  Clock,
  LayoutDashboard,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react"

import { useAuth } from "@/components/auth/AuthProvider"
import { DashboardSidebar, DashboardSidebarLink } from "@/components/dashboard/Sidebar"
import { DashboardTopNav } from "@/components/dashboard/TopNav"
import { Button } from "@/components/ui/button"
import { getDashboardRouteForProfile, normalizeUserRole } from "@/lib/rbac"
import { getProfile } from "@/lib/supabase/profiles"
import { supabase } from "@/lib/supabaseClient"
import { cn } from "@/lib/utils"
import type { Profile } from "@/types/profile"

const athleteSidebarLinks: DashboardSidebarLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trainers", label: "Find Trainers", icon: Search },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { href: "/ai-coach", label: "AI Coach", icon: Sparkles },
]

const trainerSidebarLinks: DashboardSidebarLink[] = [
  { href: "/trainer/availability", label: "My availability", icon: Clock },
  { href: "/trainer/sessions", label: "Sessions", icon: Calendar },
  { href: "/trainer/locations", label: "My locations", icon: MapPin },
]

const trainerSharedDashboardRoutes = new Set(["/dashboard/profile", "/dashboard/notifications"])

function getDefaultTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/bookings")) return "My Bookings"
  if (pathname.startsWith("/dashboard/profile")) return "Profile"
  if (pathname.startsWith("/dashboard/notifications")) return "Notifications"
  if (pathname.startsWith("/dashboard/trainer")) return "Trainer Redirect"
  if (pathname.startsWith("/ai-coach")) return "AI Coach"
  if (pathname.startsWith("/trainers")) return "Find Trainers"
  if (pathname.startsWith("/messages")) return "Messages"
  return "Dashboard"
}

interface AthleteDashboardShellProps {
  children: React.ReactNode
  title?: string
  contentClassName?: string
}

export function AthleteDashboardShell({
  children,
  title,
  contentClassName,
}: AthleteDashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileReady, setProfileReady] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!session) {
      router.replace("/login")
      return
    }

    getProfile(session.user.id).then(({ data }) => {
      setProfile(data)
      setProfileReady(true)

      if (pathname.startsWith("/dashboard")) {
        const nextPath = getDashboardRouteForProfile(data)
        const allowTrainerSharedRoute =
          data?.role === "trainer" &&
          data?.trainer_status === "approved" &&
          trainerSharedDashboardRoutes.has(pathname)

        if (!allowTrainerSharedRoute && nextPath !== "/dashboard" && nextPath !== pathname) {
          router.replace(nextPath)
        }
      }
    })
  }, [loading, pathname, router, session])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  const normalizedRole = normalizeUserRole(profile?.role)
  const sidebarLinks = useMemo(
    () =>
      normalizedRole === "trainer" && profile?.trainer_status === "approved"
        ? trainerSidebarLinks
        : athleteSidebarLinks,
    [normalizedRole, profile?.trainer_status]
  )

  if (loading || (!session && typeof window !== "undefined") || !profileReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Loading your dashboard...</span>
      </div>
    )
  }

  if (profile?.role === "trainer" && profile?.trainer_status === "pending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-6">
            <h1 className="text-xl font-semibold text-foreground mb-2">Application under review</h1>
            <p className="text-muted-foreground text-sm">
              Your trainer application is being reviewed. You will be notified when it is accepted.
            </p>
          </div>
          <Button variant="outline" className="w-full border-border" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-background lg:grid"
      style={{ gridTemplateColumns: isSidebarCollapsed ? "5rem minmax(0,1fr)" : "16rem minmax(0,1fr)" }}
    >
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
        userName={profile?.full_name || session?.user?.email || null}
        userEmail={session?.user?.email ?? null}
        avatarUrl={profile?.avatar_url ?? null}
        onLogout={handleLogout}
        links={sidebarLinks}
        title="GymovaFlow"
        signedInAs={normalizedRole ?? undefined}
        homeHref={normalizedRole === "trainer" ? "/trainer" : "/dashboard"}
      />
      <div className="min-w-0">
        <DashboardTopNav
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
          title={title || getDefaultTitle(pathname)}
        />
        <main className={cn("p-4 lg:p-8", contentClassName)}>{children}</main>
      </div>
    </div>
  )
}
