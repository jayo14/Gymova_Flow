"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Bell,
  Calendar,
  Clock,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  User,
} from "lucide-react"

import { useAuth } from "@/components/auth/AuthProvider"
import { DashboardSidebar, DashboardSidebarLink } from "@/components/dashboard/Sidebar"
import { DashboardTopNav } from "@/components/dashboard/TopNav"
import { getProfile } from "@/lib/supabase/profiles"
import { getDashboardRouteForProfile } from "@/lib/rbac"
import { supabase } from "@/lib/supabaseClient"
import type { Profile } from "@/types/profile"

const sidebarLinks: DashboardSidebarLink[] = [
  { href: "/trainer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trainer/availability", label: "My availability", icon: Clock },
  { href: "/trainer/sessions", label: "Sessions", icon: Calendar },
  { href: "/trainer/locations", label: "My locations", icon: MapPin },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/profile", label: "Profile", icon: User },
]

function getTrainerTitle(pathname: string): string {
  if (pathname.startsWith("/trainer/availability")) return "My availability"
  if (pathname.startsWith("/trainer/sessions")) return "Sessions"
  if (pathname.startsWith("/trainer/locations")) return "My locations"
  return "Trainer dashboard"
}

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileReady, setProfileReady] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const { user, session, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!session?.user) {
      router.replace("/login")
      return
    }

    getProfile(session.user.id).then(({ data }) => {
      setProfile(data)
      setProfileReady(true)

      const nextPath = getDashboardRouteForProfile(data)
      if (nextPath !== "/trainer" && pathname.startsWith("/trainer")) {
        router.replace(nextPath)
      }
    })
  }, [loading, pathname, router, session])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  if (loading || !profileReady || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Loading trainer dashboard...</span>
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
        userName={(user?.user_metadata as { full_name?: string })?.full_name || user?.email || null}
        userEmail={user?.email ?? null}
        onLogout={handleLogout}
        links={sidebarLinks}
        title="Trainer"
        signedInAs="trainer"
      />
      <div className="min-w-0">
        <DashboardTopNav
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
          title={getTrainerTitle(pathname)}
        />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
